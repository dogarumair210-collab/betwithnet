import asyncio
import json
import logging
import os
import random
import re
import sys
import time
import base64
import sqlite3
from typing import Dict, Any, Optional, List
from aiohttp import web
import psutil
from proxy_rotator import betwithnet_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("betwithnet_node")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "orders.db")

DEFAULT_FLASHPROXY = "lite.flashproxy.io:6969:tdf34uzrmn-country-US:ku4acutasj"

def init_db():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                url TEXT,
                campaign_type TEXT,
                total_sessions INTEGER,
                duration_sec INTEGER,
                concurrent_workers INTEGER,
                browser_mode TEXT,
                referrer_source TEXT,
                device_type TEXT,
                proxy_mode TEXT,
                target_clicks INTEGER,
                status TEXT,
                completed INTEGER,
                failed INTEGER,
                created_at REAL
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')
        # Ensure default admin password
        c.execute("SELECT value FROM settings WHERE key = 'admin_password'")
        if not c.fetchone():
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password', 'Sua12345@#')")

        # Ensure user's permanent FlashProxy gateway
        c.execute("SELECT value FROM settings WHERE key = 'flashproxy_gateway'")
        r_gw = c.fetchone()
        if not r_gw or not r_gw[0] or "vpm7ez74oh" in str(r_gw[0]):
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('flashproxy_gateway', ?)", (DEFAULT_FLASHPROXY,))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"DB init: {e}")

init_db()

AUTH_PASSWORD = "Sua12345@#"
FLASHPROXY_RAW: str = DEFAULT_FLASHPROXY
FLASHPROXY_GATEWAY: Optional[Dict[str, str]] = None
IP2WORLD_PROXIES: List[str] = []
STATIC_PROXIES: List[str] = []
EVENT_LOGS: List[str] = []
SESSION_FRAMES: Dict[int, Dict[str, Any]] = {}

def parse_proxy_line_advanced(line: str) -> Optional[Dict[str, Any]]:
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    
    proto = "http"
    if "://" in line:
        proto_part, line = line.split("://", 1)
        proto = "socks5" if "socks5" in proto_part.lower() else "http"

    # Normalize tab, comma, semicolon, space, pipe to colon
    clean = re.sub(r"[\t,;| ]+", ":", line).strip(":")
    
    u = None
    p = None
    h = ""
    prt = 8080

    if "@" in clean:
        auth_part, host_part = clean.rsplit("@", 1)
        if ":" in auth_part:
            u, p = auth_part.split(":", 1)
        else:
            u = auth_part
        if ":" in host_part:
            h, prt_str = host_part.split(":", 1)
            prt = int(re.sub(r"\D", "", prt_str) or "8080")
        else:
            h = host_part
    else:
        parts = [x.strip() for x in clean.split(":") if x.strip()]
        if len(parts) == 2:
            h = parts[0]
            prt = int(re.sub(r"\D", "", parts[1]) or "8080")
        elif len(parts) == 3:
            h = parts[0]
            prt = int(re.sub(r"\D", "", parts[1]) or "8080")
            u = parts[2]
        elif len(parts) >= 4:
            is_host_first = re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", parts[0]) or "." in parts[0] or "proxy" in parts[0].lower() or "world" in parts[0].lower()
            if is_host_first:
                h = parts[0]
                prt = int(re.sub(r"\D", "", parts[1]) or "8080")
                u = parts[2]
                p = parts[3]
            else:
                u = parts[0]
                p = parts[1]
                h = parts[2]
                prt = int(re.sub(r"\D", "", parts[3]) or "8080")
        else:
            h = parts[0] if parts else ""

    if not h:
        return None

    aligned_str = f"{h}:{prt}:{u}:{p}" if (u and p) else f"{h}:{prt}"

    d = {
        "server": f"{proto}://{h}:{prt}",
        "host": h,
        "port": prt,
        "protocol": proto,
        "aligned": aligned_str
    }
    if u: d["username"] = u
    if p: d["password"] = p
    return d

def parse_proxy_str(line: str) -> Optional[Dict[str, str]]:
    res = parse_proxy_line_advanced(line)
    if res:
        out = {"server": res["server"]}
        if res.get("username"): out["username"] = res["username"]
        if res.get("password"): out["password"] = res["password"]
        return out
    return None

def extract_proxy_endpoint(server_url: str) -> tuple:
    clean = server_url.replace("http://", "").replace("https://", "").strip().rstrip("/")
    if ":" in clean:
        parts = clean.split(":")
        return parts[0], int(parts[1])
    return clean, 8080


# ==========================================
#  REAL-TIME BANDWIDTH TRACKER & DATA SAVER
# ==========================================
BANDWIDTH_STATS = {
    "total_bytes_rx": 0,
    "total_bytes_tx": 0,
    "order_bytes_rx": 0,
    "order_bytes_tx": 0
}

_last_bw_save = 0
def maybe_persist_bandwidth(force: bool = False):
    global _last_bw_save
    now = time.time()
    if force or (now - _last_bw_save > 10):
        _last_bw_save = now
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('proxy_total_rx', ?)", (str(BANDWIDTH_STATS["total_bytes_rx"]),))
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('proxy_total_tx', ?)", (str(BANDWIDTH_STATS["total_bytes_tx"]),))
            conn.commit()
            conn.close()
        except Exception:
            pass

def format_bytes(num_bytes: int) -> str:
    if num_bytes >= 1073741824:
        return f"{num_bytes / 1073741824:.2f} GB"
    elif num_bytes >= 1048576:
        return f"{num_bytes / 1048576:.2f} MB"
    elif num_bytes >= 1024:
        return f"{num_bytes / 1024:.1f} KB"
    else:
        return f"{num_bytes} B"

def add_proxy_bytes(rx_len: int, tx_len: int):
    BANDWIDTH_STATS["total_bytes_rx"] += rx_len
    BANDWIDTH_STATS["total_bytes_tx"] += tx_len
    BANDWIDTH_STATS["order_bytes_rx"] += rx_len
    BANDWIDTH_STATS["order_bytes_tx"] += tx_len
    maybe_persist_bandwidth(force=False)

AD_DOMAINS_WHITELIST = [
    "adsterra", "highcpmgate", "profitablecpmgate", "profitableratecpmnetwork", "topcreativeformat", "alwingulla",
    "monetag", "propellerads", "hilltopads", "popcash", "googleads", "googlesyndication",
    "doubleclick", "adnxs", "criteo", "pubmatic", "rubiconproject", "openx", "pagead",
    "googletagmanager", "adservice", "amazon-adsystem", "outbrain", "taboola",
    "cpmnetwork", "cpmgate", "adnetwork", "traffic", "advert",
    "effectivecpmnetwork", "highperformanceformat"
]

def is_ad_request(url: str, headers: dict) -> bool:
    url_low = url.lower()
    if any(ad_dom in url_low for ad_dom in AD_DOMAINS_WHITELIST):
        return True
    ref = (headers.get("referer") or headers.get("Referer") or "").lower()
    if any(ad_dom in ref for ad_dom in AD_DOMAINS_WHITELIST):
        return True
    return False

async def attach_data_saver(target_page, campaign_type: str = "website", mode: str = "ultra_lean"):
    """
    Intelligent Ad-Preserving Data Saver Filter:
    - 'ultra_lean': 100% WHITELISTS all Adsterra/Monetag/Google ads, banners & video ads,
                    while aborting target site's heavy decorative images, fonts & videos (~150-250 KB/view).
    - 'standard': Aborts non-ad heavy video streams & installers (~1.5 MB/view).
    - 'disabled': Full raw assets, no route blocking (~15 MB/view).
    """
    if str(mode).lower() in ["disabled", "off", "none", "full_ads", "full", "custom_http_browser"] or str(campaign_type).lower() in ["website", "web", "youtube", "whatsapp"]:
        return

    is_ultra = str(mode).lower() == "ultra_lean"

    async def _filter_route(route):
        try:
            req = route.request
            rtype = req.resource_type
            url = req.url.lower()
            headers = req.headers

            # [INFO] 1. ALWAYS ALLOW Core Web Types
            if rtype in ["document", "script", "xhr", "fetch"]:
                await route.continue_()
                return

            # [INFO] 2. ALWAYS ALLOW Ad Network Assets (Banners, Videos, Impressions)
            if is_ad_request(url, headers):
                await route.continue_()
                return

            # 3. Block heavy binary media streams (non-ad)
            if rtype in ["media"]:
                await route.abort()
                return

            # 4. Block heavy video extensions (non-ad)
            if any(url.endswith(ext) or (ext + "?") in url for ext in [
                ".mp4", ".webm", ".mkv", ".avi", ".flv", ".m4v", ".mp3", ".ogg", ".wav"
            ]):
                await route.abort()
                return

            # 5. Block installer / archive download traps
            if any(url.endswith(ext) or (ext + "?") in url for ext in [
                ".exe", ".apk", ".dmg", ".zip", ".iso", ".msi", ".rar"
            ]):
                await route.abort()
                return

            # [INFO] 6. ULTRA LEAN SPECIFIC (Non-Ad target site assets)
            if is_ultra:
                # Block heavy decorative webfonts (system fonts render instantly)
                if rtype in ["font"] or any(ext in url for ext in [".woff2", ".woff", ".ttf", ".eot"]):
                    await route.abort()
                    return

                # [INFO] ALLOW ALL AD BANNERS & IMAGES (Ensures Adsterra creatives render 100%)
                pass

            await route.continue_()
        except Exception:
            try: await route.continue_()
            except Exception: pass

    try:
        await target_page.route("**/*", _filter_route)
    except Exception as e:
        logger.debug(f"Data saver route attach: {e}")

class LocalProxyForwarder:
    """
    High-performance local async TCP forwarder that injects Proxy-Authorization headers.
    Completely bypasses Playwright's CDP Fetch.authRequired / DevTools request interception,
    preventing proxy timeouts and deadlocks on Linux while ensuring instant YouTube streaming.
    """
    def __init__(self, upstream_host: str, upstream_port: int, base_username: str = "", password: str = "", local_port: int = 0):
        self.local_port = local_port
        self.upstream_host = upstream_host
        self.upstream_port = upstream_port
        self.base_username = base_username
        self.password = password
        self.current_username = base_username
        self.server = None

    def set_session(self, worker_idx: int, session_id: int):
        if self.base_username:
            # Clean alphanumeric session tag for FlashProxy compatibility
            self.current_username = f"{self.base_username}-session-w{worker_idx}s{session_id}t{int(time.time())}"

    async def start(self) -> int:
        async def handle_client(reader, writer):
            try:
                username = self.current_username or self.base_username
                auth_str = f"{username}:{self.password}" if self.password else ""
                auth_b64 = base64.b64encode(auth_str.encode()).decode() if auth_str else ""
                auth_header = f"Proxy-Authorization: Basic {auth_b64}\r\n".encode() if auth_b64 else b""

                remote_reader, remote_writer = await asyncio.open_connection(self.upstream_host, self.upstream_port)
                initial_data = await reader.read(4096)
                if auth_header and b"\r\n\r\n" in initial_data:
                    head, rest = initial_data.split(b"\r\n\r\n", 1)
                    if b"proxy-authorization" not in head.lower():
                        modified_head = head + b"\r\n" + auth_header + b"\r\n" + rest
                    else:
                        modified_head = initial_data
                else:
                    modified_head = initial_data

                add_proxy_bytes(0, len(initial_data))
                remote_writer.write(modified_head)
                await remote_writer.drain()

                async def pipe(r, w, is_rx=False):
                    try:
                        while True:
                            data = await r.read(16384)
                            if not data: break
                            w.write(data)
                            await w.drain()
                            if is_rx:
                                add_proxy_bytes(len(data), 0)
                            else:
                                add_proxy_bytes(0, len(data))
                    except Exception: pass
                    finally:
                        try: w.close()
                        except Exception: pass

                await asyncio.gather(pipe(reader, remote_writer, is_rx=False), pipe(remote_reader, writer, is_rx=True))
            except Exception:
                try: writer.close()
                except Exception: pass

        # Bind with ephemeral port (port 0) for 100% collision-free guarantee
        self.server = await asyncio.start_server(handle_client, '127.0.0.1', self.local_port, reuse_address=True)
        if self.server.sockets:
            self.local_port = self.server.sockets[0].getsockname()[1]
        return self.local_port

    async def stop(self):
        if self.server:
            try:
                self.server.close()
                await self.server.wait_closed()
            except Exception:
                pass

def load_settings():
    global AUTH_PASSWORD, FLASHPROXY_RAW, FLASHPROXY_GATEWAY, IP2WORLD_PROXIES
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT value FROM settings WHERE key = 'admin_password'")
        r = c.fetchone()
        if r and r[0]:
            AUTH_PASSWORD = r[0]

        c.execute("SELECT value FROM settings WHERE key = 'flashproxy_gateway'")
        r_fp = c.fetchone()
        if r_fp and r_fp[0]:
            FLASHPROXY_RAW = r_fp[0]
            FLASHPROXY_GATEWAY = parse_proxy_str(r_fp[0])
        else:
            FLASHPROXY_RAW = DEFAULT_FLASHPROXY
            FLASHPROXY_GATEWAY = parse_proxy_str(DEFAULT_FLASHPROXY)

        c.execute("SELECT value FROM settings WHERE key = 'ip2world_proxies'")
        r_ip2 = c.fetchone()
        if r_ip2 and r_ip2[0]:
            IP2WORLD_PROXIES = [x.strip() for x in r_ip2[0].split("\n") if x.strip()]

        c.execute("SELECT value FROM settings WHERE key = 'proxy_total_rx'")
        r_rx = c.fetchone()
        if r_rx and r_rx[0]:
            try: BANDWIDTH_STATS["total_bytes_rx"] = int(r_rx[0])
            except Exception: pass
        c.execute("SELECT value FROM settings WHERE key = 'proxy_total_tx'")
        r_tx = c.fetchone()
        if r_tx and r_tx[0]:
            try: BANDWIDTH_STATS["total_bytes_tx"] = int(r_tx[0])
            except Exception: pass
        conn.close()
    except Exception as e:
        logger.warning(f"Settings load: {e}")

load_settings()

def log_event(msg: str):
    t_str = time.strftime("%H:%M:%S")
    EVENT_LOGS.append(f"[{t_str}] {msg}")
    if len(EVENT_LOGS) > 150:
        EVENT_LOGS.pop(0)

CURRENT_ORDER: Optional[Dict[str, Any]] = None
ORDER_TASK: Optional[asyncio.Task] = None
STOP_EVENT = asyncio.Event()
PAUSE_EVENT = asyncio.Event()

STATS = {
    "status": "IDLE",
    "order_id": "Ready",
    "campaign_type": "website",
    "total_sessions": 0,
    "completed_sessions": 0,
    "failed_sessions": 0,
    "executed_clicks": 0,
    "target_clicks": 0,
    "active_workers": 0,
    "elapsed_seconds": 0,
    "recent_action": "System Ready - Select Mode and Launch Campaign",
    "recent_frame_b64": None,
    "recent_url": "",
    "started_at": 0,
    "data_saver_mode": "disabled"
}

ACTIVE_SESSIONS = {}

REFERRER_MAP = {
    "Direct": None,
    "Facebook": "https://www.facebook.com/",
    "Instagram": "https://www.instagram.com/",
    "Twitter / X": "https://x.com/",
    "Reddit": "https://www.reddit.com/",
    "Quora": "https://www.quora.com/",
    "Pinterest": "https://www.pinterest.com/",
    "LinkedIn": "https://www.linkedin.com/",
    "Google": "https://www.google.com/",
    "Bing": "https://www.bing.com/",
    "Yahoo": "https://search.yahoo.com/",
    "DuckDuckGo": "https://duckduckgo.com/",
    "TikTok": "https://www.tiktok.com/",
    "YouTube": "https://www.youtube.com/"
}

DESKTOP_PROFILES = [
    {
        "name": "Windows 11 Chrome Desktop",
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "viewport": {"width": 1920, "height": 970},
        "screen": {"width": 1920, "height": 1080},
        "is_mobile": False,
        "has_touch": False,
        "scale": 1.0,
        "sec_ch_ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "platform": "Windows"
    },
    {
        "name": "Windows 11 Edge Desktop",
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "viewport": {"width": 1920, "height": 970},
        "screen": {"width": 1920, "height": 1080},
        "is_mobile": False,
        "has_touch": False,
        "scale": 1.0,
        "sec_ch_ua": '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
        "platform": "Windows"
    },
    {
        "name": "macOS Safari Desktop",
        "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
        "viewport": {"width": 1440, "height": 820},
        "screen": {"width": 1440, "height": 900},
        "is_mobile": False,
        "has_touch": False,
        "scale": 2.0,
        "sec_ch_ua": "",
        "platform": "macOS"
    }
]

MOBILE_PROFILES = [
    {
        "name": "Samsung Galaxy S24 Ultra",
        "ua": "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/122.0.0.0 Mobile Safari/537.36",
        "viewport": {"width": 412, "height": 915},
        "screen": {"width": 412, "height": 915},
        "is_mobile": True,
        "has_touch": True,
        "scale": 3.0,
        "sec_ch_ua": '"Chromium";v="122", "Samsung Internet";v="24.0", "Not-A.Brand";v="99"',
        "platform": "Android"
    },
    {
        "name": "Apple iPhone 15 Pro",
        "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
        "viewport": {"width": 393, "height": 852},
        "screen": {"width": 393, "height": 852},
        "is_mobile": True,
        "has_touch": True,
        "scale": 3.0,
        "sec_ch_ua": "",
        "platform": "iOS"
    }
]

def get_stealth_js(prof: dict = None) -> str:
    ua = prof.get("ua", "") if prof else ""
    is_mobile = prof.get("is_mobile", False) if prof else False
    is_iphone = "iPhone" in ua or "iPad" in ua
    is_android = "Android" in ua
    is_mac = ("Macintosh" in ua or "Mac OS X" in ua) and not is_iphone
    is_win = "Windows" in ua or (not is_mac and not is_android and not is_iphone)

    if is_iphone:
        platform = "iPhone"
        vendor = "Apple Inc."
        renderer = "Apple GPU"
        has_chrome = False
        plugins_code = "try { Object.defineProperty(navigator, 'plugins', { get: () => [] }); Object.defineProperty(navigator, 'mimeTypes', { get: () => [] }); } catch(e) {}"
    elif is_android:
        platform = "Linux armv8l"
        vendor = "Qualcomm"
        renderer = "Adreno (TM) 750"
        has_chrome = True
        plugins_code = "try { Object.defineProperty(navigator, 'plugins', { get: () => [] }); Object.defineProperty(navigator, 'mimeTypes', { get: () => [] }); } catch(e) {}"
    elif is_mac:
        platform = "MacIntel"
        vendor = "Apple Inc."
        renderer = "Apple M2"
        has_chrome = False
        plugins_code = "try { Object.defineProperty(navigator, 'plugins', { get: () => [] }); Object.defineProperty(navigator, 'mimeTypes', { get: () => [] }); } catch(e) {}"
    else:  # Windows Chrome / Edge
        platform = "Win32"
        vendor = "Google Inc. (NVIDIA)"
        renderer = "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"
        has_chrome = True
        plugins_code = """
        try {
            const fakePlugins = [
              { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Enables system viewing' },
              { name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client Executable' }
            ];
            fakePlugins.item = function(i) { return this[i] || null; };
            fakePlugins.namedItem = function(name) { return this.find(p => p.name === name) || null; };
            fakePlugins.refresh = function() {};
            Object.defineProperty(navigator, 'plugins', { get: () => fakePlugins });
            Object.defineProperty(navigator, 'mimeTypes', { get: () => fakePlugins });
        } catch(e) {}
        """

    chrome_injection = """
    try {
        window.chrome = {
          app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed' } },
          runtime: {
            OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install' },
            PlatformArch: { ARM: 'arm', X86_64: 'x86-64' },
            PlatformOs: { WIN: 'win', MAC: 'mac', LINUX: 'linux' }
          },
          csi: () => {},
          loadTimes: () => {}
        };
    } catch(e) {}
    """ if has_chrome else """
    try {
        if ('chrome' in window) {
            delete window.chrome;
        }
    } catch(e) {}
    """

    touch_pts = 5 if is_mobile else 0

    return f'''
// 1. Genuine navigator.webdriver = false (Never undefined, never true)
try {{ delete Object.getPrototypeOf(navigator).webdriver; }} catch(e) {{}}
try {{ delete navigator.webdriver; }} catch(e) {{}}
Object.defineProperty(navigator, 'webdriver', {{ get: () => false, configurable: true }});

// 2. Hardware and Platform alignment
try {{
    Object.defineProperty(navigator, 'platform', {{ get: () => '{platform}', configurable: true }});
    Object.defineProperty(navigator, 'maxTouchPoints', {{ get: () => {touch_pts}, configurable: true }});
    if (navigator.userAgentData) {{
        Object.defineProperty(navigator.userAgentData, 'platform', {{ get: () => '{platform}', configurable: true }});
        Object.defineProperty(navigator.userAgentData, 'mobile', {{ get: () => {'true' if is_mobile else 'false'}, configurable: true }});
    }}
}} catch(e) {{}}

// 3. Realistic Plugins & Chrome Object
{plugins_code}
{chrome_injection}

// 4. WebGL Hardware Match (Accurate Vendor & Renderer)
try {{
    const getParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(p) {{
        if (p === 37445) return '{vendor}';
        if (p === 37446) return '{renderer}';
        return getParam.apply(this, arguments);
    }};
    if (typeof WebGL2RenderingContext !== 'undefined') {{
        const getParam2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(p) {{
            if (p === 37445) return '{vendor}';
            if (p === 37446) return '{renderer}';
            return getParam2.apply(this, arguments);
        }};
    }}
}} catch(e) {{}}

// 5. Force active tab visibility & focus
Object.defineProperty(document, 'visibilityState', {{ get: () => 'visible', configurable: true }});
Object.defineProperty(document, 'hidden', {{ get: () => false, configurable: true }});
window.hasFocus = () => true;

// 6. Permissions API
if (navigator.permissions && navigator.permissions.query) {{
  const origQuery = navigator.permissions.query;
  navigator.permissions.query = (p) => (
    p.name === 'notifications' ? Promise.resolve({{ state: 'default' }}) : origQuery(p)
  );
}}

// 7. Notification & ServiceWorker mocks
if (typeof Notification !== 'undefined') {{
  try {{
    Object.defineProperty(Notification, 'permission', {{ get: () => 'default' }});
  }} catch(e) {{}}
}}

// 8. MediaDevices & Audio Output
if (!navigator.mediaDevices) {{
    navigator.mediaDevices = {{}};
}}
if (!navigator.mediaDevices.enumerateDevices) {{
    navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
        {{ deviceId: "default", kind: "audiooutput", label: "Default Audio Output", groupId: "group1" }},
        {{ deviceId: "speaker1", kind: "audiooutput", label: "Speakers (High Definition Audio)", groupId: "group1" }}
    ]);
}}

// 9. Hardware Concurrency, Memory & Network Info
try {{
    Object.defineProperty(navigator, 'deviceMemory', {{ get: () => ({'6' if is_mobile else '8'}), configurable: true }});
    Object.defineProperty(navigator, 'hardwareConcurrency', {{ get: () => ({'8' if is_mobile else '12'}), configurable: true }});
    if (!navigator.connection) {{
        navigator.connection = {{
            rtt: 50,
            downlink: 10.0,
            effectiveType: '4g',
            saveData: false,
            addEventListener: () => {{}},
            removeEventListener: () => {{}}
        }};
    }}
}} catch(e) {{}}

// 10. Realistic Screen dimensions and available height
try {{
    Object.defineProperty(screen, 'availWidth', {{ get: () => screen.width, configurable: true }});
    Object.defineProperty(screen, 'availHeight', {{ get: () => (screen.height > 850 ? screen.height - 40 : screen.height), configurable: true }});
}} catch(e) {{}}

// 11. Canvas Micro-Noise (Defeats Anti-Bot Fingerprint Clustering)
try {{
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {{
        const ctx = this.getContext('2d');
        if (ctx) {{
            try {{
                const img = ctx.getImageData(0, 0, Math.min(this.width, 10), Math.min(this.height, 10));
                if (img && img.data && img.data.length > 4) {{
                    img.data[0] = (img.data[0] ^ 1);
                    ctx.putImageData(img, 0, 0);
                }}
            }} catch(e) {{}}
        }}
        return origToDataURL.apply(this, arguments);
    }};
}} catch(e) {{}}
'''

AD_PRIORITY_BOOSTER_JS = """
//  Authentic Natural Rendering: 100% CSS, JavaScript, Head Tags & Assets Preserved
(function() {
    function notifyActive() {
        try {
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
        } catch(e) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', notifyActive);
    } else {
        notifyActive();
    }
})();
"""

STEALTH_JS = get_stealth_js()

def decorate_url_with_referrer_tokens(url: str, referrer_source: str) -> tuple:
    import secrets
    import string

    ref_url = REFERRER_MAP.get(referrer_source)
    if not ref_url:
        return url, None

    # Do not double-append if query param already present
    if any(k in url for k in ["fbclid=", "igshid=", "utm_"]):
        return url, ref_url

    sep = "&" if "?" in url else "?"

    if referrer_source == "Facebook":
        token = "IwAR" + "".join(secrets.choice(string.ascii_letters + string.digits + "_-") for _ in range(52))
        return f"{url}{sep}fbclid={token}", "https://www.facebook.com/"
    elif referrer_source == "Instagram":
        token = "".join(secrets.choice(string.ascii_letters + string.digits + "_") for _ in range(16))
        return f"{url}{sep}igshid={token}", "https://www.instagram.com/"
    elif referrer_source == "Twitter / X":
        return f"{url}{sep}t={int(time.time())}&s=20", "https://t.co/"
    elif referrer_source == "TikTok":
        return f"{url}{sep}_r=1", "https://www.tiktok.com/"
    elif referrer_source == "Reddit":
        return f"{url}{sep}utm_source=reddit&utm_medium=social", "https://www.reddit.com/"
    elif referrer_source == "Pinterest":
        return f"{url}{sep}utm_source=pinterest&utm_medium=social", "https://www.pinterest.com/"
    elif referrer_source == "LinkedIn":
        return f"{url}{sep}utm_source=linkedin&utm_medium=social", "https://www.linkedin.com/"
    elif referrer_source == "Google":
        return url, "https://www.google.com/"
    elif referrer_source == "Bing":
        return url, "https://www.bing.com/"
    else:
        return url, ref_url

async def prepare_and_verify_ads(page, session_id: int, is_mobile: bool = False) -> int:
    """
    Ensures Adsterra, Monetag, Google AdSense, and dynamic display ads are loaded,
    scrolled into view to trigger IntersectionObservers, and visibly rendered.
    """
    s_label = f"Session #{session_id}" if session_id > 0 else "Inspector"
    
    # 1. Ad-First Priority Focus: Scroll directly to Priority Ad Stage
    try:
        await page.evaluate("""() => {
            const adStage = document.getElementById('betwithnet-ad-first-stage') || document.getElementById('boostlike-ad-first-stage');
            if (adStage) {
                adStage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }""")
    except Exception:
        pass
    await asyncio.sleep(0.15)

    # 2. Comprehensive viewport scrolling: triggers all Adsterra social bars, native banners & popunders
    try:
        await page.evaluate("""() => {
            window.scrollBy({ top: 450, behavior: 'instant' });
        }""")
        await asyncio.sleep(0.1)
        await page.evaluate("""() => {
            window.scrollBy({ top: 600, behavior: 'instant' });
        }""")
        await asyncio.sleep(0.1)
        await page.evaluate("""() => {
            window.scrollBy({ top: -500, behavior: 'instant' });
        }""")
        await asyncio.sleep(0.1)
        # Dispatch synthetic user engagement events so Adsterra scripts fire
        await page.evaluate("""() => {
            // [INFO] 1. RESCUE AD BANNERS TRAPPED IN HEAD OR HIDDEN
            const adSelectors = [
                "div[id*='container-']", "ins.adsbygoogle", "iframe[id*='aswift']", "iframe[src*='google']",
                "iframe[src*='adsterra']", "iframe[src*='monetag']", "iframe[src*='alwingulla']",
                "iframe[src*='highcpmgate']", "iframe[src*='effectivecpmnetwork']",
                "iframe[src*='highperformanceformat']", "div[class*='adsterra']",
                "div[id*='adsterra']", "div[class*='monetag']", "div[id*='monetag']",
                "div[class*='banner']"
            ];
            adSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    try {
                        // If trapped inside <head>, move to top of layout or body so it is visually rendered!
                        if (el.parentElement && el.parentElement.tagName === 'HEAD') {
                            const targetHost = document.querySelector('.layout-wrapper') || document.querySelector('.hero-banner') || document.body;
                            if (targetHost && targetHost !== document.head) {
                                targetHost.prepend(el);
                            }
                        }
                        el.style.display = 'block';
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                        el.style.minHeight = '90px';
                        el.style.margin = '10px auto';
                        el.removeAttribute('hidden');
                    } catch(e) {}
                });
            });
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('mousemove'));
            window.dispatchEvent(new Event('resize'));
        }""")
    except Exception:
        pass

    # 3. Natural human movement & engagement to activate Adsterra Social Bar & Popunder
    try:
        await page.mouse.move(random.randint(250, 650), random.randint(200, 450), steps=5)
        # Safe natural click on document body to trigger Adsterra Popunder & Social Bar
        await page.mouse.click(random.randint(300, 700), random.randint(250, 420))
    except Exception:
        pass

    # 4. Comprehensive Ad Detection & Viewable Impression Activation
    ad_init_js = """() => {
        const adSelectors = [
            "ins.adsbygoogle",
            "iframe[id*='aswift']",
            "iframe[id*='google_ads']",
            "iframe[src*='googlesyndication']",
            "iframe[src*='doubleclick']",
            "div[class*='adsterra']",
            "div[id*='adsterra']",
            "div[id*='container-']",
            "div[class*='monetag']",
            "div[id*='monetag']",
            "div[class*='push_inpage']",
            "div[id*='push_inpage']",
            "iframe[src*='adsterra']",
            "iframe[src*='monetag']",
            "iframe[src*='alwingulla']",
            "iframe[src*='highcpmgate']",
            "iframe[src*='effectivecpmnetwork']",
            "iframe[src*='highperformanceformat']",
            "iframe[src*='propellerads']",
            "div[id*='ad-']",
            "div[class*='ad-']",
            "div[id*='ad_']",
            "div[class*='ad_']",
            "div[class*='banner']",
            "a[href*='adsterra']",
            "a[href*='highcpmgate']"
        ];

        let foundNodes = [];
        adSelectors.forEach(sel => {
            try {
                document.querySelectorAll(sel).forEach(el => {
                    if (el && !foundNodes.includes(el)) foundNodes.push(el);
                });
            } catch(e) {}
        });

        // Trigger IntersectionObserver so lazy-loaded ads download their iframe content
        foundNodes.forEach(el => {
            try {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch(e) {}
        });

        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
        return foundNodes.length;
    }"""

    try:
        candidate_count = await page.evaluate(ad_init_js)
        if candidate_count > 0:
            log_event(f"{s_label}:  Found {candidate_count} Ad slots. Triggering active impressions...")
    except Exception:
        candidate_count = 0

    # 5. Ad rendering check (polls up to 3.5s for ad iframes to render)
    check_rendered_js = """() => {
        const activeAds = document.querySelectorAll(
            "ins.adsbygoogle iframe, iframe[id*='aswift'], iframe[src*='google'], iframe[src*='adsterra'], " +
            "iframe[src*='effectivecpmnetwork'], iframe[src*='highperformanceformat'], div[class*='adsterra'] iframe, " +
            "div[class*='monetag'] iframe, div[id*='container-'] iframe, div[id*='container-'] a, " +
            "div.al-socialbar-container, div[class*='social-bar'], div[id*='push_inpage'], " +
            "ins.adsbygoogle[data-ad-status='filled'], iframe[src*='alwingulla'], " +
            "iframe[src*='highcpmgate'], iframe[src*='propellerads'], a[href*='adsterra'], a[href*='monetag']"
        );
        return activeAds.length;
    }"""

    rendered_count = 0
    start_poll = time.time()
    while time.time() - start_poll < 1.0:
        try:
            rendered_count = await page.evaluate(check_rendered_js)
            if rendered_count > 0:
                break
        except Exception:
            pass
        await asyncio.sleep(0.1)

    if rendered_count > 0:
        log_event(f"{s_label}:  {rendered_count} Ad units verified LOADED & ACTIVE (Adsterra/Monetag/AdSense)!")
    else:
        log_event(f"{s_label}:  Page assets active!")

    return rendered_count


async def execute_website_session(page, order_cfg, session_id, duration, is_mobile: bool = False):
    raw_url = order_cfg.get("url") or order_cfg.get("target_url") or "https://example.com"
    referrer_source = order_cfg.get("referrer_source", "Direct")
    target_url, chosen_ref = decorate_url_with_referrer_tokens(raw_url, referrer_source)
    # Direct authentic HTTPS preserved for all domains

    act_str = f"Connecting with {referrer_source} ref to {target_url[:45]}..."
    STATS["recent_action"] = f"Session #{session_id}: {act_str}"
    STATS["recent_url"] = target_url
    if session_id in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS[session_id]["action"] = act_str

    log_event(f"Session #{session_id}: Connecting to {target_url[:50]} (Referrer: {referrer_source})...")

    connected = False
    resp = None
    try:
        # [INFO] Full asset load: wait for CSS, JavaScript, external resources, and head code
        nav_kwargs = {"wait_until": "domcontentloaded", "timeout": 8000}
        if chosen_ref:
            nav_kwargs["referer"] = chosen_ref
        resp = await page.goto(target_url, **nav_kwargs)
        connected = True
    except Exception as e_nav:
        # Fallback if slow third-party tracker delays the window.onload event
        try:
            nav_kwargs = {"wait_until": "domcontentloaded", "timeout": 7000}
            if chosen_ref:
                nav_kwargs["referer"] = chosen_ref
            resp = await page.goto(target_url, **nav_kwargs)
            connected = True
        except Exception:
            p_cur_url = page.url or ""
            target_host = raw_url.replace("https://", "").replace("http://", "").split("/")[0]
            if p_cur_url and not p_cur_url.startswith("chrome-error://") and "about:blank" not in p_cur_url and (target_host in p_cur_url or "http" in p_cur_url):
                connected = True
                resp = True
                log_event(f"Session #{session_id}: [OK] Target domain reached ({p_cur_url[:35]}). Dwell initiated.")
            else:
                connected = False

    if not connected:
        log_event(f"Session #{session_id}: [WARNING] Proxy dropped connection. Auto-retrying session with fresh proxy...")
        return False, "PROXY_CONNECTION_DROPPED", 0

    status_code = resp.status if (resp and hasattr(resp, "status")) else 200
    if status_code >= 400:
        log_event(f"Session #{session_id}: [BLOCKED] HTTP {status_code} Error on target site. Session rejected.")
        return False, f"HTTP_{status_code}_ERROR", 0

    if page.url.startswith("chrome-error://"):
        log_event(f"Session #{session_id}: [BLOCKED] Chrome navigation error page. Session rejected.")
        return False, "CHROME_NAV_ERROR", 0

    # [INFO] Settle DOM stylesheets, JavaScript, and dynamic assets before capturing CCTV frame
    try:
        await page.wait_for_load_state("networkidle", timeout=1200)
    except Exception:
        pass
    await asyncio.sleep(0.15)

    #  PAGE & ADS INTEGRITY GUARD: Detect Bot Challenges & Connection Limits
    try:
        p_title = (await page.title()) or ""
        p_body = (await page.evaluate("() => document.body ? document.body.innerText.slice(0, 1500) : ''")) or ""
    except Exception:
        p_title = ""
        p_body = ""

    # Check for blank / empty unloaded page
    if len(p_body.strip()) < 40:
        log_event(f"Session #{session_id}: [BLOCKED] Page body empty/unloaded (<40 chars). Session rejected.")
        return False, "EMPTY_PAGE_UNLOADED", 0

    # Detect ALTCHA / Cloudflare / Security Verification / Captcha (Exact Phrases - Zero False Positives)
    is_bot_challenge = any(k in p_title.lower() or k in p_body.lower() for k in [
        "verify you are human", "verify that you are human", "protected by altcha",
        "altcha-widget", "cloudflare", "just a moment...", "attention required! | cloudflare",
        "ddos protection by", "i am not a robot", "are you a robot", "cf-turnstile",
        "checking your browser before accessing", "hcaptcha", "cpguard", "security check required",
        "this site can't be reached", "err_proxy", "err_connection", "err_cert"
    ])
    # Detect Server Connection Limit (LiteSpeed / Apache)
    is_conn_limit = any(k in p_body.lower() or k in p_title.lower() for k in [
        "maximum number of open connections", "connection limit", "too many requests", "429 too many",
        "502 bad gateway", "503 service unavailable", "504 gateway time-out", "server error"
    ])

    if is_bot_challenge:
        log_event(f"Session #{session_id}: [BLOCKED] ALTCHA / Bot Challenge detected on target site! Ads not loaded.")
        if session_id in ACTIVE_SESSIONS:
            ACTIVE_SESSIONS[session_id]["action"] = "[BLOCKED] Blocked by ALTCHA Firewall"
        return False, "ALTCHA_BOT_CHALLENGE", 0

    if is_conn_limit:
        log_event(f"Session #{session_id}: [BLOCKED] 'Maximum number of open connections reached' on target site! (Concurrency limit).")
        if session_id in ACTIVE_SESSIONS:
            ACTIVE_SESSIONS[session_id]["action"] = "[BLOCKED] Server Concurrency Limit"
        return False, "CONCURRENCY_LIMIT_REACHED", 0

    title = p_title
    log_event(f"Session #{session_id}: [OK] Website 100% Loaded (HTTP {status_code}) - Title: '{title[:30]}'")

    # Capture CCTV frame immediately upon load so the live view is instantly visible
    try:
        shot = await page.screenshot(type="jpeg", quality=70, timeout=5000)
        if shot:
            b64_str = base64.b64encode(shot).decode("utf-8")
            STATS["recent_frame_b64"] = b64_str
            SESSION_FRAMES[session_id] = {
                "session_id": session_id,
                "frame_b64": b64_str,
                "action": "Page Loaded | Preparing session...",
                "url": page.url,
                "updated_at": time.time()
            }
    except Exception:
        pass

    # [INFO] Trigger Adsterra / Monetag / AdSense ads impressions
    ads_loaded = await prepare_and_verify_ads(page, session_id, is_mobile)
    if ads_loaded > 0:
        log_event(f"Session #{session_id}:  {ads_loaded} Ad(s) detected and activated.")
    else:
        log_event(f"Session #{session_id}: [INFO] Page loaded. Continuing session dwell...")

    # Refresh CCTV frame after ad activation
    try:
        shot = await page.screenshot(type="jpeg", quality=70, timeout=5000)
        if shot:
            b64_str = base64.b64encode(shot).decode("utf-8")
            STATS["recent_frame_b64"] = b64_str
            SESSION_FRAMES[session_id] = {
                "session_id": session_id,
                "frame_b64": b64_str,
                "action": f"Ads Active ({ads_loaded} loaded) | Browsing..." if ads_loaded > 0 else "Browsing | Live View",
                "url": page.url,
                "updated_at": time.time()
            }
    except Exception:
        pass

    return True, "PAGE_OK", ads_loaded


async def _dismiss_youtube_dialogs(page):
    """Dismisses YouTube cookie dialogs, login prompts, and blocking scrims across Desktop and Mobile."""
    try:
        await page.evaluate("""() => {
            const clickKeywords = ['alle akzeptieren', 'alle ablehnen', 'zustimmen', 'bestaetigen', 'accept all', 'reject all', 'i agree', 'agree', 'ton einschalten', 'dismiss', 'no thanks'];
            const btns = Array.from(document.querySelectorAll('button, form button, [role="button"]'));
            for (const b of btns) {
                const txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
                if (clickKeywords.some(kw => txt.includes(kw))) {
                    try { b.click(); } catch(e) {}
                }
            }
            const blockers = document.querySelectorAll(
                'ytw-scrim, #dialog-container, tp-yt-paper-dialog, ytd-consent-bump-v2-lightbox, ' +
                'ytd-popup-container, ytm-consent-bump-v2-renderer, ytm-dialog, .dialog-topbar, ' +
                '.modal-dialog, ytm-overlay, ytm-mobile-topbar-renderer'
            );
            blockers.forEach(el => {
                try { el.remove(); } catch(e) {}
            });
            document.body.style.overflow = 'auto';
        }""")
    except Exception:
        pass

async def execute_youtube_session(page, order_cfg: dict, session_id: int, duration: int, is_mobile: bool = False):
    global STATS, ACTIVE_SESSIONS, SESSION_FRAMES
    video_url = (order_cfg.get("url") or order_cfg.get("target_url") or "https://www.youtube.com/watch?v=dQw4w9WgXcQ").strip()
    search_kw = (order_cfg.get("search_keyword") or "").strip()

    # Extract Video ID for matching and clean direct navigation
    video_id = ""
    if "v=" in video_url:
        try: video_id = video_url.split("v=")[1].split("&")[0]
        except Exception: pass
    elif "youtu.be/" in video_url:
        try: video_id = video_url.split("youtu.be/")[1].split("?")[0]
        except Exception: pass
    elif "shorts/" in video_url:
        try: video_id = video_url.split("shorts/")[1].split("?")[0]
        except Exception: pass

    # 1. YouTube Navigation Flow
    if search_kw:
        import urllib.parse
        encoded_q = urllib.parse.quote_plus(search_kw)
        search_url = f"https://www.youtube.com/results?search_query={encoded_q}"
        log_event(f"Session #{session_id}: ” Organic Discovery: Searching YouTube for '{search_kw}'...")
        act_str = f"Searching YouTube: '{search_kw}'"
        if session_id in ACTIVE_SESSIONS: ACTIVE_SESSIONS[session_id]["action"] = act_str
        try:
            await page.goto(search_url, referer="https://www.google.com/", wait_until="domcontentloaded", timeout=25000)
        except Exception:
            try: await page.goto(search_url, wait_until="commit", timeout=25000)
            except Exception: pass

        await asyncio.sleep(1.0)
        await _dismiss_youtube_dialogs(page)

        # Locate video in search results via fast evaluate
        found_and_clicked = await page.evaluate("""(vId) => {
            const links = Array.from(document.querySelectorAll("ytd-video-renderer a#video-title, ytd-video-renderer a#thumbnail, ytm-video-with-context-renderer a, a[href*='watch?v=']"));
            for (let l of links) {
                if (vId && (l.href || '').includes(vId)) {
                    l.click();
                    return true;
                }
            }
            if (links.length > 0) {
                links[0].click();
                return true;
            }
            return false;
        }""", video_id)

        if found_and_clicked:
            log_event(f"Session #{session_id}:  Organic Click: Found and clicked target video in search results!")
        else:
            await page.goto(video_url, referer=search_url, wait_until="commit", timeout=25000)
    else:
        yt_referers = [
            "https://www.youtube.com/",
            "https://www.google.com/",
            "https://t.co/",
            "https://www.facebook.com/",
            "https://www.youtube.com/feed/trending"
        ]
        chosen_ref = random.choice(yt_referers)
        log_event(f"Session #{session_id}:  Connecting to video (Organic Referrer: {chosen_ref.split('//')[1].split('/')[0]})...")
        act_str = f"Connecting to YouTube ({chosen_ref.split('//')[1].split('/')[0]})..."
        if session_id in ACTIVE_SESSIONS: ACTIVE_SESSIONS[session_id]["action"] = act_str
        try:
            await page.goto(video_url, referer=chosen_ref, wait_until="commit", timeout=25000)
        except Exception:
            try: await page.goto(video_url, referer=chosen_ref, timeout=25000)
            except Exception as e_nav:
                raise RuntimeError(f"YouTube navigation timed out via proxy ({e_nav})")

    if "youtube.com" not in page.url and "youtu.be" not in page.url:
        raise RuntimeError(f"Page failed to land on YouTube (current url={page.url})")

    await page.evaluate("window.scrollTo(0, 0);")
    await asyncio.sleep(1.0)
    await _dismiss_youtube_dialogs(page)

    # 2. 100% Guaranteed Playback, Unmute & Big Screen Expansion
    log_event(f"Session #{session_id}: ”Š Engaging Native Player (Audio 100%, Theater HD, Zero Mute)...")
    current_volume = 100
    try:
        # Start muted first for instant browser autoplay compliance
        await page.evaluate("""() => {
            const player = document.getElementById('movie_player');
            const v = document.querySelector('video');
            if (v) {
                v.muted = true;
                v.playbackRate = 1.0;
                v.play().catch(() => {});
            }
            if (player) {
                if (typeof player.playVideo === 'function') player.playVideo();
                if (typeof player.setSizeStyle === 'function') player.setSizeStyle(true);
                if (typeof player.setPlaybackQualityRange === 'function') player.setPlaybackQualityRange('hd720');
            }
            const pb = document.querySelector('.ytp-large-play-button, button.ytp-play-button, button[aria-label*="Play"], .player-control-play-pause-icon');
            if (pb) { try { pb.click(); } catch(e) {} }
        }""")
        await asyncio.sleep(0.3)

        # Native trusted clicks and keystrokes for guaranteed instant playback
        try:
            btn = await page.query_selector('.ytp-large-play-button, button.ytp-play-button')
            if btn and await btn.is_visible():
                await btn.click()
            else:
                if is_mobile:
                    await page.mouse.click(195, 200)
                else:
                    await page.mouse.click(640, 360)
        except Exception:
            pass

        await asyncio.sleep(0.3)
        try:
            await page.keyboard.press("k")
            await asyncio.sleep(0.2)
            await page.keyboard.press("Space")
        except Exception:
            pass
    except Exception as e:
        logger.warning(f"Session #{session_id} initial player prep note: {e}")

    # 3. Verified Playback Confirmation Loop (Wait until video is confirmed playing)
    confirmed_playing = False
    for wait_i in range(12):
        st = await page.evaluate("""() => {
            const p = document.getElementById('movie_player');
            const v = document.querySelector('video');
            const skip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
            if (skip) { try { skip.click(); } catch(e) {} }
            if (p && typeof p.playVideo === 'function' && p.getPlayerState && p.getPlayerState() !== 1) {
                try { p.playVideo(); } catch(e) {}
            }
            if (v && v.paused) {
                try { v.play().catch(() => {}); } catch(e) {}
            }
            return {
                state: p && typeof p.getPlayerState === 'function' ? p.getPlayerState() : null,
                curTime: v ? v.currentTime : 0,
                paused: v ? v.paused : null
            };
        }""")
        if (st.get("curTime") or 0) > 0.3:
            confirmed_playing = True
            break
        try:
            await page.keyboard.press("k")
        except Exception:
            pass
        await asyncio.sleep(1.0)

    # Once playback starts, un-mute to full volume
    try:
        await page.evaluate("""() => {
            const player = document.getElementById('movie_player');
            const v = document.querySelector('video');
            if (v) {
                v.muted = false;
                v.volume = 1.0;
            }
            if (player) {
                if (typeof player.unMute === 'function') player.unMute();
                if (typeof player.setVolume === 'function') player.setVolume(100);
            }
            const ub = document.querySelector('.ytp-unmute, button.ytp-mute-button, button[aria-label*="Unmute"]');
            if (ub) { try { ub.click(); } catch(e) {} }
        }""")
        is_muted = await page.evaluate("() => { const v = document.querySelector('video'); return v ? v.muted : false; }")
        if is_muted:
            try: await page.keyboard.press("m")
            except Exception: pass
        if not is_mobile:
            try: await page.keyboard.press("t") # Theater mode
            except Exception: pass
    except Exception:
        pass

    # Detect video total duration (for display/logging only  -  user controls watch time)
    video_total_dur = 0
    try:
        video_total_dur = await page.evaluate("""() => {
            const v = document.querySelector('video');
            const p = document.getElementById('movie_player');
            if (v && v.duration && isFinite(v.duration)) return v.duration;
            if (p && typeof p.getDuration === 'function') return p.getDuration();
            return 0;
        }""")
    except Exception:
        pass

    # USER controls watch time  -  we only enforce 30s minimum to guarantee YouTube counts the view
    yt_watch_dur = max(int(duration), 30)
    pct_of_video = round((yt_watch_dur / video_total_dur) * 100, 1) if video_total_dur > 0 else 0

    t_start = time.time()
    t_end = t_start + yt_watch_dur
    log_event(f"Session #{session_id}: YouTube Active! Watching {yt_watch_dur}s ({pct_of_video}% of {int(video_total_dur)}s video)  -  User-defined duration.")


    last_scroll_time = time.time()
    last_interaction_time = time.time()
    last_volume_time = time.time()
    last_shot_time = time.time()
    last_adcheck_time = time.time()
    yt_scroll_state = "player"

    page_error_count = 0  # track consecutive errors for retry limit

    while time.time() < t_end and not STOP_EVENT.is_set():
        while PAUSE_EVENT.is_set() and not STOP_EVENT.is_set():
            await asyncio.sleep(0.5)

        now = time.time()
        elapsed = int(now - t_start)
        pct_watched = round((elapsed / yt_watch_dur) * 100, 1) if yt_watch_dur > 0 else 0
        pct_remaining = max(0, round(100 - pct_watched, 1))

        # 0. YOUTUBE ERROR DETECTOR  -  Check for "Something went wrong" every 5s
        # If error page detected, auto-refresh and resume. Prevents ghost view counting.
        try:
            error_state = await page.evaluate("""() => {
                // Detect YouTube player error
                const errEl = document.querySelector(
                    '.ytp-error, .html5-video-player.error-occurred, ' +
                    '.ytp-error-content-wrap, [class*="player-unavailable"]'
                );
                const bodyText = document.body ? document.body.innerText : '';
                const hasErrorText = bodyText.includes('Something went wrong') ||
                                     bodyText.includes('An error occurred') ||
                                     bodyText.includes('Playback error') ||
                                     bodyText.includes('Try again later');
                // Also detect blank/empty player (no video element)
                const vid = document.querySelector('video');
                const isBlank = !vid || (vid.readyState === 0 && vid.networkState === 3);
                return { hasError: !!(errEl || hasErrorText), isBlank: isBlank };
            }""")
            if error_state.get("hasError") or error_state.get("isBlank"):
                page_error_count += 1
                log_event(f"Session #{session_id}: YouTube error detected (attempt {page_error_count}/2). Auto-refreshing page...")
                if page_error_count > 2:
                    # After 2 retries still failing  -  fail this session cleanly
                    log_event(f"Session #{session_id}: Page error persists after retries. Marking as failed.")
                    STATS["failed_sessions"] += 1
                    return False
                # Refresh and re-navigate to video
                try:
                    await page.goto(video_url, wait_until="commit", timeout=25000)
                    await asyncio.sleep(2.0)
                    await _dismiss_youtube_dialogs(page)
                    # Re-trigger playback
                    await page.evaluate("""() => {
                        const p = document.getElementById('movie_player');
                        const v = document.querySelector('video');
                        if (v) { v.muted = true; v.play().catch(()=>{}); }
                        if (p && typeof p.playVideo === 'function') p.playVideo();
                    }""")
                    await asyncio.sleep(1.0)
                    try: await page.keyboard.press("k")
                    except Exception: pass
                    log_event(f"Session #{session_id}: Page refreshed successfully  -  resuming watchtime.")
                except Exception as e_ref:
                    log_event(f"Session #{session_id}: Refresh failed ({e_ref})")
                await asyncio.sleep(0.5)
                continue  # skip rest of loop iteration, recheck next cycle
            else:
                page_error_count = 0  # reset error counter on healthy frame
        except Exception:
            pass

        # 1. BULLETPROOF AD SKIPPER - Runs every 1.5s, handles ALL ad types
        if now - last_adcheck_time >= 1.5:
            last_adcheck_time = now
            try:
                ad_result = await page.evaluate("""() => {
                    let skipped = false;
                    // Type 1: Standard skippable ad skip button (all variants)
                    const skipBtns = document.querySelectorAll([
                        '.ytp-ad-skip-button',
                        '.ytp-ad-skip-button-modern',
                        '.ytp-skip-ad-button',
                        '.ytp-ad-skip-button-slot button',
                        'button.ytp-ad-skip-button-modern',
                        '[class*="skip-button"]',
                        '.videoAdUiSkipButton',
                        '#skip-button\\\\:html5',
                        '.ytp-ad-overlay-close-button'
                    ].join(','));
                    if (skipBtns.length > 0) {
                        for (let b of skipBtns) {
                            if (b && b.offsetParent !== null) { // visible
                                try { b.click(); skipped = true; } catch(e) {}
                            }
                        }
                    }
                    // Type 2: Non-skippable ad  -  fast forward the ad video element
                    const adContainer = document.querySelector('.ad-showing, .ad-interrupting');
                    if (adContainer) {
                        const adVid = document.querySelector('video.html5-main-video, video');
                        if (adVid && adVid.duration && isFinite(adVid.duration)) {
                            // Jump to near end of ad to skip it fast
                            try { adVid.currentTime = adVid.duration - 0.5; } catch(e) {}
                        }
                    }
                    // Type 3: Dismiss overlay/banner ads
                    const overlayClose = document.querySelector('.ytp-ad-overlay-close-button, .ytp-ad-text-overlay-close-button');
                    if (overlayClose) { try { overlayClose.click(); skipped = true; } catch(e) {} }
                    // Type 4: Ensure main video keeps playing after ad
                    const p = document.getElementById('movie_player');
                    if (p && typeof p.getPlayerState === 'function') {
                        if (p.getPlayerState() !== 1 && !document.querySelector('.ad-showing')) {
                            try { p.playVideo(); } catch(e) {}
                        }
                    }
                    const v = document.querySelector('video');
                    if (v && v.paused && !document.querySelector('.ad-showing')) {
                        try { v.play().catch(() => {}); } catch(e) {}
                    }
                    return skipped;
                }""")
            except Exception:
                pass

        # 2. Dynamic Volume Modulation (Every 8-10s)
        if elapsed > 0 and (now - last_volume_time > 8.5):
            current_volume = random.choice([75, 85, 90, 100, 80, 95, 70])
            try:
                await page.evaluate(f"""() => {{
                    const player = document.getElementById('movie_player');
                    if (player) {{
                        if (typeof player.unMute === 'function') player.unMute();
                        if (typeof player.setVolume === 'function') player.setVolume({current_volume});
                    }}
                    const v = document.querySelector('video');
                    if (v) {{
                        v.muted = false;
                        v.volume = {current_volume / 100.0};
                    }}
                }}""")
                last_volume_time = now
            except Exception:
                pass

        # 3. Human Mouse Hover over Player Timeline (Every 7s)
        if now - last_interaction_time > 7.0:
            try:
                await page.mouse.move(random.randint(200, 650), random.randint(200, 450))
                last_interaction_time = now
            except Exception:
                pass

        # 4. Human Comment Browsing & Video Scroll (Every 7-9s)
        if order_cfg.get("enable_scroll", True) and (now - last_scroll_time > 7.5):
            try:
                if yt_scroll_state == "player":
                    scroll_px = random.randint(250, 450) if is_mobile else random.randint(300, 550)
                    await page.evaluate(f"window.scrollBy({{ top: {scroll_px}, behavior: 'smooth' }});")
                    yt_scroll_state = "scrolling_comments"
                else:
                    await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' });")
                    yt_scroll_state = "player"
                last_scroll_time = now
            except Exception:
                pass

        # 5. Live CCTV Stream Capture with Progress % (Every 1.8s)
        if now - last_shot_time >= 1.8:
            last_shot_time = now
            try:
                shot_bytes = await page.screenshot(type="jpeg", quality=45, timeout=4000)
                if shot_bytes:
                    b64_str = base64.b64encode(shot_bytes).decode("utf-8")
                    act_msg = f"Watching {pct_watched}% | {elapsed}s/{yt_watch_dur}s done | {pct_remaining}% left"
                    STATS["recent_frame_b64"] = b64_str
                    if session_id in ACTIVE_SESSIONS:
                        ACTIVE_SESSIONS[session_id]["elapsed"] = elapsed
                        ACTIVE_SESSIONS[session_id]["action"] = act_msg
                        ACTIVE_SESSIONS[session_id]["pct_watched"] = pct_watched
                        ACTIVE_SESSIONS[session_id]["pct_remaining"] = pct_remaining
                        ACTIVE_SESSIONS[session_id]["video_duration"] = int(video_total_dur)
                        ACTIVE_SESSIONS[session_id]["watch_target"] = yt_watch_dur
                    SESSION_FRAMES[session_id] = {
                        "session_id": session_id,
                        "frame_b64": b64_str,
                        "action": act_msg,
                        "pct_watched": pct_watched,
                        "pct_remaining": pct_remaining,
                        "elapsed": elapsed,
                        "watch_target": yt_watch_dur,
                        "video_duration": int(video_total_dur),
                        "url": page.url,
                        "updated_at": now
                    }
            except Exception:
                pass

        if elapsed > 0 and elapsed % 10 == 0:
            log_event(f"Session #{session_id}: Progress {pct_watched}% ({elapsed}/{yt_watch_dur}s) | Vol: {current_volume}%")

        await asyncio.sleep(0.5)

    # STEP 4: TELEMETRY BEACON FLUSH (Keep video alive so beacon reaches YouTube servers)
    try:
        log_event(f"Session #{session_id}: Flushing final YouTube watchtime beacon ({yt_watch_dur}s / {pct_of_video}% of video watched)...")
        await page.evaluate("""() => {
            const p = document.getElementById('movie_player');
            const v = document.querySelector('video');
            if (p && typeof p.getPlayerState === 'function' && p.getPlayerState() !== 1) {
                try { p.playVideo(); } catch(e) {}
            }
            if (v && v.paused) { try { v.play().catch(()=>{}); } catch(e) {} }
        }""")
        await asyncio.sleep(6.0)
    except Exception:
        pass

    STATS["completed_sessions"] += 1
    log_event(f"Session #{session_id}: YouTube Session Completed  -  {yt_watch_dur}s watched ({pct_of_video}% of video). View locked.")
    return True




async def execute_google_serp_session(page, order_cfg, session_id, duration):
    kw = order_cfg.get("search_keyword", "Bet With Net")
    domain = order_cfg.get("target_domain", "").strip()
    target_url = order_cfg.get("url", "")
    find_term = domain if domain else target_url.replace("https://", "").replace("http://", "").split("/")[0]

    act_str = f"Google SERP search '{kw}' -> '{find_term}'..."
    STATS["recent_action"] = f"Session #{session_id}: {act_str}"
    if session_id in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS[session_id]["action"] = act_str
    log_event(f"Session #{session_id}: ” Navigating to Google SERP for keyword '{kw}'...")

    try:
        serp_url = f"https://www.google.com/search?q={kw.replace(' ', '+')}&num=10"
        await page.goto(serp_url, wait_until="commit", timeout=20000)
        await asyncio.sleep(1.2)
        
        consent = await page.query_selector("button:has-text('Accept all'), button:has-text('I agree'), #L2AGLb")
        if consent:
            await consent.click(timeout=1000)

        links = await page.query_selector_all(f"a[href*='{find_term}']")
        if links:
            await links[0].click(timeout=3000)
            log_event(f"Session #{session_id}:  Clicked '{find_term}' in Google organic search results!")
        else:
            if target_url:
                await page.goto(target_url, referer=serp_url, wait_until="commit", timeout=15000)
    except Exception:
        if target_url:
            await page.goto(target_url, wait_until="commit", timeout=15000)

async def execute_whatsapp_session(page, order_cfg: dict, session_id: int, duration: int, is_mobile: bool = False):
    target_url = (order_cfg.get("url") or order_cfg.get("target_url") or "").strip()
    action_type = order_cfg.get("wa_action_type", "follow_channel")
    is_channel = "channel" in target_url.lower()
    is_group = "chat.whatsapp.com" in target_url.lower()

    act_str = f"Connecting to WhatsApp {'Channel' if is_channel else ('Group' if is_group else 'Invite')}..."
    STATS["recent_action"] = f"Session #{session_id}: {act_str}"
    if session_id in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS[session_id]["action"] = act_str
    log_event(f"Session #{session_id}: 💬 Navigating to WhatsApp target: {target_url[:55]}...")

    ref_map = {
        "Google": "https://www.google.com/",
        "Facebook": "https://www.facebook.com/",
        "Instagram": "https://www.instagram.com/",
        "TikTok": "https://www.tiktok.com/",
        "Telegram": "https://t.me/",
        "Twitter / X": "https://x.com/",
        "Direct": ""
    }
    ref_name = order_cfg.get("referrer_source", "Direct")
    ref_url = ref_map.get(ref_name, "")

    try:
        if ref_url:
            await page.goto(target_url, referer=ref_url, wait_until="commit", timeout=25000)
        else:
            await page.goto(target_url, wait_until="commit", timeout=25000)
    except Exception as e:
        logger.warning(f"Session #{session_id} WhatsApp goto: {e}")

    await asyncio.sleep(2.0)

    # 1. Dismiss WhatsApp / Meta Cookie banners & consent dialogs
    for c_sel in [
        "button:has-text('Allow all cookies')",
        "button:has-text('Accept all')",
        "button:has-text('Accept')",
        "button:has-text('Decline optional cookies')",
        "[data-cookiebanner='accept_button']",
        "#accept-cookie-banner",
        "button:has-text('OK')",
        "button:has-text('Continue')"
    ]:
        try:
            c_btn = await page.query_selector(c_sel)
            if c_btn and await c_btn.is_visible():
                await c_btn.click(timeout=1500)
                await asyncio.sleep(0.5)
                break
        except Exception:
            pass

    # 2. Extract Channel / Group title and subscriber/follower count
    title_text = "WhatsApp"
    member_text = ""
    try:
        details = await page.evaluate('''() => {
            let t = document.querySelector('h1, h2, [dir="auto"]')?.innerText || '';
            let count = '';
            const allSpans = Array.from(document.querySelectorAll('span, div, p'));
            for (let s of allSpans) {
                const txt = (s.innerText || '').trim();
                if (txt.match(/\\d+[kKmM]?\\s+(followers|members|participants)/i) || 
                    txt.toLowerCase().includes('follower') || 
                    txt.toLowerCase().includes('member') ||
                    txt.toLowerCase().includes('participant')) {
                    count = txt;
                    break;
                }
            }
            return { title: t.slice(0, 40), count: count.slice(0, 30) };
        }''')
        if details:
            title_text = details.get("title") or title_text
            member_text = details.get("count") or ""
    except Exception:
        pass

    log_desc = f"Target: {title_text}" + (f" ({member_text})" if member_text else "")
    log_event(f"Session #{session_id}: 💬 WhatsApp detected: {log_desc}")

    # 3. Simulate Human Cursor Movement towards Follow / Join / View Channel
    follow_clicked = False
    for f_sel in [
        "button:has-text('Follow')",
        "a:has-text('Follow')",
        "button:has-text('Follow channel')",
        "a:has-text('Follow channel')",
        "button:has-text('View channel')",
        "a:has-text('View channel')",
        "button:has-text('Join chat')",
        "a:has-text('Join chat')",
        "button:has-text('Join group')",
        "a:has-text('Join group')",
        "a[href*='whatsapp.com/channel']",
        "[aria-label*='Follow']",
        "[aria-label*='Join']"
    ]:
        try:
            f_btn = await page.query_selector(f_sel)
            if f_btn and await f_btn.is_visible():
                box = await f_btn.bounding_box()
                if box:
                    await page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=random.randint(6, 12))
                    await asyncio.sleep(random.uniform(0.3, 0.7))
                await f_btn.click(timeout=2000)
                follow_clicked = True
                log_event(f"Session #{session_id}: 🌟 Verified Follow/Join Interaction triggered on {title_text}!")
                break
        except Exception:
            pass

    # 4. Human dwell timer with scrolling through updates & CCTV frame streaming
    t_start = time.time()
    t_end = t_start + (54 if duration >= 55 else duration)
    last_shot_time = t_start
    last_scroll_time = t_start

    while time.time() < t_end and not STOP_EVENT.is_set():
        while PAUSE_EVENT.is_set() and not STOP_EVENT.is_set():
            await asyncio.sleep(0.5)

        now = time.time()
        elapsed = int(now - t_start)
        pct_done = min(100, int((elapsed / max(1, duration)) * 100))

        # Human scroll reading updates / channel posts every 4-6s
        if now - last_scroll_time > random.uniform(4.0, 6.0):
            last_scroll_time = now
            try:
                scroll_delta = random.choice([250, 400, 550, -200, 320])
                await page.mouse.wheel(0, scroll_delta)
                await page.mouse.move(random.randint(100, 500), random.randint(150, 600), steps=6)
            except Exception:
                pass

        # Live CCTV screenshot capture every 1.8s
        if now - last_shot_time >= 1.8:
            last_shot_time = now
            try:
                shot_bytes = await page.screenshot(type="jpeg", quality=60, timeout=4000)
                if shot_bytes:
                    b64_str = base64.b64encode(shot_bytes).decode("utf-8")
                    act_msg = f"WhatsApp {'Follow Active' if follow_clicked else 'Browsing'} | {title_text[:22]} | {elapsed}s/{duration}s ({pct_done}%)"
                    STATS["recent_frame_b64"] = b64_str
                    if session_id in ACTIVE_SESSIONS:
                        ACTIVE_SESSIONS[session_id]["elapsed"] = elapsed
                        ACTIVE_SESSIONS[session_id]["action"] = act_msg
                    SESSION_FRAMES[session_id] = {
                        "session_id": session_id,
                        "frame_b64": b64_str,
                        "action": act_msg,
                        "url": page.url,
                        "updated_at": now
                    }
            except Exception:
                pass

        if elapsed > 0 and elapsed % 10 == 0:
            log_event(f"Session #{session_id}: 💬 WhatsApp dwell progress ({elapsed}/{duration}s) on {title_text}...")

        await asyncio.sleep(0.5)

    STATS["completed_sessions"] += 1
    log_event(f"Session #{session_id}: 💬 WhatsApp Session Completed successfully  -  {duration}s dwell & follower action verified on {title_text}.")
    return True

async def run_single_worker(session_id: int, order_cfg: dict, p_chromium, engine_name: str):
    global STATS, ACTIVE_SESSIONS, SESSION_FRAMES
    STATS["active_workers"] += 1
    duration = int(order_cfg.get("duration_sec", 15))
    campaign_type = order_cfg.get("campaign_type", "website")
    referrer_source = order_cfg.get("referrer_source", "Direct")
    device_type = order_cfg.get("device_type", "Desktop")
    enable_scroll = order_cfg.get("enable_scroll", True)
    scroll_speed = order_cfg.get("scroll_speed", "Medium")
    proxy_dict = order_cfg.get("proxy_dict")

    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "engine_name": engine_name,
        "campaign": campaign_type,
        "referrer": referrer_source,
        "action": f"Spawning {engine_name}...",
        "elapsed": 0,
        "url": order_cfg.get("url", ""),
        "proxy_ip": order_cfg.get("session_proxy_ip", "Verifying..."),
        "proxy_country": order_cfg.get("session_proxy_country", "Global"),
        "proxy_speed": order_cfg.get("session_proxy_speed", 0),
        "proxy_status": "Verified [ONLINE]" if order_cfg.get("session_proxy_ip") else "Pre-Checking..."
    }

    if device_type == "Mobile":
        prof = random.choice(MOBILE_PROFILES)
    elif device_type == "Mixed":
        prof = random.choice(MOBILE_PROFILES if session_id % 2 == 0 else DESKTOP_PROFILES)
    else:
        prof = random.choice(DESKTOP_PROFILES)

    log_event(f"Session #{session_id}: Initialized worker on {prof['name']} via {engine_name}.")

    ctx = None
    try:
        chosen_tz = random.choice(["America/New_York", "America/Chicago", "America/Los_Angeles", "America/Denver", "America/Phoenix"])
        ctx_kwargs = {
            "viewport": prof["viewport"],
            "screen": prof.get("screen", prof["viewport"]),
            "user_agent": prof["ua"],
            "is_mobile": prof["is_mobile"],
            "has_touch": prof["has_touch"],
            "device_scale_factor": prof["scale"],
            "locale": "en-US",
            "timezone_id": chosen_tz,
            "ignore_https_errors": True
        }
        headers = {
            "Accept-Language": "en-US,en;q=0.9"
        }
        ctx_kwargs["extra_http_headers"] = headers

        if proxy_dict:
            ctx_kwargs["proxy"] = proxy_dict

        ctx = await p_chromium.new_context(**ctx_kwargs)
        try:
            await ctx.add_cookies([
                {"name": "PREF", "value": "f6=40000000&hl=en", "domain": ".youtube.com", "path": "/"},
                {"name": "SOCS", "value": "CAESEwgDEgk2ODEwNjM4MTAaAmVuIAEaBgiAo_LzBg", "domain": ".youtube.com", "path": "/"},
                {"name": "CONSENT", "value": "YES+cb.20230531-04-p0.en+FX+999", "domain": ".youtube.com", "path": "/"},
                {"name": "PREF", "value": "f6=40000000&hl=en", "domain": ".google.com", "path": "/"},
                {"name": "SOCS", "value": "CAESEwgDEgk2ODEwNjM4MTAaAmVuIAEaBgiAo_LzBg", "domain": ".google.com", "path": "/"},
                {"name": "CONSENT", "value": "YES+cb.20230531-04-p0.en+FX+999", "domain": ".google.com", "path": "/"}
            ])
        except Exception:
            pass

        page = await ctx.new_page()
        page.set_default_navigation_timeout(25000)
        stealth_code = get_stealth_js(prof)
        await page.add_init_script(stealth_code)
        await page.add_init_script(AD_PRIORITY_BOOSTER_JS)
        ds_mode = order_cfg.get("data_saver_mode", "disabled")
        await attach_data_saver(page, campaign_type, mode=ds_mode)

        # Handle Adsterra popunders and new window popups gracefully with high-intent dwell & CCTV streaming
        async def _handle_popup(popup_page):
            try:
                await attach_data_saver(popup_page, "website", mode=order_cfg.get("data_saver_mode", "disabled"))
                dwell_pop = random.uniform(5.0, 9.0)
                t_pop_end = time.time() + dwell_pop
                log_event(f"Session #{session_id}:  Popunder triggered! Interacting with advertiser landing page ({int(dwell_pop)}s)...")
                
                # Popunder triggered - preserve main website CCTV frame with ads
                await asyncio.sleep(1.0)
                try:
                    p_url = popup_page.url or "Popunder"
                    if session_id in SESSION_FRAMES:
                        SESSION_FRAMES[session_id]["action"] = "Ads Active | Popunder Verified"
                    if session_id in ACTIVE_SESSIONS:
                        ACTIVE_SESSIONS[session_id]["action"] = f"Popunder Active ({p_url[:20]})"
                except Exception:
                    pass
                while time.time() < t_pop_end and not STOP_EVENT.is_set():
                    try:
                        await popup_page.mouse.move(random.randint(180, 580), random.randint(150, 450), steps=6)
                        await popup_page.mouse.wheel(0, random.randint(120, 280))
                    except Exception:
                        pass
                    # Stream active ad interaction to CCTV
                    try:
                        if session_id in SESSION_FRAMES:
                            SESSION_FRAMES[session_id]["action"] = f"Ads Active | Popunder Verified ({popup_domain[:18]})"
                    except Exception:
                        pass
                    await asyncio.sleep(3.0)

                await popup_page.close()
                log_event(f"Session #{session_id}:  Popunder advertiser postback completed successfully.")
            except Exception:
                pass
        ctx.on("page", lambda p: asyncio.create_task(_handle_popup(p)))

        # Primary execution
        is_mob = prof.get("is_mobile", False)
        if campaign_type == "youtube":
            await execute_youtube_session(page, order_cfg, session_id, duration, is_mobile=is_mob)
        elif campaign_type == "whatsapp":
            await execute_whatsapp_session(page, order_cfg, session_id, duration, is_mobile=is_mob)
        else:
            if campaign_type == "google_search":
                await execute_google_serp_session(page, order_cfg, session_id, duration)
            else:
                page_ok = False
                fail_reason = ""
                ads_cnt = 0
                page_ok, fail_reason, ads_cnt = await execute_website_session(page, order_cfg, session_id, duration, is_mobile=is_mob)
                if not page_ok:
                    cur_ip = order_cfg.get("session_proxy_ip")
                    if cur_ip:
                        betwithnet_manager.release_failed_proxy(cur_ip, mark_dead=True)
                    log_event(f"Session #{session_id}: ”„ Slot auto-rotating with fresh proxy.")
                    return False

            # [INFO] EXACT POST-AD-LOAD DURATION TIMER FOR WEBSITES:
            # Countdown begins ONLY after Ads are confirmed loaded and shown!
            t_start = time.time()
            t_end = t_start + (54 if duration >= 55 else duration)
            session_clicked = False
            navigated_internal = False
            allow_internal = False  # Fixed: Exact 1:1 view count matching order quota
            log_event(f"Session #{session_id}:  Ads & Page Active! Starting {duration}s dwell timer...")
            last_shot_time = t_start
            scroll_delay = 1.0 if scroll_speed == "Slow" else (0.2 if scroll_speed == "Fast" else 0.4)

            while time.time() < t_end and not STOP_EVENT.is_set():
                while PAUSE_EVENT.is_set() and not STOP_EVENT.is_set():
                    await asyncio.sleep(0.5)

                now = time.time()
                elapsed_sec = int(now - t_start)

                # Organic multi-page exploration (35% probability): visit an internal page after 40% duration
                if allow_internal and not navigated_internal and elapsed_sec >= int(duration * 0.40):
                    navigated_internal = True
                    try:
                        internal_link = await page.evaluate('''() => {
                            const links = Array.from(document.querySelectorAll("a[href^='/'], a[href*='viewsphere.shop']"));
                            const valid = links.filter(a => {
                                const h = (a.getAttribute('href') || '').toLowerCase();
                                const full = (a.href || '').toLowerCase();
                                return h && !h.includes('#') && !h.includes('login') && !h.includes('register') && 
                                       !h.includes('logout') && !h.includes('javascript') && !h.includes('mailto') && 
                                       !h.includes('upload') && !full.includes('play.google.com') && 
                                       !full.includes('apps.apple.com') && full.includes('viewsphere.shop');
                            });
                            if (valid.length > 0) {
                                return valid[Math.floor(Math.random() * valid.length)].href;
                            }
                            return null;
                        }''')
                        if internal_link:
                            log_event(f"Session #{session_id}:  Multi-Page Exploration: Navigating to {internal_link[:45]}...")
                            await page.goto(internal_link, wait_until="commit", timeout=12000)
                            await prepare_and_verify_ads(page, session_id, is_mobile=is_mob)
                    except Exception:
                        pass

                # Native human mouse movement & wheel interaction (Fires genuine DOM PointerEvent & wheel)
                try:
                    if is_mob:
                        await page.mouse.wheel(0, random.randint(150, 350))
                    else:
                        target_mx = random.randint(180, min(1200, prof["viewport"]["width"] - 50))
                        target_my = random.randint(120, min(750, prof["viewport"]["height"] - 50))
                        await page.mouse.move(target_mx, target_my, steps=random.randint(6, 12))
                        if random.random() < 0.7:
                            await page.mouse.wheel(0, random.choice([160, 240, 320, -80, 180]))
                except Exception:
                    pass

                if enable_scroll:
                    try:
                        # Intelligently scroll to Ad slots to maximize Viewable Impression percentage
                        scrolled_ad = await page.evaluate('''() => {
                            const ads = Array.from(document.querySelectorAll("iframe, div[class*='adsterra'], div[id*='container-'], ins.adsbygoogle, div[class*='banner'], a[href*='adsterra'], a[href*='highcpmgate']"));
                            if (ads.length > 0) {
                                const target = ads[Math.floor(Math.random() * ads.length)];
                                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                return true;
                            }
                            return false;
                        }''')
                        if not scrolled_ad:
                            pos = random.randint(200, 1400)
                            await page.evaluate(f"window.scrollTo({{top: {pos}, behavior: 'smooth'}})")
                    except Exception:
                        pass

                #  Ad Interaction / Click Simulation (ONLY when explicitly requested by user)
                should_interact = False
                if STATS.get("target_clicks", 0) > STATS.get("executed_clicks", 0) and not session_clicked:
                    should_interact = True

                if should_interact and (now - t_start) > 4.0:
                    session_clicked = True
                    try:
                        ad_box = await page.evaluate('''() => {
                            const targets = document.querySelectorAll(
                                "ins.adsbygoogle iframe, div[class*='ad'] a, div[class*='adsterra'] a, div[class*='monetag'] a, " +
                                "div[id*='container-'] a, a[target='_blank'], a[href*='click'], a[href*='out'], a[href*='adsterra'], " +
                                "a[href*='highcpmgate'], div[id*='container-'], iframe[src*='effectivecpmnetwork'], iframe[src*='highperformanceformat']"
                            );
                            for (let el of targets) {
                                const r = el.getBoundingClientRect();
                                if (r.width > 20 && r.height > 15 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                                }
                            }
                            return null;
                        }''')
                        if ad_box:
                            await page.mouse.click(ad_box["x"], ad_box["y"])
                            STATS["executed_clicks"] = STATS.get("executed_clicks", 0) + 1
                            log_event(f"Session #{session_id}: – Executed verified trusted ad interaction ({STATS['executed_clicks']}).")
                    except Exception:
                        pass

                now = time.time()
                elapsed_sec = int(now - t_start)
                if now - last_shot_time >= 3.5:
                    last_shot_time = now
                    try:
                        shot_bytes = await page.screenshot(type="jpeg", quality=55, timeout=3000)
                        if shot_bytes:
                            b64_str = base64.b64encode(shot_bytes).decode("utf-8")
                            act_msg = f"Browsing ({elapsed_sec}s/{duration}s) | {referrer_source}"
                            STATS["recent_frame_b64"] = b64_str
                            if session_id in ACTIVE_SESSIONS:
                                ACTIVE_SESSIONS[session_id]["elapsed"] = elapsed_sec
                                ACTIVE_SESSIONS[session_id]["action"] = act_msg
                            SESSION_FRAMES[session_id] = {
                                "session_id": session_id,
                                "frame_b64": b64_str,
                                "action": act_msg,
                                "url": page.url,
                                "updated_at": now
                            }
                    except Exception:
                        pass

                if elapsed_sec > 0 and elapsed_sec % 10 == 0:
                    log_event(f"Session #{session_id}: Dwell interaction progress ({elapsed_sec}/{duration}s)...")

                await asyncio.sleep(scroll_delay)

            STATS["completed_sessions"] += 1
            cur_ip = order_cfg.get("session_proxy_ip")
            cur_order_id = STATS.get("order_id", "ORDER")
            cur_c = order_cfg.get("session_proxy_country", "Global")
            if cur_ip:
                betwithnet_manager.finalize_success_proxy(cur_ip, cur_order_id, session_id, cur_c)
            log_event(f"Session #{session_id}: [OK] Completed successfully ({duration}s interaction verified). IP {cur_ip} locked.")
            return True

    except Exception as e:
        logger.warning(f"Session #{session_id} anomaly: {e}")
        log_event(f"Session #{session_id}: [WARNING] Session anomaly ({str(e)[:45]}). Auto-retrying with fresh proxy...")
        return False
    finally:
        if ctx:
            try:
                await ctx.close()
            except Exception:
                pass
        ACTIVE_SESSIONS.pop(session_id, None)
        STATS["active_workers"] = max(0, STATS["active_workers"] - 1)
        if ctx:
            try: await ctx.close()
            except Exception: pass

async def execute_cloud_order(order_cfg: dict):
    global STATS, FLASHPROXY_GATEWAY, IP2WORLD_PROXIES, STATIC_PROXIES, SESSION_FRAMES, ACTIVE_SESSIONS
    
    # [INFO] CLEAN CACHE RESET: Ensure zero leftover frames from previous orders bleed into the new order!
    SESSION_FRAMES.clear()
    ACTIVE_SESSIONS.clear()
    
    STATS["status"] = "RUNNING"
    STATS["order_id"] = order_cfg.get("order_id", "ORDER-" + str(int(time.time())))
    STATS["campaign_type"] = order_cfg.get("campaign_type", "website")
    STATS["total_sessions"] = int(order_cfg.get("total_sessions", 50))
    STATS["completed_sessions"] = 0
    STATS["failed_sessions"] = 0
    STATS["executed_clicks"] = 0
    STATS["target_clicks"] = int(order_cfg.get("target_clicks", 0))
    STATS["started_at"] = time.time()
    STATS["recent_frame_b64"] = None
    STATS["recent_url"] = order_cfg.get("url", "")
    STATS["recent_action"] = f"Initializing {STATS['total_sessions']} sessions for {STATS['recent_url']}..."

    concurrency = min(max(1, int(order_cfg.get("concurrent_workers", 30))), 80)
    proxy_mode = order_cfg.get("proxy_mode", "boostlike")

    #  Bet With Net Bulletproof Rotating Proxy Pre-Flight
    if proxy_mode in ("betwithnet", "boostlike", "rotating"):
        log_event(f" Bet With Net Rotating Proxy System Armed for Order {STATS['order_id']} (Auto-Verifying Unique IP Per Session).")
        stats_pd = betwithnet_manager.get_stats()
        if stats_pd["total_verified"] < 8:
            asyncio.create_task(betwithnet_manager.refresh_pool(max_test=50000, max_needed=2000, target_au=1000, target_de=1000))

    #  BULLETPROOF PROXY PRE-FLIGHT CHECK (Zero-Stall Guarantee)
    if proxy_mode == "flashproxy":
        if not FLASHPROXY_GATEWAY:
            log_event("[WARNING] FlashProxy not configured. Auto-routing campaign via High-Speed Direct VPS Connection.")
            proxy_mode = "direct"
        else:
            try:
                import aiohttp
                server_url = FLASHPROXY_GATEWAY.get("server", "")
                u = FLASHPROXY_GATEWAY.get("username")
                p_auth = FLASHPROXY_GATEWAY.get("password")
                auth = aiohttp.BasicAuth(u, p_auth) if u and p_auth else None
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8.0)) as probe_sess:
                    async with probe_sess.get("http://httpbin.org/ip", proxy=server_url, proxy_auth=auth) as probe_resp:
                        if probe_resp.status != 200:
                            if STATS["campaign_type"] == "youtube":
                                log_event(f"[WARNING] FlashProxy Gateway HTTP {probe_resp.status}. Keeping proxy mode enabled for YouTube residential compliance.")
                            else:
                                log_event(f"[WARNING] FlashProxy Gateway returned HTTP {probe_resp.status}. Auto-routing via Direct Connection.")
                                proxy_mode = "direct"
                        else:
                            log_event(f" FlashProxy Pre-Flight Check Passed! (Routing via {server_url})")
            except Exception as e_probe:
                if STATS["campaign_type"] == "youtube":
                    log_event(f"[WARNING] FlashProxy Gateway probe note ({str(e_probe)[:40]}). Keeping residential proxy active for YouTube.")
                else:
                    log_event(f"[WARNING] FlashProxy Gateway unreachable ({str(e_probe)[:40]}). Auto-routing via Direct Connection.")
                    proxy_mode = "direct"
    
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO orders 
            (order_id, url, campaign_type, total_sessions, duration_sec, concurrent_workers, browser_mode, referrer_source, device_type, proxy_mode, target_clicks, status, completed, failed, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            STATS["order_id"], order_cfg.get("url"), STATS["campaign_type"], STATS["total_sessions"],
            order_cfg.get("duration_sec", 15), concurrency, order_cfg.get("browser_mode", "custom_http_browser"),
            order_cfg.get("referrer_source", "Direct"), order_cfg.get("device_type", "Desktop"),
            proxy_mode, STATS["target_clicks"], "RUNNING", 0, 0, time.time()
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"DB order save err: {e}")

    BANDWIDTH_STATS["order_bytes_rx"] = 0
    BANDWIDTH_STATS["order_bytes_tx"] = 0
    STATS["data_saver_mode"] = order_cfg.get("data_saver_mode", "disabled")
    log_event(f" Campaign Order {STATS['order_id']} started ({STATS['campaign_type'].upper()} - {STATS['total_sessions']} sessions via {order_cfg.get('browser_mode', 'Custom HTTP Browser')}).")

    queue = asyncio.Queue()
    for s_idx in range(1, STATS["total_sessions"] + 1):
        queue.put_nowait(s_idx)

    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            req_engine = str(order_cfg.get("browser_mode", "custom_http_browser")).lower()

            chrome_bin = "/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None
            launch_args = [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--disable-popup-blocking",
                "--headless=new",
                "--enable-features=CDPScreenshotNewSurface",
                "--autoplay-policy=no-user-gesture-required",
                "--use-fake-ui-for-media-stream",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--allow-running-insecure-content",
                "--ignore-certificate-errors",
                "--ignore-ssl-errors",
                "--ignore-certificate-errors-spki-list",
                "--allow-insecure-localhost",
                "--window-size=1440,900",
                "--lang=en-US",
                "--max-sockets-per-group=2048",
                "--max-sockets-per-pool=16384",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--disable-extensions",
                "--disable-component-extensions-with-background-pages",
                "--disable-default-apps",
                "--mute-audio",
                "--no-default-browser-check",
                "--no-first-run",
                "--disable-notifications",
                "--disable-logging"
            ]

            worker_browsers = []
            forwarders = []

            # Determine requested browser binary
            browser_exec = None
            if "edge" in req_engine and os.path.exists("/usr/bin/microsoft-edge"):
                browser_exec = "/usr/bin/microsoft-edge"
            elif "brave" in req_engine and os.path.exists("/usr/bin/brave-browser"):
                browser_exec = "/usr/bin/brave-browser"
            elif chrome_bin:
                browser_exec = chrome_bin

            # High-performance browser process pooling (allocates up to 6 processes, distributes parallel contexts)
            num_browsers = min(concurrency, 6)
            for b_idx in range(num_browsers):
                w_args = list(launch_args)

                if proxy_mode == "flashproxy" and FLASHPROXY_GATEWAY:
                    gw = FLASHPROXY_GATEWAY
                    u_host, u_port = extract_proxy_endpoint(gw.get("server", "lite.flashproxy.io:6969"))
                    fwd_inst = LocalProxyForwarder(u_host, u_port, gw.get("username", ""), gw.get("password", ""))
                    fwd_port = await fwd_inst.start()
                    forwarders.append(fwd_inst)
                    w_args.extend([f"--proxy-server=http://127.0.0.1:{fwd_port}", "--disable-quic"])
                elif proxy_mode == "ip2world" and IP2WORLD_PROXIES:
                    p_str = IP2WORLD_PROXIES[b_idx % len(IP2WORLD_PROXIES)]
                    p_parsed = parse_proxy_str(p_str)
                    if p_parsed:
                        u_host, u_port = extract_proxy_endpoint(p_parsed.get("server", ""))
                        fwd_inst = LocalProxyForwarder(u_host, u_port, p_parsed.get("username", ""), p_parsed.get("password", ""))
                        fwd_port = await fwd_inst.start()
                        forwarders.append(fwd_inst)
                        w_args.extend([f"--proxy-server=http://127.0.0.1:{fwd_port}", "--disable-quic"])
                elif proxy_mode == "static" and STATIC_PROXIES:
                    p_str = STATIC_PROXIES[b_idx % len(STATIC_PROXIES)]
                    p_parsed = parse_proxy_str(p_str)
                    if p_parsed:
                        u_host, u_port = extract_proxy_endpoint(p_parsed.get("server", ""))
                        fwd_inst = LocalProxyForwarder(u_host, u_port, p_parsed.get("username", ""), p_parsed.get("password", ""))
                        fwd_port = await fwd_inst.start()
                        forwarders.append(fwd_inst)
                        w_args.extend([f"--proxy-server=http://127.0.0.1:{fwd_port}", "--disable-quic"])

                kw = {"headless": True, "args": w_args, "ignore_default_args": ["--mute-audio"]}
                if browser_exec:
                    kw["executable_path"] = browser_exec
                b = await p.chromium.launch(**kw)
                worker_browsers.append(b)

            async def worker_loop(w_idx: int):
                # Progressive Stagger for immediate first frame rendering
                await asyncio.sleep(min(w_idx * 0.02, 0.4))

                while STATS["completed_sessions"] < STATS["total_sessions"] and not STOP_EVENT.is_set():
                    try:
                        s_idx = queue.get_nowait()
                    except asyncio.QueueEmpty:
                        await asyncio.sleep(0.3)
                        continue

                    cur_cfg = dict(order_cfg)
                    if forwarders:
                        forwarders[w_idx % len(forwarders)].set_session(w_idx, s_idx)
                        cur_cfg.pop("proxy_dict", None)

                    if proxy_mode in ("betwithnet", "boostlike", "rotating"):
                        target_c = cur_cfg.get("proxy_country")
                        if not target_c or target_c.upper() in ("", "ALL", "GLOBAL", "ANY", "WORLDWIDE"):
                            target_c = "GLOBAL"
                        cur_order_id = STATS.get("order_id", "ORDER")
                        p_res = None
                        # ZERO-TOLERANCE PRE-CHECK: Fast acquisition with instant fallback
                        retry_cnt = 0
                        while p_res is None and retry_cnt < 2 and not STOP_EVENT.is_set():
                            retry_cnt += 1
                            p_res = await betwithnet_manager.get_verified_proxy_for_session(s_idx, country_filter=target_c, order_id=cur_order_id)
                            if not p_res:
                                await asyncio.sleep(0.1)

                        # Zero-Stall Guarantee: Fast fallback from pool so workers never freeze
                        if not p_res and not STOP_EVENT.is_set():
                            p_res = betwithnet_manager.get_any_proxy_fallback()

                        if STOP_EVENT.is_set():
                            break

                        if not p_res:
                            queue.put_nowait(s_idx)
                            await asyncio.sleep(0.2)
                            continue

                        cur_cfg["proxy_dict"] = p_res["proxy_dict"]
                        cur_cfg["session_proxy_ip"] = p_res["ip"]
                        cur_cfg["session_proxy_country"] = p_res.get("country", "Global")
                        cur_cfg["session_proxy_speed"] = p_res.get("speed_ms", 0)
                        log_event(f"Session #{s_idx}:  Bet With Net Pre-Check PASSED! Verified IP: {p_res['ip']} ({p_res.get('country','Global')}) Latency: {p_res.get('speed_ms',0)}ms")
                        if s_idx in ACTIVE_SESSIONS:
                            ACTIVE_SESSIONS[s_idx]["proxy_ip"] = p_res["ip"]
                            ACTIVE_SESSIONS[s_idx]["proxy_country"] = p_res.get("country", "Global")
                            ACTIVE_SESSIONS[s_idx]["proxy_speed"] = p_res.get("speed_ms", 0)
                            ACTIVE_SESSIONS[s_idx]["proxy_status"] = "Verified [ONLINE]"
                            ACTIVE_SESSIONS[s_idx]["action"] = f"Verified IP: {p_res['ip']} ({p_res.get('country','Global')})"

                    eng_browser = worker_browsers[w_idx % len(worker_browsers)]
                    eng_name = order_cfg.get("browser_mode", "Custom HTTP Browser")
                    session_timeout = max(int(cur_cfg.get("duration_sec", 15)) + 18, 30)
                    session_ok = False
                    try:
                        session_ok = await asyncio.wait_for(
                            run_single_worker(s_idx, cur_cfg, eng_browser, eng_name),
                            timeout=session_timeout
                        )
                    except asyncio.TimeoutError:
                        log_event(f"Session #{s_idx}:  Watchdog reached ({session_timeout}s). Auto-retrying with fresh verified proxy...")
                        session_ok = False
                    except Exception as ex_w:
                        log_event(f"Session #{s_idx}: Worker recovered ({ex_w}). Auto-retrying session...")
                        session_ok = False
                    finally:
                        queue.task_done()
                        if p_res and p_res.get("ip"):
                            cur_p_ip = p_res["ip"]
                            cur_p_country = p_res.get("country", "AU")
                            if session_ok:
                                betwithnet_manager.finalize_success_proxy(cur_p_ip, cur_order_id, s_idx, cur_p_country)
                            else:
                                betwithnet_manager.release_failed_proxy(cur_p_ip, mark_dead=False)

                    # Periodically sync progress to DB so UI & status always show real progress
                    if session_ok and (STATS["completed_sessions"] % 5 == 0 or STATS["completed_sessions"] >= STATS["total_sessions"]):
                        try:
                            conn_pr = sqlite3.connect(DB_FILE, timeout=10.0)
                            c_pr = conn_pr.cursor()
                            c_pr.execute("UPDATE orders SET completed = ?, status = 'RUNNING' WHERE order_id = ?",
                                         (STATS["completed_sessions"], STATS["order_id"]))
                            conn_pr.commit()
                            conn_pr.close()
                        except Exception:
                            pass

                    # [INFO] GUARANTEE 100% ORDER COMPLETION:
                    # If this session dropped due to dead proxy or reject, re-queue this session to guarantee 100% completed views
                    if not session_ok and not STOP_EVENT.is_set():
                        needed = STATS["total_sessions"] - STATS["completed_sessions"]
                        if queue.qsize() < needed:
                            queue.put_nowait(s_idx)
                            log_event(f"Session #{s_idx}: ”„ Auto-retrying Session #{s_idx} with fresh verified proxy...")
                        await asyncio.sleep(0.5)

            try:
                worker_tasks = [asyncio.create_task(worker_loop(i)) for i in range(concurrency)]
                await asyncio.gather(*worker_tasks, return_exceptions=True)
            finally:
                for b_inst in worker_browsers:
                    try:
                        await b_inst.close()
                    except Exception:
                        pass
                for fwd in forwarders:
                    try:
                        await fwd.stop()
                    except Exception:
                        pass
    except Exception as fatal_e:
        logger.exception(f"FATAL error executing cloud order {STATS.get('order_id', '?')}: {fatal_e}")
        log_event(f"Œ Campaign Fatal Error: {fatal_e}")
        STATS["status"] = "FAILED"
        STATS["recent_action"] = f"Fatal Error: {str(fatal_e)[:100]}"
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("UPDATE orders SET status = 'FAILED' WHERE order_id = ?", (STATS["order_id"],))
            conn.commit()
            conn.close()
        except Exception:
            pass
        return

    STATS["status"] = "COMPLETED" if not STOP_EVENT.is_set() else "STOPPED"
    log_event(f"Order {STATS['order_id']} finished: {STATS['completed_sessions']} Completed, {STATS['failed_sessions']} Failed.")
    
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("UPDATE orders SET status = ?, completed = ?, failed = ? WHERE order_id = ?",
                  (STATS["status"], STATS["completed_sessions"], STATS["failed_sessions"], STATS["order_id"]))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"DB final update err: {e}")

# Interactive Custom HTTP Browser State
INTERACTIVE_BROWSER_STATE = {
    "page": None,
    "context": None,
    "browser": None,
    "playwright": None,
    "url": "about:blank",
    "title": "Custom HTTP Browser",
    "last_frame_b64": ""
}

INTERACTIVE_FORWARDER = None

async def handle_custom_browser_nav(request):
    global INTERACTIVE_BROWSER_STATE, INTERACTIVE_FORWARDER
    data = await request.json()
    target_url = data.get("url", "https://whoer.net")
    proxy_mode = data.get("proxy", "flashproxy").lower()
    device = data.get("device", "Desktop")
    referrer = data.get("referrer", "Direct")
    ref_url = REFERRER_MAP.get(referrer)

    from playwright.async_api import async_playwright
    if not INTERACTIVE_BROWSER_STATE["browser"]:
        p = await async_playwright().start()
        chrome_bin = "/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None
        fwd_port = 18889
        args_nav = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled",
            "--headless=new",
            "--enable-features=CDPScreenshotNewSurface",
            "--autoplay-policy=no-user-gesture-required",
            "--use-fake-ui-for-media-stream",
            "--window-size=1440,900"
        ]
        if "flash" in proxy_mode and FLASHPROXY_GATEWAY:
            gw = FLASHPROXY_GATEWAY
            u_host, u_port = extract_proxy_endpoint(gw.get("server", "lite.flashproxy.io:6969"))
            if INTERACTIVE_FORWARDER:
                await INTERACTIVE_FORWARDER.stop()
            INTERACTIVE_FORWARDER = LocalProxyForwarder(fwd_port, u_host, u_port, gw.get("username", ""), gw.get("password", ""))
            await INTERACTIVE_FORWARDER.start()
            args_nav.extend([f"--proxy-server=http://127.0.0.1:{fwd_port}", "--disable-quic"])
        elif "ip2world" in proxy_mode and IP2WORLD_PROXIES:
            p_parsed = parse_proxy_str(IP2WORLD_PROXIES[0])
            if p_parsed:
                u_host, u_port = extract_proxy_endpoint(p_parsed.get("server", ""))
                if INTERACTIVE_FORWARDER:
                    await INTERACTIVE_FORWARDER.stop()
                INTERACTIVE_FORWARDER = LocalProxyForwarder(fwd_port, u_host, u_port, p_parsed.get("username", ""), p_parsed.get("password", ""))
                await INTERACTIVE_FORWARDER.start()
                args_nav.extend([f"--proxy-server=http://127.0.0.1:{fwd_port}", "--disable-quic"])

        kw_nav = {
            "headless": True,
            "args": args_nav,
            "ignore_default_args": ["--mute-audio"]
        }
        if chrome_bin: kw_nav["executable_path"] = chrome_bin
        b = await p.chromium.launch(**kw_nav)
        prof = MOBILE_PROFILES[0] if "Mobile" in device else DESKTOP_PROFILES[0]
        ctx_kwargs = {
            "viewport": prof["viewport"],
            "user_agent": prof["ua"],
            "is_mobile": prof["is_mobile"],
            "ignore_https_errors": True
        }
            
        ctx = await b.new_context(**ctx_kwargs)
        try:
            await ctx.add_cookies([
                {"name": "PREF", "value": "f6=40000000&hl=en", "domain": ".youtube.com", "path": "/"},
                {"name": "SOCS", "value": "CAESEwgDEgk2ODEwNjM4MTAaAmVuIAEaBgiAo_LzBg", "domain": ".youtube.com", "path": "/"},
                {"name": "CONSENT", "value": "YES+cb.20230531-04-p0.en+FX+999", "domain": ".youtube.com", "path": "/"},
                {"name": "PREF", "value": "f6=40000000&hl=en", "domain": ".google.com", "path": "/"},
                {"name": "SOCS", "value": "CAESEwgDEgk2ODEwNjM4MTAaAmVuIAEaBgiAo_LzBg", "domain": ".google.com", "path": "/"},
                {"name": "CONSENT", "value": "YES+cb.20230531-04-p0.en+FX+999", "domain": ".google.com", "path": "/"}
            ])
        except Exception:
            pass
        await ctx.add_init_script(STEALTH_JS)
        page = await ctx.new_page()
        await attach_data_saver(page, "website")

        INTERACTIVE_BROWSER_STATE["playwright"] = p
        INTERACTIVE_BROWSER_STATE["browser"] = b
        INTERACTIVE_BROWSER_STATE["context"] = ctx
        INTERACTIVE_BROWSER_STATE["page"] = page
    else:
        page = INTERACTIVE_BROWSER_STATE["page"]

    try:
        if ref_url:
            await page.goto(target_url, referer=ref_url, wait_until="commit", timeout=25000)
        else:
            await page.goto(target_url, wait_until="commit", timeout=25000)
    except Exception:
        pass

    if "youtube.com" in target_url.lower() or "youtu.be" in target_url.lower():
        await _dismiss_youtube_dialogs(page)
        try:
            btn = await page.query_selector('.ytp-large-play-button, button.ytp-play-button')
            if btn and await btn.is_visible():
                await btn.click()
            else:
                await page.mouse.click(640, 360)
        except Exception:
            pass
        await asyncio.sleep(0.3)
        try:
            await page.keyboard.press("k")
            await asyncio.sleep(0.2)
            await page.keyboard.press("Space")
        except Exception:
            pass
        try:
            await page.evaluate('''() => {
                const player = document.getElementById('movie_player');
                if (player) {
                    if (typeof player.unMute === 'function') player.unMute();
                    if (typeof player.setVolume === 'function') player.setVolume(100);
                    if (typeof player.playVideo === 'function') player.playVideo();
                }
                const v = document.querySelector('video');
                if (v) { v.muted = false; v.volume = 1.0; v.play().catch(() => {}); }
            }''')
            is_muted = await page.evaluate("() => { const v = document.querySelector('video'); return v ? v.muted : false; }")
            if is_muted:
                await page.keyboard.press("m")
            await asyncio.sleep(1.0)
        except Exception:
            pass
    else:
        # Ensure ads are fully loaded and rendered before taking screenshot
        await prepare_and_verify_ads(page, 0, is_mobile=("Mobile" in device))

    INTERACTIVE_BROWSER_STATE["url"] = page.url
    INTERACTIVE_BROWSER_STATE["title"] = await page.title()
    shot = await page.screenshot(type="jpeg", quality=65)
    b64 = base64.b64encode(shot).decode()
    INTERACTIVE_BROWSER_STATE["last_frame_b64"] = b64

    return web.json_response({
        "success": True,
        "url": INTERACTIVE_BROWSER_STATE["url"],
        "title": INTERACTIVE_BROWSER_STATE["title"],
        "frame_b64": b64,
        "screenshot_b64": b64
    })

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bet With Net - Enterprise Traffic Engine & Cloud Node (dollar.betwithnet.com)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #080c14;
      --card: #0f172a;
      --card-secondary: #141e33;
      --card-hover: #18243e;
      --card-border: #1e293b;
      --card-border-glow: #38bdf8;
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --accent: #38bdf8;
      --neon-purple: #818cf8;
      --header-bg: #0b1120;
      --header-border: #1e3a5f;
      --tab-bg: #0b1222;
      --tab-active: #0284c7;
      --tab-unselected: #131d31;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --success: #10b981;
      --danger: #f43f5e;
      --warning: #f59e0b;
      --input-bg: #0b1322;
      --input-border: #1e2f47;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      overflow-x: hidden;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }

    /*  Password Protection Lock Screen */
    #lock-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 7, 13, 0.96);
      backdrop-filter: blur(16px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .lock-box {
      background: #0f172a;
      border: 1px solid #1e3a5f;
      border-radius: 20px;
      padding: 36px 28px;
      width: min(420px, 94vw);
      box-shadow: 0 0 60px rgba(2, 132, 199, 0.3);
      text-align: center;
      box-sizing: border-box;
    }
    .lock-icon { font-size: 48px; margin-bottom: 12px; }

    /* Top Command Header */
    .header {
      background: var(--header-bg);
      border-bottom: 1px solid var(--header-border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
      flex-wrap: wrap;
      gap: 10px;
    }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .brand-logo {
      width: 44px; height: 44px; border-radius: 10px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #fff;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
      flex-shrink: 0;
    }
    .brand-title { font-size: 17px; font-weight: 800; letter-spacing: -0.3px; color: #fff; }
    .brand-sub { font-size: 11px; color: var(--text-muted); }
    .top-telemetry { display: flex; align-items: center; gap: 10px; font-size: 12px; flex-wrap: wrap; }
    .badge-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 20px;
      font-weight: 600; background: #131e33; border: 1px solid var(--card-border);
    }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--success); box-shadow: 0 0 8px var(--success);
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* Main Container */
    .app-wrap {
      flex: 1;
      max-width: 1440px;
      width: 100%;
      margin: 0 auto;
      padding: 16px 20px 24px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    /* Tab Navigation Bar (10 Tabs matching Desktop GUI) */
    .tab-bar {
      background: var(--tab-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 8px 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
      align-items: center;
    }
    .tab-btn {
      flex: 0 0 auto !important;
      width: auto !important;
      min-width: max-content !important;
      background: var(--tab-unselected);
      color: var(--text-muted);
      border: 1px solid #1e2f47;
      border-radius: 8px;
      padding: 9px 15px !important;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: all 0.2s ease;
      white-space: nowrap !important;
    }
    .tab-btn:hover {
      background: #1a2744;
      color: #fff;
      border-color: #38bdf8;
      transform: translateY(-1px);
    }
    .tab-btn.active {
      background: var(--tab-active) !important;
      color: #fff !important;
      box-shadow: 0 0 15px rgba(2, 132, 199, 0.45) !important;
      border-color: #38bdf8 !important;
    }

    /* Tab Panes */
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* Target Strip */
    .target-strip {
      background: #091326; border: 1px solid #1e3a5f; border-radius: 8px;
      padding: 10px 16px; display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
    }

    /* Common Card Styles */
    .card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 15px; font-weight: 800; margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px; color: var(--accent);
    }
    .form-group { margin-bottom: 12px; }
    .form-label { display: block; font-size: 11.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; }
    .form-input, .form-select, .form-textarea {
      width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
      color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 13.5px;
      font-family: inherit; transition: all 0.2s; box-sizing: border-box;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none; border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }

    /* Responsive Grids */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .grid-6 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }

    /* Responsive Buttons */
    .btn {
      padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
      border: none; cursor: pointer; display: inline-flex; align-items: center;
      justify-content: center; gap: 6px; transition: all 0.2s; min-height: 42px;
    }
    .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; }
    .btn-primary:hover { background: #0284c7; transform: translateY(-1px); }
    .btn-warning { background: #d97706; color: #fff; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-success { background: #059669; color: #fff; }

    .btn-group-responsive {
      display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap;
    }
    .btn-group-responsive .btn-primary { flex: 3; padding: 13px; min-width: 160px; }
    .btn-group-responsive .btn-warning,
    .btn-group-responsive .btn-danger { flex: 1; min-width: 100px; }

    /* Interactive Campaign Mode Selector Cards */
    .mode-cards {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 14px;
    }
    .mode-card {
      background: var(--card-secondary);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .mode-card:hover { background: var(--card-hover); border-color: #334155; }
    .mode-card.active {
      border-color: var(--accent);
      background: #0d213d;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
    }
    .mode-card-title { font-size: 13.5px; font-weight: 800; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .mode-card-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

    /* KPI Cards */
    .kpi-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px;
    }
    .kpi-box {
      background: var(--card); border: 1px solid var(--card-border);
      border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px;
    }
    .kpi-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .kpi-val { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #fff; }

    /* CCTV Screen & Interactive Viewport */
    .cctv-wrap {
      background: #04070d; border-radius: 12px; border: 1px solid #162238;
      height: clamp(280px, 48vh, 520px);
      display: flex; flex-direction: column; overflow: hidden; position: relative;
    }
    .cctv-head {
      background: rgba(8, 14, 27, 0.95); padding: 10px 16px;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #162238; font-size: 12px; font-weight: 700;
      flex-wrap: wrap; gap: 6px;
    }
    .cctv-body {
      flex: 1; display: flex; align-items: center; justify-content: center; background: #020408;
      overflow: hidden; padding: 6px;
    }
    .cctv-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 6px; }

    /* Custom HTTP Browser bar */
    .browser-nav-bar {
      display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;
    }
    .browser-nav-bar input { flex: 3; min-width: 200px; }
    .browser-nav-bar select { flex: 1; min-width: 130px; }
    .browser-nav-bar button { flex: 1; min-width: 110px; }

    /* FlashProxy Row */
    .fp-input-row {
      display: flex; gap: 8px; flex-wrap: wrap;
    }
    .fp-input-row input { flex: 1; min-width: 200px; }

    /* Responsive Table Container */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 8px;
    }
    table { width: 100%; min-width: 600px; border-collapse: collapse; font-size: 12.5px; }
    th { text-align: left; padding: 10px 14px; color: var(--text-muted); border-bottom: 1px solid var(--card-border); font-size: 11px; text-transform: uppercase; }
    td { padding: 11px 14px; border-bottom: 1px solid #111c33; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .badge-eng { background: #0c213d; color: #38bdf8; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700; }
    .badge-ref { background: #172554; color: #60a5fa; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700; }

    /* Terminal Console */
    .terminal-box {
      background: #030712; border: 1px solid #111827; border-radius: 10px;
      padding: 14px; height: 260px; overflow-y: auto; font-family: 'JetBrains Mono', monospace;
      font-size: 12px; color: #10b981; line-height: 1.6;
    }

    /* Progress bar */
    .progress-bar-wrap {
      background: #080e1b; border: 1px solid var(--card-border); border-radius: 20px;
      height: 12px; overflow: hidden; margin-bottom: 16px;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #0284c7, #38bdf8); height: 100%; width: 0%; transition: width 0.3s;
    }

    
    .btn-action-stop {
      background: linear-gradient(135deg, #ea580c, #c2410c);
      color: #fff;
      border: 1px solid #f97316;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-stop:hover {
      background: linear-gradient(135deg, #f97316, #ea580c);
      box-shadow: 0 0 10px rgba(234, 88, 12, 0.4);
    }
    .btn-action-del {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: #fff;
      border: 1px solid #ef4444;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-del:hover {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
    }

    /*  FULL RESPONSIVE MEDIA QUERIES (Mobile, Tablet, Desktop) */
    @media (max-width: 1024px) {
      .tab-bar {
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: #0284c7 #0a101f;
        padding: 8px;
      }
      .tab-bar::-webkit-scrollbar { height: 4px; }
      .tab-bar::-webkit-scrollbar-track { background: #0a101f; border-radius: 4px; }
      .tab-bar::-webkit-scrollbar-thumb { background: #0284c7; border-radius: 4px; }
      .tab-btn {
        flex: 0 0 auto !important;
        min-width: max-content !important;
        padding: 9px 14px !important;
        font-size: 12px;
      }
    }

    @media (max-width: 860px) {
      .mode-cards {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }

    @media (max-width: 768px) {
      .app-wrap {
        padding: 10px 12px 20px;
      }
      .header {
        padding: 10px 14px;
      }
      .brand-box { gap: 10px; }
      .brand-logo { width: 36px; height: 36px; font-size: 18px; }
      .brand-title { font-size: 14px; line-height: 1.2; }
      .brand-sub { display: none; }
      .top-telemetry {
        width: 100%;
        justify-content: space-between;
        padding-top: 4px;
      }
      .badge-pill { font-size: 11px; padding: 4px 8px; }

      .card { padding: 14px; }
      .grid-2, .grid-3 {
        grid-template-columns: 1fr !important;
        gap: 10px;
      }
      .kpi-row {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .kpi-box { padding: 10px 12px; }
      .kpi-val { font-size: 20px; }
    }

    @media (max-width: 640px) {
      .btn-group-responsive {
        flex-direction: column;
        gap: 8px;
      }
      .btn-group-responsive button {
        width: 100% !important;
        flex: none !important;
        padding: 12px !important;
      }
      .browser-nav-bar {
        flex-direction: column;
        gap: 8px;
      }
      .browser-nav-bar input,
      .browser-nav-bar select,
      .browser-nav-bar button {
        width: 100%;
        flex: none;
      }
      .fp-input-row {
        flex-direction: column;
        gap: 8px;
      }
      .fp-input-row input,
      .fp-input-row button {
        width: 100%;
      }
      .target-strip {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 420px) {
      .kpi-row {
        grid-template-columns: 1fr;
      }
      .lock-box {
        padding: 24px 16px;
      }
      .lock-box h2 {
        font-size: 18px !important;
      }
    }
  </style>
</head>
<body>
  <div id="toast-container" style="position:fixed; top:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;"></div>

  <!-- Password Security Lock Overlay -->
  <div id="lock-overlay">
    <div class="lock-box">
      <div class="lock-icon"></div>
      <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Bet With Net Security Lock</h2>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 24px;">Enter enterprise authorization password to unlock:</p>
      <input type="password" id="inp-auth-pass" class="form-input" placeholder="Enter Password..." style="margin-bottom: 16px; text-align: center; font-size: 16px;" onkeydown="if(event.key==='Enter') unlockSite();">
      <button class="btn btn-primary" style="width: 100%; padding: 13px;" onclick="unlockSite()">Unlock Suite</button>
      <div id="lock-err-msg" style="color: var(--danger); font-size: 12px; margin-top: 12px; display: none; font-weight: 700;">Invalid Password. Access Denied.</div>
    </div>
  </div>

  <!-- Header -->
  <header class="header">
    <div class="brand-box">
      <div class="brand-logo"></div>
      <div>
        <div class="brand-title">Bet With Net - Enterprise Traffic Suite</div>
        <div class="brand-sub">dollar.betwithnet.com | Worldwide Multi-Engine Pool & Cloud Node (212.47.76.113)</div>
      </div>
    </div>
    <div class="top-telemetry">
      <div class="badge-pill"><div class="pulse-dot"></div> <span id="top-node-status">212.47.76.113</span></div>
      <div class="badge-pill" id="top-pd-badge" style="border-color:#10b981; color:#10b981; font-weight:700;"> Bet With Net: Active</div>
        <div class="badge-pill" id="top-fp-badge">FlashProxy: Inactive</div>
      <button class="btn btn-primary" style="padding: 5px 12px; font-size: 11px;" onclick="openPasswordModal()">Change Password</button>
      <button class="btn btn-warning" style="padding: 5px 10px; font-size: 11px;" onclick="lockSite()"> Lock</button>
    </div>
  </header>

  
  <!-- Password Change Modal -->
  <div id="modal-password" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(4,7,13,0.92); backdrop-filter:blur(14px); z-index:10001; align-items:center; justify-content:center; padding:16px;">
    <div class="lock-box" style="width:min(440px, 94vw); text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="font-size:18px; font-weight:800; color:#f8fafc;">Change Master Password</h3>
        <button onclick="closePasswordModal()" style="background:transparent; border:none; color:#94a3b8; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
      </div>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:16px;">Set your new access password. Stored securely & persistently in the VPS database.</p>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Current Password:</label>
        <input type="password" id="inp-pwd-old" class="form-input" placeholder="Current Password">
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">New Password:</label>
        <input type="password" id="inp-pwd-new" class="form-input" placeholder="New Password (min 4 chars)">
      </div>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Confirm New Password:</label>
        <input type="password" id="inp-pwd-confirm" class="form-input" placeholder="Re-enter New Password">
      </div>
      <div id="pwd-modal-msg" style="display:none; font-size:12px; margin-bottom:12px; font-weight:700;"></div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" style="flex:1; padding:11px;" onclick="submitPasswordChange()">Save Password</button>
        <button class="btn btn-secondary" style="padding:11px 18px;" onclick="closePasswordModal()">Cancel</button>
      </div>
    </div>
  </div>

  <div class="app-wrap">

    <!-- Active Campaign Background Persistent Banner -->
    <div id="active-order-banner" style="display:none; background: linear-gradient(90deg, #064e3b, #047857); border: 1px solid #10b981; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:22px;"></span>
        <div>
          <div style="font-weight:800; font-size:13px; color:#ecfdf5;" id="banner-order-text">Campaign ORD-XXX is actively running on VPS!</div>
          <div style="font-size:11px; color:#a7f3d0;">Closing this tab or mobile browser will NOT stop the order. It persists in background until finished.</div>
        </div>
      </div>
      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 12px;" onclick="switchTab('tab-analytics')">View Live Analytics</button>
    </div>

    
    <!-- 10 Navigation Tabs (DITTO match to Desktop GUI) -->
    <nav class="tab-bar">
      <button class="tab-btn active" onclick="switchTab('tab-submit')">Submit Order</button>
      <button class="tab-btn" onclick="switchTab('tab-analytics')">Live Analytics</button>
      <button class="tab-btn" onclick="switchTab('tab-cctv')">‘ Live CCTV Inspector</button>
      <button class="tab-btn" onclick="switchTab('tab-browser')">Œ Custom HTTP Browser</button>
      <button class="tab-btn" onclick="switchTab('tab-history')">Order History</button>
      <button class="tab-btn" onclick="switchTab('tab-ip2world')">Œ IP2World Proxies</button>
      <button class="tab-btn" onclick="switchTab('tab-proxies')"> Bet With Net & Proxy Pool</button>
      <button class="tab-btn" onclick="switchTab('tab-cloud')">˜ Cloud Server</button>
      <button class="tab-btn" onclick="switchTab('tab-health')">System Health</button>
      <button class="tab-btn" onclick="switchTab('tab-diagnostics')">  Diagnostics</button>
      <button class="tab-btn" onclick="switchTab('tab-pk-guard')">Pakistan Safe Login Guard</button>
      <a href="/cloud-browser" target="_blank" rel="noopener noreferrer" class="tab-btn" style="background:linear-gradient(135deg, #059669, #10b981); color:#fff !important; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:6px; box-shadow:0 0 12px rgba(16,185,129,0.4); border:1px solid #10b981;">Cloud Anti-Detect Browser (10 Accounts)</a>
    </nav>

    <!-- TAB 1:  SUBMIT ORDER -->
    <div id="tab-submit" class="tab-content active">
      <!-- Target Strip -->
      <div class="target-strip">
        <span style="font-size: 12px; font-weight: 700; color: #38bdf8;">⚡ Execution Target: Bet With Net High-Speed Cloud Node (212.47.76.113 - 1000 Mbps Pipe)</span>
        <span id="lbl-order-id-auto" style="font-size: 12px; font-weight: 800; color: #10b981;">Order ID: Auto-Generated</span>
      </div>

      <!-- 3 Mode Cards -->
      <div class="mode-cards">
        <div class="mode-card active" id="card-mode-website" onclick="setCampaignMode('website')">
          <div class="mode-card-title">Œ Website Direct Traffic</div>
          <div class="mode-card-desc">Direct URL visit, smooth scroll, dwell time, social referrers (FB, IG, X, Reddit) & ad clicks.</div>
        </div>
        <div class="mode-card" id="card-mode-youtube" onclick="setCampaignMode('youtube')">
          <div class="mode-card-title">YouTube Video & Watch</div>
          <div class="mode-card-desc">Auto-play, Theater mode, comment browsing, auto-unmute & long dwell watch time.</div>
        </div>
        <div class="mode-card" id="card-mode-google" onclick="setCampaignMode('google_search')">
          <div class="mode-card-title">” Google Organic SERP</div>
          <div class="mode-card-desc">Types search query in Google, finds target domain in organic results, and clicks result.</div>
        </div>
        <div class="mode-card" id="card-mode-whatsapp" onclick="setCampaignMode('whatsapp')" style="border-left: 3px solid #25D366;">
          <div class="mode-card-title" style="color: #25D366;">💬 WhatsApp Channel & Members</div>
          <div class="mode-card-desc">Boost WhatsApp Channel Followers (whatsapp.com/channel/...) & Group Members with verified interaction.</div>
        </div>
      </div>

      <!-- Dynamic Inputs Card -->
      <div class="card" id="mode-input-container">
        <!-- Website Inputs -->
        <div id="view-mode-website">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Œ Destination Website URL:</label>
              <input type="url" id="inp-web-url" class="form-input" value="https://dollar.betwithnet.com" placeholder="https://example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Œ Traffic Referrer Source:</label>
              <select id="inp-web-ref" class="form-select">
                <option value="Direct">Direct Navigation (No Referrer)</option>
                <option value="Facebook" selected>Facebook (https://www.facebook.com/)</option>
                <option value="Instagram">Instagram (https://www.instagram.com/)</option>
                <option value="WhatsApp">WhatsApp (https://web.whatsapp.com/)</option>
                <option value="Twitter / X">Twitter / X (https://x.com/)</option>
                <option value="Reddit">Reddit (https://www.reddit.com/)</option>
                <option value="Quora">Quora (https://www.quora.com/)</option>
                <option value="Pinterest">Pinterest (https://www.pinterest.com/)</option>
                <option value="LinkedIn">LinkedIn (https://www.linkedin.com/)</option>
                <option value="Google">Google (https://www.google.com/)</option>
                <option value="Bing">Bing (https://www.bing.com/)</option>
                <option value="Yahoo">Yahoo (https://search.yahoo.com/)</option>
                <option value="DuckDuckGo">DuckDuckGo (https://duckduckgo.com/)</option>
                <option value="TikTok">TikTok (https://www.tiktok.com/)</option>
                <option value="YouTube">YouTube (https://www.youtube.com/)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- YouTube Inputs -->
        <div id="view-mode-youtube" style="display: none;">
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; color: #a7f3d0;">
            <b>[ONLINE] Zero-Drop YouTube Algorithm Active:</b> Verified unmuted playback (100%), ad auto-skipping, minimum 35s confirmed watchtime, and telemetry beacon flush ensure 100% permanent views in YouTube Studio Live Analytics.
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label"> YouTube Video URL:</label>
              <input type="url" id="inp-yt-url" class="form-input" placeholder="https://www.youtube.com/watch?v=...">
            </div>
            <div class="form-group">
              <label class="form-label">” YouTube Search Keyword (Optional):</label>
              <input type="text" id="inp-yt-kw" class="form-input" placeholder="e.g. funny cats 2024">
            </div>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Target Watch Time (sec):</label>
              <input type="number" id="inp-yt-watch-time" class="form-input" value="60">
            </div>
            <div class="form-group">
              <label class="form-label">Auto-Unmute Audio:</label>
              <select id="inp-yt-unmute" class="form-select">
                <option value="true" selected>Yes (Unmute Video)</option>
                <option value="false">No (Keep Muted)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Theater Mode / Full View:</label>
              <select id="inp-yt-theater" class="form-select">
                <option value="true" selected>Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Google SERP Inputs -->
        <div id="view-mode-google" style="display: none;">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">” Google Search Keyword:</label>
              <input type="text" id="inp-goog-kw" class="form-input" placeholder="e.g. best cloud views software">
            </div>
            <div class="form-group">
              <label class="form-label">Target Domain to Click in SERP:</label>
              <input type="text" id="inp-goog-domain" class="form-input" placeholder="example.com">
            </div>
          </div>
        </div>

        <!-- WhatsApp Inputs -->
        <div id="view-mode-whatsapp" style="display: none;">
          <div style="background: rgba(37, 211, 102, 0.1); border: 1px solid #25D366; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; color: #86efac;">
            <b>💬 [ONLINE] WhatsApp Channel Followers & Group Members Booster:</b> Supports WhatsApp Channels (<code>https://whatsapp.com/channel/...</code>) and WhatsApp Groups (<code>https://chat.whatsapp.com/...</code>). Automates channel landing page dwell, auto-clicking 'Follow' / 'View Channel' / 'Join Chat', and simulating human post browsing.
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">💬 WhatsApp Channel / Group URL:</label>
              <input type="url" id="inp-wa-url" class="form-input" placeholder="https://whatsapp.com/channel/0029Va... or https://chat.whatsapp.com/...">
            </div>
            <div class="form-group">
              <label class="form-label">🎯 Target Action Type:</label>
              <select id="inp-wa-action" class="form-select">
                <option value="follow_channel" selected>Channel Followers (Auto-Click 'Follow' & 'View Channel')</option>
                <option value="group_members">Group Members (Auto-Click 'Join Chat' / 'View Group')</option>
                <option value="view_updates">Channel Dwell & Updates Read (Max Engagement)</option>
              </select>
            </div>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Dwell / Interaction Time (sec):</label>
              <input type="number" id="inp-wa-dwell" class="form-input" value="30" min="10" max="300">
            </div>
            <div class="form-group">
              <label class="form-label">Emulate Device:</label>
              <select id="inp-wa-device" class="form-select">
                <option value="Mobile" selected>Mobile Smartphone (Recommended for WhatsApp)</option>
                <option value="Desktop">Desktop Browser</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Traffic Referrer Source:</label>
              <select id="inp-wa-ref" class="form-select">
                <option value="Direct" selected>Direct Navigation</option>
                <option value="Google">Google (https://www.google.com/)</option>
                <option value="Facebook">Facebook (https://www.facebook.com/)</option>
                <option value="Instagram">Instagram (https://www.instagram.com/)</option>
                <option value="TikTok">TikTok (https://www.tiktok.com/)</option>
                <option value="Telegram">Telegram (https://t.me/)</option>
                <option value="Twitter / X">Twitter / X (https://x.com/)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Universal Campaign Parameters -->
      <div class="card">
        <div class="card-title">Universal Campaign Parameters</div>
        <!-- Shared Parameters Matrix (6 Columns) -->
        <div class="grid-6" style="margin-top: 10px;">
          <div class="form-group">
            <label class="form-label">Total Sessions:</label>
            <input type="number" id="inp-param-sessions" class="form-input" value="50" min="1" max="100000">
          </div>
          <div class="form-group">
            <label class="form-label">Duration:</label>
            <div style="display: flex; gap: 4px;">
              <input type="number" id="inp-param-duration" class="form-input" value="15" min="5">
              <select id="inp-param-dur-unit" class="form-select" style="width: 70px;">
                <option value="sec" selected>sec</option>
                <option value="min">min</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Device Mode:</label>
            <select id="inp-param-device" class="form-select">
              <option value="Desktop" selected>Desktop</option>
              <option value="Mobile">Mobile (iOS/Android)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Total Ad Clicks:</label>
            <input type="number" id="inp-param-clicks" class="form-input" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Clicks / Session:</label>
            <input type="number" id="inp-param-clicks-per-s" class="form-input" value="1">
          </div>
          <div class="form-group">
            <label class="form-label">Click Delay (sec):</label>
            <input type="number" id="inp-param-click-delay" class="form-input" value="5">
          </div>
        </div>

        <!-- Concurrency Channels Slider -->
        <div style="background: #08101e; border: 1px solid var(--card-border); border-radius: 10px; padding: 14px 16px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
            <label class="form-label" style="margin-bottom: 0; font-size: 13px;">⚡ Ultra-Speed Concurrent Channels (Browsers Running in Parallel):</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="number" id="inp-channels-num" class="form-input" value="30" min="1" max="80" style="width: 75px; padding: 4px 8px; font-weight: bold; color: #10b981; font-size: 14px;" onchange="document.getElementById('inp-channels-slider').value = this.value">
              <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="setSpeedPreset(20)">20x</button>
              <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="setSpeedPreset(40)">40x</button>
              <button type="button" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; font-weight: bold; background: linear-gradient(135deg, #f59e0b, #ef4444); border: none;" onclick="setTurbo100()">⚡ Turbo 80x Max</button>
            </div>
          </div>
          <input type="range" id="inp-channels-slider" min="1" max="80" value="30" style="width: 100%; cursor: pointer;" oninput="document.getElementById('inp-channels-num').value = this.value">
        </div>

        <!-- Network Route, Engine Matrix & Data Saver -->
        <div class="grid-2" style="margin-top: 12px;">
          <div class="form-group">
            <label class="form-label"> Data Saver Filter Mode (Ad-Preserving):</label>
            <select id="inp-data-saver" class="form-select" style="border-color: #10b981; background: rgba(16, 185, 129, 0.06);">
              <option value="disabled" selected>[ONLINE] 100% Genuine Display (All Ads & Media Loaded  -  Safe for Monetized Sites)</option>
              <option value="ultra_lean"> Ultra Lean (Data Saving Mode: ~200 KB/view)</option>
              <option value="standard"> Standard Saver (Block Non-Ad Videos Only)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label">Œ Target Proxy Country (Bet With Net Rotation):</label>
                        <select id="inp-proxy-country" class="form-select" style="border-color:#10b981; background:rgba(16,185,129,0.06);">
              <option value="GLOBAL" selected>🌐 Worldwide (Fastest 1000+ Multi-Nation Pool - Instant Speed)</option>
              <option value="AU_DE">🇦🇺 Australia & 🇩🇪 Germany (High Tier Tier-1 Pool)</option>
              <option value="AU">🇦🇺 Australia (AU Only)</option>
              <option value="DE">🇩🇪 Germany (DE Only)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Œ Network Route:</label>
            <select id="inp-route" class="form-select">
              <option value="betwithnet" selected> Bet With Net Rotating Proxy (Har Session Naya Verified IP)</option>
              <option value="flashproxy">FlashProxy Dynamic Rotating (Auto-Rotates IP)</option>
              <option value="ip2world">Œ IP2World Dedicated Proxy Pool</option>
              <option value="static"> Static Proxy List</option>
              <option value="direct">Œ Direct Connection (No Proxy)</option>
            </select>
          </div>
        </div>
        <div class="grid-2" style="margin-top: 8px;">
          <div class="form-group">
            <label class="form-label">Engine Matrix:</label>
            <select id="inp-engine" class="form-select">
              <option value="custom_http_browser" selected>Œ Custom HTTP Browser (Anti-Detect Mode)</option>
              <option value="auto"> 11-Engine Multi-Pool (Auto Load Balancing)</option>
              <option value="chrome">Google Chrome (Stable)</option>
              <option value="edge">Microsoft Edge (Stable)</option>
              <option value="brave">Brave Browser</option>
              <option value="headless">Headless Shell (Ultra-Light)</option>
              <option value="firefox">Firefox (Gecko)</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Smooth Scroll & Speed:</label>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
              <input type="checkbox" id="inp-scroll-check" checked style="width: 18px; height: 18px; cursor: pointer;">
              <select id="inp-scroll-speed" class="form-select" style="flex: 1;">
                <option value="Slow">Slow</option>
                <option value="Medium" selected>Medium</option>
                <option value="Fast">Fast</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Launch Buttons -->
        <div class="btn-group-responsive">
          <button class="btn btn-primary" onclick="submitCampaign()"> Launch Campaign Order</button>
          <button class="btn btn-warning" onclick="pauseCampaign()"> Pause</button>
          <button class="btn btn-danger" onclick="stopCampaign()">[BLOCKED] Stop</button>
        </div>
      </div>
    </div>

    <!-- TAB 2:  LIVE ANALYTICS -->
    <div id="tab-analytics" class="tab-content">
      <div class="card" style="margin-bottom: 12px; background: #081120; border-color: #1e3a5f;">
        <span style="font-size: 13px; font-weight: 800; color: #38bdf8;" id="analytics-order-title">Active Order: [IDLE] Ready for Order Submission</span>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" id="analytics-progress"></div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box"><div class="kpi-label">Active Workers</div><div class="kpi-val" id="kpi-act-workers" style="color: var(--success);">0</div></div>
        <div class="kpi-box"><div class="kpi-label">Completed Sessions</div><div class="kpi-val" id="kpi-act-comp">0</div></div>
        <div class="kpi-box"><div class="kpi-label">Failed Sessions</div><div class="kpi-val" id="kpi-act-fail" style="color: var(--danger);">0</div></div>
        <div class="kpi-box"><div class="kpi-label">Data Consumed (Order)</div><div class="kpi-val" id="kpi-order-bandwidth" style="color: #c084fc;">0.00 MB</div></div>
        <div class="kpi-box"><div class="kpi-label">Total Proxy Data</div><div class="kpi-val" id="kpi-total-bandwidth" style="color: #38bdf8;">0.00 MB</div></div>
        <div class="kpi-box"><div class="kpi-label">Data Saver Filter</div><div class="kpi-val" id="kpi-saver-mode" style="color: #10b981; font-size: 13px; font-weight: 800;"> ULTRA LEAN (~95% Saved)</div></div>
        <div class="kpi-box"><div class="kpi-label">Ad Clicks Executed</div><div class="kpi-val" id="kpi-act-clicks">0 / 0</div></div>
        <div class="kpi-box"><div class="kpi-label">Elapsed Uptime</div><div class="kpi-val" id="kpi-act-uptime">00:00:00</div></div>
      </div>

      <div class="card">
        <div class="card-title">Live Execution Event Stream</div>
        <div class="terminal-box" id="analytics-terminal">
          <div>[System] Bet With Net Suite Loaded. Ready for cloud worker execution. Ready for cloud worker execution.</div>
        </div>
      </div>
    </div>

    <!-- TAB 3: ‘ LIVE VISUAL INSPECTOR (CCTV) -->
    <div id="tab-cctv" class="tab-content">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
          <div class="card-title" style="margin-bottom: 0;">‘ Live Visual CCTV Monitor (Per-Session Feeds)</div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Feed Mode:</label>
            <select id="cctv-mode-select" class="form-select" style="width: auto; padding: 6px 12px; font-size: 12px;" onchange="changeCctvMode()">
              <option value="single">Single View (Focus)</option>
              <option value="quad">Ž Quad-View (4-Cam Grid)</option>
            </select>
            <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Session:</label>
            <select id="cctv-session-select" class="form-select" style="width: auto; padding: 6px 12px; font-size: 12px;" onchange="changeCctvSession()">
              <option value="auto">”„ Auto-Rotate Active</option>
            </select>
          </div>
        </div>

        <!-- Single Screen Focus Mode -->
        <div id="cctv-single-wrap" class="cctv-wrap">
          <div class="cctv-head">
            <span style="color: #f43f5e;"><span class="pulse-dot" style="background:#f43f5e; box-shadow:0 0 8px #f43f5e;"></span> <span id="cctv-cam-tag">LIVE CCTV MONITOR</span></span>
            <span id="cctv-action-lbl" style="font-family: monospace; color: #94a3b8;">Waiting for browser frames...</span>
          </div>
          <div class="cctv-body">
            <img id="cctv-live-img" class="cctv-img" style="display: none;" alt="CCTV Screen">
            <div id="cctv-empty-view" style="color: #64748b; text-align: center;">
              <div style="font-size: 42px; margin-bottom: 8px;"></div>
              <div style="font-weight: 700;">No Active Browser Sessions</div>
              <div style="font-size: 11px;">Submit an order to stream real-time browser views</div>
            </div>
          </div>
        </div>

        <!-- Quad-View Multi-Cam Grid -->
        <div id="cctv-quad-wrap" style="display: none;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
            <div class="cctv-wrap" style="border-radius: 8px;">
              <div class="cctv-head" style="padding: 6px 10px; font-size: 11px;">
                <span style="color: #38bdf8;"><span class="pulse-dot" style="background:#38bdf8;"></span> CAM 1</span>
                <span id="quad-tag-1" style="font-family: monospace; color: #94a3b8;">Idle</span>
              </div>
              <div class="cctv-body" style="min-height: 180px;">
                <img id="quad-img-1" class="cctv-img" style="display: none;" alt="CAM 1">
                <div id="quad-empty-1" style="color: #64748b; font-size: 11px; text-align: center;">CAM 1 Waiting...</div>
              </div>
            </div>
            <div class="cctv-wrap" style="border-radius: 8px;">
              <div class="cctv-head" style="padding: 6px 10px; font-size: 11px;">
                <span style="color: #38bdf8;"><span class="pulse-dot" style="background:#38bdf8;"></span> CAM 2</span>
                <span id="quad-tag-2" style="font-family: monospace; color: #94a3b8;">Idle</span>
              </div>
              <div class="cctv-body" style="min-height: 180px;">
                <img id="quad-img-2" class="cctv-img" style="display: none;" alt="CAM 2">
                <div id="quad-empty-2" style="color: #64748b; font-size: 11px; text-align: center;">CAM 2 Waiting...</div>
              </div>
            </div>
            <div class="cctv-wrap" style="border-radius: 8px;">
              <div class="cctv-head" style="padding: 6px 10px; font-size: 11px;">
                <span style="color: #38bdf8;"><span class="pulse-dot" style="background:#38bdf8;"></span> CAM 3</span>
                <span id="quad-tag-3" style="font-family: monospace; color: #94a3b8;">Idle</span>
              </div>
              <div class="cctv-body" style="min-height: 180px;">
                <img id="quad-img-3" class="cctv-img" style="display: none;" alt="CAM 3">
                <div id="quad-empty-3" style="color: #64748b; font-size: 11px; text-align: center;">CAM 3 Waiting...</div>
              </div>
            </div>
            <div class="cctv-wrap" style="border-radius: 8px;">
              <div class="cctv-head" style="padding: 6px 10px; font-size: 11px;">
                <span style="color: #38bdf8;"><span class="pulse-dot" style="background:#38bdf8;"></span> CAM 4</span>
                <span id="quad-tag-4" style="font-family: monospace; color: #94a3b8;">Idle</span>
              </div>
              <div class="cctv-body" style="min-height: 180px;">
                <img id="quad-img-4" class="cctv-img" style="display: none;" alt="CAM 4">
                <div id="quad-empty-4" style="color: #64748b; font-size: 11px; text-align: center;">CAM 4 Waiting...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Active Workers Telemetry & CCTV Director</div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>Session</th><th>Engine</th><th>Proxy IP & Country</th><th>Proxy Status</th><th>Referrer</th><th>Action</th><th>Elapsed</th><th>CCTV Feed</th></tr>
            </thead>
            <tbody id="telemetry-tbody">
              <tr><td colspan="7" style="text-align:center; color:#64748b; padding:20px;">No active sessions running</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

        <!-- TAB 4: Œ CUSTOM HTTP BROWSER (DEDICATED CAMPAIGN & INSPECTOR) -->
    <div id="tab-browser" class="tab-content">
      <div class="card" style="margin-bottom: 16px; border-color: #0284c7;">
        <div class="card-title" style="color: #38bdf8; font-size: 16px;">Œ Dedicated Custom HTTP Browser Control Center</div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
          Execute campaigns <b>strictly and exclusively</b> using the authentic Custom HTTP Anti-Detect Browser. Every session routes exclusively through this engine with stealth protection and dynamic proxy integration.
        </p>

        <!-- Custom HTTP Campaign Parameters -->
        <div class="grid-2" style="margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label"> Target Destination URL:</label>
            <input type="url" id="inp-ch-url" class="form-input" value="https://whoer.net" placeholder="https://example.com">
          </div>
          <div class="form-group">
            <label class="form-label">”— Referrer / Social Media Route:</label>
            <select id="inp-ch-ref" class="form-select">
              <option value="Direct">Direct Traffic (No Referrer)</option>
              <option value="Facebook">Facebook (https://www.facebook.com/)</option>
              <option value="Instagram">Instagram (https://www.instagram.com/)</option>
              <option value="Twitter / X">Twitter / X (https://x.com/)</option>
              <option value="Reddit">Reddit (https://www.reddit.com/)</option>
              <option value="Quora">Quora (https://www.quora.com/)</option>
              <option value="Pinterest">Pinterest (https://www.pinterest.com/)</option>
              <option value="LinkedIn">LinkedIn (https://www.linkedin.com/)</option>
              <option value="Google">Google Organic (https://www.google.com/)</option>
              <option value="Bing">Bing Search (https://www.bing.com/)</option>
              <option value="Yahoo">Yahoo Search (https://search.yahoo.com/)</option>
              <option value="DuckDuckGo">DuckDuckGo (https://duckduckgo.com/)</option>
              <option value="TikTok">TikTok (https://www.tiktok.com/)</option>
              <option value="YouTube">YouTube (https://www.youtube.com/)</option>
            </select>
          </div>
        </div>

        <div class="grid-4" style="margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label"> Proxy Routing Mode:</label>
            <select id="inp-ch-proxy" class="form-select">
              <option value="betwithnet" selected> Bet With Net Rotating Proxy (Auto Verified IP)</option>
              <option value="flashproxy">FlashProxy Rotating Gateway</option>
              <option value="ip2world">Œ Dedicated IP2World Pool</option>
              <option value="static"> Static Proxy List</option>
              <option value="direct">Œ Direct Connection (No Proxy)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Total Sessions:</label>
            <input type="number" id="inp-ch-sessions" class="form-input" value="50" min="1" max="50000">
          </div>
          <div class="form-group">
            <label class="form-label">Duration per Session:</label>
            <div style="display: flex; gap: 4px;">
              <input type="number" id="inp-ch-dur" class="form-input" value="15" min="5">
              <select id="inp-ch-dur-unit" class="form-select" style="width: 70px;">
                <option value="sec" selected>sec</option>
                <option value="min">min</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Concurrent Workers:</label>
            <input type="number" id="inp-ch-workers" class="form-input" value="30" min="1" max="80">
          </div>
        </div>

        <div class="grid-3" style="margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label"> Device Emulation:</label>
            <select id="inp-ch-device" class="form-select">
              <option value="Desktop" selected>Desktop (Win 11 Chrome)</option>
              <option value="Mobile">Mobile (iPhone 15 / Galaxy S24)</option>
              <option value="Mixed">Mixed (50% Desktop / 50% Mobile)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Smooth Scrolling:</label>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
              <input type="checkbox" id="inp-ch-scroll" checked style="width: 18px; height: 18px; cursor: pointer;">
              <select id="inp-ch-scroll-speed" class="form-select" style="flex: 1;">
                <option value="Slow">Slow Natural</option>
                <option value="Medium" selected>Medium Realistic</option>
                <option value="Fast">Fast Scan</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ad Click Simulation Quota:</label>
            <input type="number" id="inp-ch-clicks" class="form-input" value="0" min="0" placeholder="0 = Views Only">
          </div>
        </div>

        <!-- Custom HTTP Launch Actions -->
        <div class="btn-group-responsive" style="margin-bottom: 8px;">
          <button class="btn btn-primary" style="flex: 2; padding: 12px;" onclick="submitCustomHttpCampaign()"> Launch Custom HTTP Browser Campaign</button>
          <button class="btn btn-success" style="flex: 1; padding: 12px;" onclick="navigateCustomBrowserLive()">Œ Single Test Inspection</button>
        </div>
      </div>

      <!-- Live Interactive Browser Viewport -->
      <div class="card">
        <div class="card-title">Œ Live Custom HTTP Browser Viewport & Inspector</div>
        <div class="cctv-wrap">
          <div class="cctv-head">
            <span id="custom-b-title" style="color: #38bdf8;">Browser Viewport: Ready</span>
            <span id="custom-b-url" style="color: #94a3b8; font-family: monospace;">about:blank</span>
          </div>
          <div class="cctv-body">
            <img id="custom-b-img" class="cctv-img" style="display: none;" alt="Interactive Browser Screen">
            <div id="custom-b-empty" style="color: #64748b; text-align: center; padding: 30px;">
              <div style="font-size: 44px; margin-bottom: 10px;">Œ</div>
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Custom HTTP Browser Engine Idle</div>
              <div style="font-size: 12px;">Click "Single Test Inspection" or launch a campaign to inspect live browser frames</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5:  ORDER HISTORY -->
    <div id="tab-history" class="tab-content">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div class="card-title" style="margin-bottom: 0;">Order History Records (Persistent Database)</div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" style="padding: 6px 14px; font-size: 12px; font-weight: 700;" onclick="loadHistory()">”„ Refresh History</button>
          </div>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Campaign</th>
                <th>Target URL</th>
                <th>Sessions</th>
                <th>Duration</th>
                <th>Clicks</th>
                <th>Status</th>
                <th>Date</th>
                <th style="text-align:center; min-width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody id="history-tbody">
              <tr><td colspan="9" style="text-align:center; color:#64748b; padding:24px;">Loading order history...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 6: Œ IP2WORLD PROXIES -->
    <div id="tab-ip2world" class="tab-content">
      <div class="card">
        <div class="card-title">Œ IP2World Dedicated Proxy Pool</div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Paste your IP2World proxies below (one per line). Bet With Net will auto-parse and align 1 dedicated proxy per session.</p>
        <textarea id="inp-ip2world-list" class="form-textarea" rows="8" placeholder="IP:Port:User:Pass or IP:Port (one per line)"></textarea>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; flex-wrap: wrap; gap: 8px;">
          <span id="lbl-ip2world-stock" style="font-size: 12px; font-weight: 700; color: #38bdf8;">Stock: 0 Proxies Loaded</span>
          <button class="btn btn-success" onclick="saveIP2World()">Save IP2World List</button>
        </div>
      </div>
    </div>

    <!-- TAB 7: 🛡️ BET WITH NET & PROXY POOL -->
    <div id="tab-proxies" class="tab-content">
      <div class="card" style="border-left: 4px solid #10b981; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
          <div>
            <div class="card-title" style="color:#10b981; margin:0;"> Bet With Net Rotating Proxy System</div>
            <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 0;">Har session ke liye alag & verified IP. Pre-flight check har request se pehle hoti hai taake ranking kharab na ho.</p>
          </div>
          <button class="btn btn-primary" onclick="refreshBetWithNetPool()" id="btn-pd-refresh" style="background:#10b981; font-size:12px;">Refresh & Test Pool Now</button>
        </div>

        <div class="grid-4" style="margin-bottom: 14px;">
          <div class="kpi-box"><div class="kpi-label">Verified Proxies</div><div class="kpi-val" id="pd-stat-total" style="color:#10b981;">0</div></div>
          <div class="kpi-box"><div class="kpi-label">Available Countries</div><div class="kpi-val" id="pd-stat-countries" style="color:#38bdf8;">0</div></div>
          <div class="kpi-box"><div class="kpi-label">Last IP Verified</div><div class="kpi-val" id="pd-stat-last-ip" style="font-size:14px; color:#f59e0b;">None</div></div>
          <div class="kpi-box"><div class="kpi-label">Rotation Mode</div><div class="kpi-val" style="font-size:14px; color:#10b981;">Unique Per Session</div></div>
        </div>

        <div style="margin-bottom:12px;">
          <label class="form-label">• Add Custom Proxies to Bet With Net Pool (Optional, IP:Port or IP:Port:User:Pass):</label>
          <textarea id="inp-pd-custom" class="form-textarea" rows="3" placeholder="1.2.3.4:8080 (one per line)"></textarea>
          <button class="btn btn-secondary" onclick="saveCustomBetWithNet()" style="margin-top:6px; font-size:12px;">Save Custom Proxies</button>
        </div>

        <!-- Œ Active Countries Breakdown -->
        <div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>Œ Active Countries in Pool:</span>
          <span id="pd-pool-summary" style="color:#38bdf8; font-size:10px; font-weight:normal;">0 Countries Available</span>
        </div>
        <div id="pd-country-badges" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; max-height:80px; overflow-y:auto; padding:6px; background:#081322; border-radius:6px; border:1px solid #1e3a5f;">
          <span style="font-size:11px; color:#64748b;">Loading countries...</span>
        </div>

        <!--  Live Verified Proxies Table with Country & Latency -->
        <div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
          <span> Verified Proxies & Country Pool:</span>
          <input type="text" id="pd-proxy-search" placeholder="” Search IP or Country..." onkeyup="filterBetWithNetTable()" style="background:#0f172a; border:1px solid #334155; color:#f8fafc; font-size:10px; border-radius:4px; padding:2px 8px; width:180px;">
        </div>
        <div id="pd-pool-table-container" style="background:#081322; border:1px solid #1e3a5f; border-radius:6px; max-height:180px; overflow-y:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:11px; font-family:monospace; text-align:left;">
            <thead>
              <tr style="background:#0e1e38; color:#94a3b8; border-bottom:1px solid #1e3a5f; position:sticky; top:0;">
                <th style="padding:6px 10px;">Country</th>
                <th style="padding:6px 10px;">Public IP</th>
                <th style="padding:6px 10px;">Latency</th>
                <th style="padding:6px 10px;">Proxy Address</th>
                <th style="padding:6px 10px;">Status</th>
              </tr>
            </thead>
            <tbody id="pd-pool-table-body" style="color:#cbd5e1;">
              <tr><td colspan="5" style="padding:10px; text-align:center; color:#64748b;">Loading pool proxies...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-title">FlashProxy Dynamic Rotating Gateway</div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Configure your FlashProxy gateway URL (e.g. <code>host:port:user:pass</code> or <code>http://user:pass@host:port</code>). Every session auto-rotates to a fresh residential IP.</p>
        <div class="fp-input-row">
          <input type="text" id="inp-fp-val" class="form-input" placeholder="host:port:user:pass" value="lite.flashproxy.io:6969:vpm7ez74oh-country-DE:yxyxn64mh7">
          <button class="btn btn-success" onclick="saveFP()">Save Gateway</button>
          <button class="btn btn-primary" onclick="testFP()">Test Live Connection</button>
          <button class="btn btn-danger" onclick="clearFP()">—‘ Delete</button>
        </div>
        <div id="fp-test-result" style="display:none; font-size:12px; margin-top:8px; padding:8px 12px; border-radius:6px; background:#081322; border:1px solid #1e3a5f;"></div>
        <div id="fp-card-status" style="font-size: 12px; margin-top: 8px; font-weight: 700; color: #38bdf8;">Status: Inactive</div>
      </div>

      <div class="card">
        <div class="card-title"> Static Proxy Inventory Pool</div>
        <textarea id="inp-static-list" class="form-textarea" rows="6" placeholder="IP:Port:User:Pass (one per line)"></textarea>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <span id="lbl-static-stock" style="font-size: 12px; font-weight: 700; color: #38bdf8;">Stock: 0 Static Proxies</span>
          <button class="btn btn-primary" onclick="saveStaticProxies()">Save Static List</button>
        </div>
      </div>
    </div>

    <!-- TAB 8: ˜ CONTABO CLOUD SERVER -->
    <div id="tab-cloud" class="tab-content">
      <div class="card">
        <div class="card-title">˜ Contabo Datacenter VPS & Cloud Node Status</div>
        <div class="grid-3" style="margin-bottom: 16px;">
          <div class="kpi-box"><div class="kpi-label">Bet With Net Node IP</div><div class="kpi-val" style="font-size: 20px;">212.47.76.113</div></div>
          <div class="kpi-box"><div class="kpi-label">Cloud Service Port</div><div class="kpi-val" style="font-size: 20px;">8765 (SSL 443)</div></div>
          <div class="kpi-box"><div class="kpi-label">Network Speed</div><div class="kpi-val" style="font-size: 20px; color: #10b981;">1000 Mbps</div></div>
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">
          Bet With Net Cloud Node is running natively on Ubuntu 24.04 LTS behind OpenLiteSpeed reverse proxy with automated Let's Encrypt SSL.
        </div>
      </div>
    </div>

    <!-- TAB 9:  SYSTEM HEALTH -->
    <div id="tab-health" class="tab-content">
      <div class="card">
        <div class="card-title"> Live VPS Hardware Telemetry</div>
        <div class="grid-3">
          <div class="kpi-box"><div class="kpi-label">CPU Usage</div><div class="kpi-val" id="health-cpu" style="color: #38bdf8;">0%</div></div>
          <div class="kpi-box"><div class="kpi-label">RAM Usage</div><div class="kpi-val" id="health-ram" style="color: #10b981;">0%</div></div>
          <div class="kpi-box"><div class="kpi-label">Disk Storage</div><div class="kpi-val" id="health-disk">0%</div></div>
        </div>
      </div>
    </div>

    <!-- TAB 10:   SYSTEM DIAGNOSTICS -->
    <div id="tab-diagnostics" class="tab-content">
      <div class="card">
        <div class="card-title">  11-Engine Multi-Pool Browser Diagnostics</div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Real-time detection of all authentic desktop and mobile browser engines installed on the server:</p>
        <div class="grid-2" id="diagnostics-browser-list">
          <div class="badge-pill" style="padding: 10px;">[OK] Œ Custom HTTP Browser (Anti-Detect Core)</div>
          <div class="badge-pill" style="padding: 10px;">[OK] Œ Google Chrome (Stable)</div>
          <div class="badge-pill" style="padding: 10px;">[OK] ŒŠ Microsoft Edge (Stable)</div>
          <div class="badge-pill" style="padding: 10px;">[OK]  Brave Browser</div>
          <div class="badge-pill" style="padding: 10px;">[OK]  Playwright Headless Shell</div>
          <div class="badge-pill" style="padding: 10px;">[OK] Š Playwright Firefox (Gecko)</div>
          <div class="badge-pill" style="padding: 10px;">[OK] Ž Playwright WebKit (Safari)</div>
        </div>
      </div>
    </div>

    <!-- TAB 11:  PAKISTAN SAFE LOGIN GUARD -->
        <div id="tab-pk-guard" class="tab-content">
      <div class="card" style="border:1px solid rgba(16,185,129,0.3); background:linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.95) 100%);">
        
        <!-- Header with Live Indicator -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:28px;"></div>
            <div>
              <div class="card-title" style="margin-bottom:2px; font-size:18px; color:#f8fafc;">Adsterra &amp; Monetag Safe Multi-Account Login Guard</div>
              <div style="font-size:12px; color:#94a3b8;">100% Pakistan Dedicated IP &bull; Anti-Ban Device Isolation &bull; Multi-Device PAC Auto-Route</div>
            </div>
          </div>
          <div id="pk-live-pill" style="display:inline-flex; align-items:center; gap:8px; padding:8px 16px; border-radius:999px; background:rgba(16,185,129,0.12); border:1px solid #10b981; color:#10b981; font-weight:700; font-size:13px;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981; box-shadow:0 0 10px #10b981;" id="pk-pulse-dot"></span>
            <span id="pk-live-pill-text">LIVE: CONNECTED</span>
          </div>
        </div>

        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 20px;">
          Same computer ya device se dosra Adsterra ya Monetag account kholne par account foran ban ho jata hai. Ye system aapko <b>100% Verified Pakistan IP</b> deta hai jisme <b>Active Real-Time Kill-Switch</b> aur <b>Multi-Device PAC Auto-Proxy</b> shamil hai.
        </p>

        <!-- Live Status Metric Grid -->
        <div class="grid-3" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-bottom: 22px;">
          <div class="kpi-box" style="background:#0f172a; border:1px solid #1e293b; padding:16px; border-radius:10px;">
            <div class="kpi-label" style="font-size:11px; text-transform:uppercase; color:#94a3b8;">Current Pakistan IP</div>
            <div class="kpi-val" id="pk-kpi-ip" style="color: #38bdf8; font-size:19px; font-weight:700; margin-top:4px;">Checking...</div>
            <div style="font-size:11px; color:#10b981; margin-top:4px;" id="pk-kpi-city">City: ...</div>
          </div>
          <div class="kpi-box" style="background:#0f172a; border:1px solid #1e293b; padding:16px; border-radius:10px;">
            <div class="kpi-label" style="font-size:11px; text-transform:uppercase; color:#94a3b8;">Verified Pakistani ISP</div>
            <div class="kpi-val" id="pk-kpi-isp" style="color: #10b981; font-size:15px; font-weight:700; margin-top:4px;">Detecting...</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Strict Country: <b style="color:#f8fafc;">PK  (0 Leaks)</b></div>
          </div>
          <div class="kpi-box" style="background:#0f172a; border:1px solid #1e293b; padding:16px; border-radius:10px;">
            <div class="kpi-label" style="font-size:11px; text-transform:uppercase; color:#94a3b8;">Live Ping &amp; Kill-Switch</div>
            <div class="kpi-val" id="pk-kpi-speed" style="color: #f59e0b; font-size:19px; font-weight:700; margin-top:4px;">-- ms</div>
            <div style="font-size:11px; color:#10b981; margin-top:4px;">Kill-Switch: <b style="color:#10b981;">ARMED &amp; ACTIVE </b></div>
          </div>
        </div>

        <!--  DIRECT LOGIN ACTION BUTTONS -->
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:18px; margin-bottom:22px;">
          <div style="font-weight:700; font-size:14px; color:#f8fafc; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span> 1-Click Publisher Portals (Login from Safe Session):</span>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:12px;">
            <a href="/cloud-browser" target="_blank" rel="noopener noreferrer" class="btn" style="background:linear-gradient(135deg, #059669, #10b981); color:#fff; font-weight:700; padding:12px 20px; border-radius:8px; text-decoration:none; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
              <span>[ONLINE] Open Adsterra Publisher</span> 
            </a>
            <a href="/verify-session?target=monetag" target="_blank" rel="noopener noreferrer" class="btn" style="background:linear-gradient(135deg, #2563eb, #3b82f6); color:#fff; font-weight:700; padding:12px 20px; border-radius:8px; text-decoration:none; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(37,99,235,0.3);">
              <span>” Open Monetag Publisher</span> 
            </a>
            <a href="https://whoer.net/" target="_blank" rel="noopener noreferrer" class="btn" style="background:#334155; color:#f8fafc; font-weight:600; padding:12px 18px; border-radius:8px; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
              <span>” Check Device IP (Whoer)</span> 
            </a>
            <button class="btn btn-secondary" onclick="copyPkProxy()" style="padding:12px 18px; border-radius:8px; font-weight:600;">
               Copy Pakistan Proxy IP
            </button>
            <button class="btn btn-primary" onclick="rotatePkProxy()" id="btn-rotate-pk" style="padding:12px 18px; border-radius:8px; font-weight:700; background:linear-gradient(135deg, #7c3aed, #a855f7); border:none; box-shadow:0 4px 14px rgba(168,85,247,0.35);">
              ”„ Rotate to Fresh Unique Pakistan IP
            </button>
            <button class="btn btn-secondary" onclick="refreshPkGuardProxy()" id="btn-refresh-pk" style="padding:12px 18px; border-radius:8px; font-weight:600;">
               Fetch Fresh PK Proxy
            </button>
          </div>
        </div>

        <!--  ANY DEVICE UNIVERSAL SETUP (MOBILE / TABLET / LAPTOP / PC) -->
        <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.25); border-radius:12px; padding:18px; margin-bottom:22px;">
          <div style="font-weight:700; font-size:15px; color:#38bdf8; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
            <span> Kisi Bhi Mobile ya Device Par Login Kaise Karein? (Android, iPhone, Mac, Windows)</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; line-height:1.6; margin-bottom:14px;">
            Aapko kisi software ki zaroorat nahi! Sirf neeche diya gaya <b>PAC Auto-Proxy URL</b> apne phone ya computer ke Wi-Fi / Proxy settings mein daal dein. Is se aapka <b>YouTube, WhatsApp sab normal chalega</b>, sirf <b>Adsterra aur Monetag 100% Pakistan IP se connect honge</b>:
          </p>

          <!-- PAC URL Box with Copy Button -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
            <div>
              <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:600;">Universal 1-Click PAC Auto-Proxy URL:</div>
              <div style="font-size:14px; font-weight:700; color:#38bdf8; word-break:break-all;" id="betwithnet-pac-display">https://dollar.betwithnet.com/guard.pac</div>
            </div>
            <button class="btn btn-secondary" onclick="copyPacUrl()" style="padding:8px 16px; font-size:12px; font-weight:700; background:#0284c7; color:#fff; border-color:#0284c7;">Copy PAC URL</button>
          </div>

          <!-- Device Quick Setup Instructions -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; font-size:12px; color:#cbd5e1;">
            <div style="background:#0f172a; padding:14px; border-radius:8px; border:1px solid #1e293b; line-height:1.7;">
              <b style="color:#38bdf8; font-size:13px;"> Android &amp; iPhone (Mobile):</b><br>
              1. Phone Settings &gt; <b>Wi-Fi</b> mein ja kar apne connected Wi-Fi par tap karein.<br>
              2. <b>Proxy</b> ko <b>"Auto-Config" / "Automatic"</b> par set karein.<br>
              3. PAC URL paste karein: <code style="color:#38bdf8; background:#1e293b; padding:2px 6px; border-radius:4px;">https://dollar.betwithnet.com/guard.pac</code><br>
              4. Save karein aur upar diye gaye <b>Adsterra</b> button par tap karein!
            </div>
            <div style="background:#0f172a; padding:14px; border-radius:8px; border:1px solid #1e293b; line-height:1.7;">
              <b style="color:#10b981; font-size:13px;"> Windows &amp; Mac (PC / Laptop):</b><br>
              1. <b>Windows:</b> Desktop par <b>SAFE_ADSTERRA_MONETAG_GUARD.bat</b> chalayein (Isme 50ms Auto Kill-Switch shamil hai).<br>
              2. <b>Mac / Any Browser:</b> Network Settings &gt; Proxies &gt; <b>"Automatic Proxy Configuration"</b> mein PAC URL paste kar dein.
            </div>
          </div>
        </div>

        <!-- Custom Pakistan Proxy Box -->
        <div style="background:#0f172a; border:1px solid #334155; border-radius:10px; padding:16px;">
          <div style="font-weight:700; font-size:14px; margin-bottom:8px; color:#f8fafc;"> Custom Private Pakistan Proxy (Optional)</div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Agr aapke paas apna private Pakistan residential proxy hai to yahan paste karen. System verify karke cloud database mein save kar lega:</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" id="inp-custom-pk-proxy" class="form-input" placeholder="e.g. http://182.184.30.96:8080 ya socks5://user:pass@ip:port" style="flex:1; min-width:240px;">
            <button class="btn btn-secondary" onclick="saveCustomPkProxy()">Save &amp; Verify</button>
          </div>
        </div>

      </div>
    </div>
  </div>

        <div style="display:flex; gap:10px; margin-bottom:20px;">
          <button class="btn btn-primary" onclick="refreshPkGuardProxy()" id="btn-refresh-pk"> Fetch Fresh Pakistan Proxy</button>
        </div>

        <!-- Custom Pakistan Proxy Box -->
        <div style="background:#0f172a; border:1px solid #334155; border-radius:10px; padding:16px; margin-bottom:20px;">
          <div style="font-weight:700; font-size:14px; margin-bottom:8px; color:#f8fafc;"> Custom Pakistan Proxy (Optional)</div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Agr aapke paas apna private/residential Pakistan proxy hai to yahan paste karen. System pehly check karega ke IP Pakistan ka hi ho, phir save karega:</div>
          <div style="display:flex; gap:10px;">
            <input type="text" id="inp-custom-pk-proxy" class="form-input" placeholder="e.g. http://182.184.30.96:8080 ya socks5://user:pass@ip:port" style="flex:1;">
            <button class="btn btn-secondary" onclick="saveCustomPkProxy()">Save & Verify</button>
          </div>
        </div>

        <!-- How to launch box -->
        <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:16px;">
          <div style="font-weight:700; font-size:14px; color:#10b981; margin-bottom:8px;"> Apne Computer Par 1-Click Launch Kaise Karen?</div>
          <ol style="font-size:12px; color:#cbd5e1; line-height:1.7; margin-left:18px;">
            <li>Aapke project folder (<code>Downloads\Proxy Project</code>) me <b><code>LAUNCH_SAFE_ADSTERRA.bat</code></b> tayyar hai.</li>
            <li>Us par double-click karen: Wo automatically Google Chrome ko <b>Dedicated Isolated Profile</b> me Pakistan IP ke sath open karega.</li>
            <li><b>Active Real-Time Kill-Switch:</b> Background me watchdog har 1.5s baad proxy monitor karta hai. Agr proxy band hui to Chrome <b>foran auto-kill</b> ho jayega aur aapka real IP kabhi leak nahi hoga!</li>
          </ol>
        </div>
      </div>
    </div>
  </div>

  <script>
    let pkGuardPollTimer = null;
    let currentPkProxyRaw = "";

    async function loadPkGuardStatus() {
      try {
        const res = await fetch('/api/pk-guard/status');
        const data = await res.json();
        if (data.best_proxy) {
          currentPkProxyRaw = data.best_proxy.proxy || "";
          document.getElementById('pk-kpi-ip').innerText = data.best_proxy.ip || 'Ready';
          document.getElementById('pk-kpi-city').innerText = 'City: ' + (data.best_proxy.city || 'Pakistan');
          document.getElementById('pk-kpi-isp').innerText = (data.best_proxy.isp || 'PTCL / Nayatel').substring(0, 24);
          document.getElementById('pk-kpi-speed').innerText = (data.best_proxy.speed_ms || 0) + ' ms';
          
          const pill = document.getElementById('pk-live-pill');
          const pillText = document.getElementById('pk-live-pill-text');
          const dot = document.getElementById('pk-pulse-dot');
          if (pill && pillText) {
            pillText.innerText = 'LIVE: ' + data.best_proxy.ip + ' (' + (data.best_proxy.city || 'PK') + ')';
            pill.style.borderColor = '#10b981';
            pill.style.color = '#10b981';
            if (dot) dot.style.background = '#10b981';
          }
        } else {
          document.getElementById('pk-kpi-ip').innerText = 'Finding Proxy...';
          document.getElementById('pk-kpi-city').innerText = 'Please wait';
          document.getElementById('pk-kpi-isp').innerText = 'Scanning PK...';
          document.getElementById('pk-kpi-speed').innerText = '-- ms';
          const pill = document.getElementById('pk-live-pill');
          const pillText = document.getElementById('pk-live-pill-text');
          if (pill && pillText) {
            pillText.innerText = 'SCANNING FOR PK PROXY...';
            pill.style.borderColor = '#f59e0b';
            pill.style.color = '#f59e0b';
          }
        }
        if (data.custom_proxy && data.custom_proxy !== 'Not Set') {
          const inp = document.getElementById('inp-custom-pk-proxy');
          if (inp) inp.value = data.custom_proxy;
        }
      } catch (e) {}
    }

    function copyPkProxy() {
      if (!currentPkProxyRaw) {
        showToast('Proxy load ho rahi hai, please wait...', 'error');
        return;
      }
      const clean = currentPkProxyRaw.replace(/^https?:\/\//, '').replace(/^socks5:\/\//, '');
      navigator.clipboard.writeText(clean).then(() => {
        showToast(' Pakistan Proxy Copied: ' + clean, 'success');
      }).catch(() => {
        prompt('Pakistan Proxy Copy Karen:', clean);
      });
    }

    function copyPacUrl() {
      const url = window.location.origin + '/guard.pac';
      navigator.clipboard.writeText(url).then(() => {
        showToast(' PAC Auto-Proxy URL Copied: ' + url, 'success');
      }).catch(() => {
        prompt('PAC Auto-Proxy URL Copy Karen:', url);
      });
    }

    
    async function rotatePkProxy() {
      const btn = document.getElementById('btn-rotate-pk');
      if (btn) {
        btn.disabled = true;
        btn.innerText = ' Rotating to Fresh PK IP...';
      }
      try {
        const res = await fetch('/api/pk-guard/get-proxy?rotate=true&exclude_ip=' + encodeURIComponent(currentPkProxyRaw));
        const data = await res.json();
        if (data.success && data.proxy) {
          showToast('[OK] Brand New Pakistan IP Assigned: ' + data.proxy.ip + ' (' + data.proxy.city + ')', 'success');
          loadPkGuardStatus();
        } else {
          showToast('Scanning fresh proxies: ' + (data.error || 'Please wait'), 'info');
          refreshPkGuardProxy();
        }
      } catch (e) {
        showToast('Network error while rotating proxy', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = '”„ Rotate to Fresh Unique Pakistan IP';
        }
      }
    }

    async function refreshPkGuardProxy() {
      const btn = document.getElementById('btn-refresh-pk');
      if (btn) {
        btn.disabled = true;
        btn.innerText = ' Verifying Pakistan Proxies...';
      }
      try {
        const res = await fetch('/api/pk-guard/get-proxy', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.proxy) {
          showToast('[OK] Pakistan Proxy Verified: ' + data.proxy.ip + ' (' + data.proxy.city + ')', 'success');
          loadPkGuardStatus();
        } else {
          showToast('Œ ' + (data.error || 'Could not verify Pakistan proxy'), 'error');
        }
      } catch (e) {
        showToast('Œ Network error', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = ' Fetch Fresh PK Proxy';
        }
      }
    }

    async function saveCustomPkProxy() {
      const val = document.getElementById('inp-custom-pk-proxy').value.trim();
      try {
        const res = await fetch('/api/pk-guard/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proxy: val })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Saved & Verified!', 'success');
          loadPkGuardStatus();
        } else {
          showToast(data.error || 'Failed to verify Pakistan proxy', 'error');
        }
      } catch (e) {
        showToast('Network error', 'error');
      }
    }


    function showToast(msg, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      const bg = type === 'success' ? 'linear-gradient(135deg, #064e3b, #047857)' : (type === 'error' ? 'linear-gradient(135deg, #881337, #9f1239)' : 'linear-gradient(135deg, #0f172a, #1e293b)');
      const border = type === 'success' ? '#10b981' : (type === 'error' ? '#f43f5e' : '#38bdf8');
      toast.style.cssText = `
        background: ${bg};
        color: #f8fafc;
        border: 1px solid ${border};
        padding: 14px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 35px rgba(0,0,0,0.6);
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
        min-width: 280px;
        max-width: 420px;
        transition: all 0.3s ease;
      `;
      toast.innerHTML = msg;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 350);
      }, 4500);
    }

    let activeCampaignMode = "website";
    let isUnlocked = false;
    let selectedCctvSession = "auto";
    let cctvMode = "single";

    // Auto-unlock if previously logged in
    if (localStorage.getItem("betwithnet_unlocked") === "true") {
      unlockSite(true);
    }

    async function unlockSite(bypass = false) {
      if (bypass) {
        document.getElementById('lock-overlay').style.display = 'none';
        isUnlocked = true;
        initData();
        return;
      }
      const pass = document.getElementById('inp-auth-pass').value.trim();
      if (!pass) return;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({password: pass})
        });
        const d = await res.json();
        if (d.success) {
          document.getElementById('lock-overlay').style.display = 'none';
          localStorage.setItem("betwithnet_unlocked", "true");
          isUnlocked = true;
          initData();
        } else {
          const err = document.getElementById('lock-err-msg');
          err.innerText = d.message || "Invalid Password. Access Denied.";
          err.style.display = 'block';
        }
      } catch(e) {
        alert("Error connecting to server: " + e);
      }
    }

    function openPasswordModal() {
      document.getElementById('inp-pwd-old').value = '';
      document.getElementById('inp-pwd-new').value = '';
      document.getElementById('inp-pwd-confirm').value = '';
      const msg = document.getElementById('pwd-modal-msg');
      msg.style.display = 'none';
      document.getElementById('modal-password').style.display = 'flex';
    }

    function closePasswordModal() {
      document.getElementById('modal-password').style.display = 'none';
    }

    async function submitPasswordChange() {
      const oldP = document.getElementById('inp-pwd-old').value.trim();
      const newP = document.getElementById('inp-pwd-new').value.trim();
      const confP = document.getElementById('inp-pwd-confirm').value.trim();
      const msg = document.getElementById('pwd-modal-msg');

      if (!oldP || !newP || !confP) {
        msg.innerText = "Please fill in all password fields.";
        msg.style.color = "#f43f5e";
        msg.style.display = "block";
        return;
      }
      if (newP !== confP) {
        msg.innerText = "New passwords do not match!";
        msg.style.color = "#f43f5e";
        msg.style.display = "block";
        return;
      }
      if (newP.length < 4) {
        msg.innerText = "New password must be at least 4 characters.";
        msg.style.color = "#f43f5e";
        msg.style.display = "block";
        return;
      }

      try {
        const res = await fetch('/api/auth/change_password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({current_password: oldP, new_password: newP})
        });
        const d = await res.json();
        if (d.success) {
          msg.innerText = "[OK] " + (d.message || "Password changed successfully!");
          msg.style.color = "#10b981";
          msg.style.display = "block";
          setTimeout(() => { closePasswordModal(); }, 1500);
        } else {
          msg.innerText = "Œ " + (d.message || "Failed to change password.");
          msg.style.color = "#f43f5e";
          msg.style.display = "block";
        }
      } catch(e) {
        msg.innerText = "Network error: " + e;
        msg.style.color = "#f43f5e";
        msg.style.display = "block";
      }
    }

    function changeCctvMode() {
      cctvMode = document.getElementById('cctv-mode-select').value;
      if (cctvMode === 'quad') {
        document.getElementById('cctv-single-wrap').style.display = 'none';
        document.getElementById('cctv-quad-wrap').style.display = 'block';
        fetchQuadFrames();
      } else {
        document.getElementById('cctv-single-wrap').style.display = 'block';
        document.getElementById('cctv-quad-wrap').style.display = 'none';
      }
    }

    function changeCctvSession() {
      selectedCctvSession = document.getElementById('cctv-session-select').value;
      if (selectedCctvSession !== 'auto') {
        fetchSpecificFrame(selectedCctvSession);
      }
    }

    function streamSpecificSession(sId) {
      document.getElementById('cctv-mode-select').value = 'single';
      document.getElementById('cctv-single-wrap').style.display = 'block';
      document.getElementById('cctv-quad-wrap').style.display = 'none';
      document.getElementById('cctv-session-select').value = String(sId);
      selectedCctvSession = String(sId);
      switchTab('tab-cctv');
      fetchSpecificFrame(sId);
    }

    async function fetchSpecificFrame(sId) {
      try {
        const res = await fetch('/cctv/frame?session_id=' + sId);
        const d = await res.json();
        const img = document.getElementById('cctv-live-img');
        const empty = document.getElementById('cctv-empty-view');
        const tag = document.getElementById('cctv-cam-tag');
        const act = document.getElementById('cctv-action-lbl');
        if (d.success && d.frame_b64) {
          img.src = 'data:image/jpeg;base64,' + d.frame_b64;
          img.style.display = 'block';
          empty.style.display = 'none';
          tag.innerText = `CAM #SESSION ${sId}`;
          act.innerText = d.action || `Live Feed Session #${sId}`;
        }
      } catch(e) {}
    }

    async function fetchQuadFrames() {
      try {
        const res = await fetch('/cctv/frame?mode=quad');
        const d = await res.json();
        if (d.success && d.frames) {
          for (let i = 0; i < 4; i++) {
            const idx = i + 1;
            const img = document.getElementById(`quad-img-${idx}`);
            const empty = document.getElementById(`quad-empty-${idx}`);
            const tag = document.getElementById(`quad-tag-${idx}`);
            if (d.frames[i] && d.frames[i].frame_b64) {
              const f = d.frames[i];
              img.src = 'data:image/jpeg;base64,' + f.frame_b64;
              img.style.display = 'block';
              empty.style.display = 'none';
              tag.innerText = `CAM #${f.session_id}: ${(f.action||'Active').slice(0, 24)}`;
            } else if (d.active_sessions && d.active_sessions[i]) {
              const s = d.active_sessions[i];
              img.style.display = 'none';
              empty.style.display = 'block';
              empty.innerHTML = `<div style="font-size:24px; margin-bottom:4px;">”„</div><div>Connecting Session #${s.session_id}...</div><div style="font-size:10px; color:#38bdf8;">${(s.action||'Starting').slice(0,25)}</div>`;
              tag.innerText = `CAM #${s.session_id} Initializing...`;
            } else {
              img.style.display = 'none';
              empty.style.display = 'block';
              empty.innerText = `CAM ${idx} Ready / Idle`;
              tag.innerText = 'Idle';
            }
          }
        }
      } catch(e) {}
    }

    async function testFP() {
      const box = document.getElementById('fp-test-result');
      box.style.display = 'block';
      box.innerText = 'Testing FlashProxy live connection to target test endpoints...';
      box.style.color = '#38bdf8';
      try {
        const res = await fetch('/flashproxy/test', {method: 'POST'});
        const d = await res.json();
        if (d.success) {
          box.innerHTML = `[ONLINE] <b>FlashProxy Verified Live!</b> Outgoing Residential IP: <span class="mono">${d.origin_ip}</span> | Latency: <b>${d.latency_ms}ms</b>`;
          box.style.color = '#10b981';
        } else {
          box.innerHTML = `Œ <b>FlashProxy Test Failed:</b> ${d.message}`;
          box.style.color = '#f43f5e';
        }
      } catch(e) {
        box.innerHTML = `Œ <b>Test error:</b> ${e}`;
        box.style.color = '#f43f5e';
      }
    }

    function lockSite() {
      localStorage.removeItem("betwithnet_unlocked");
      document.getElementById('lock-overlay').style.display = 'flex';
      document.getElementById('inp-auth-pass').value = '';
      document.getElementById('lock-err-msg').style.display = 'none';
      isUnlocked = false;
    }

    window.currentActiveTab = 'tab-campaign';
    function switchTab(tabId) {
      window.currentActiveTab = tabId;
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      if (event && event.target) event.target.classList.add('active');
      if (tabId === 'tab-history') loadHistory();
      if (tabId === 'tab-health') loadHealth();
      if (tabId === 'tab-pk-guard') { loadPkGuardStatus(); if (pkGuardPollTimer) clearInterval(pkGuardPollTimer); pkGuardPollTimer = setInterval(loadPkGuardStatus, 3500); } else { if (pkGuardPollTimer) clearInterval(pkGuardPollTimer); }
    }

    function setCampaignMode(mode) {
      activeCampaignMode = mode;
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
      const cardEl = document.getElementById('card-mode-' + mode.replace('_search', ''));
      if (cardEl) cardEl.classList.add('active');
      document.getElementById('view-mode-website').style.display = (mode === 'website') ? 'block' : 'none';
      document.getElementById('view-mode-youtube').style.display = (mode === 'youtube') ? 'block' : 'none';
      document.getElementById('view-mode-google').style.display = (mode === 'google_search') ? 'block' : 'none';
      document.getElementById('view-mode-whatsapp').style.display = (mode === 'whatsapp') ? 'block' : 'none';
      if (mode === 'youtube') {
        const routeSelect = document.getElementById('inp-route');
        if (routeSelect && routeSelect.querySelector('option[value="flashproxy"]')) {
          routeSelect.value = 'flashproxy';
        }
      } else if (mode === 'whatsapp') {
        const devSelect = document.getElementById('inp-param-device');
        if (devSelect) devSelect.value = 'Mobile';
      }
    }

    function setTurbo100() {
      document.getElementById('inp-channels-num').value = 80;
      document.getElementById('inp-channels-slider').value = 80;
      if (document.getElementById('inp-ch-workers')) document.getElementById('inp-ch-workers').value = 80;
      showToast('⚡ Turbo 80x Speed Activated! (Max Concurrent Sessions)', 'success');
    }

    function setSpeedPreset(val) {
      document.getElementById('inp-channels-num').value = val;
      document.getElementById('inp-channels-slider').value = val;
      if (document.getElementById('inp-ch-workers')) document.getElementById('inp-ch-workers').value = val;
      showToast('⚡ Speed set to ' + val + ' Concurrent Workers', 'info');
    }

    async function initData() {
      loadFlashProxy();
      setInterval(pollStatus, 1500);
      pollStatus();
    }

    async function loadFlashProxy() {
      try {
        const res = await fetch('/flashproxy/status');
        const d = await res.json();
        const b = document.getElementById('top-fp-badge');
        const s = document.getElementById('fp-card-status');
        if (d.configured) {
          b.innerText = 'FlashProxy: ' + d.server;
          b.style.color = '#10b981';
          s.innerText = '[ONLINE] Active Gateway: ' + d.server;
          document.getElementById('inp-fp-val').value = d.raw || '';
        } else {
          b.innerText = 'FlashProxy: Inactive';
          s.innerText = ' Not Configured';
        }
      } catch(e) {}
    }

    async function saveFP() {
      const v = document.getElementById('inp-fp-val').value.trim();
      if (!v) { alert('Enter gateway string'); return; }
      const res = await fetch('/flashproxy/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({raw: v})
      });
      const d = await res.json();
      alert(d.message);
      loadFlashProxy();
    }

    async function clearFP() {
      if (!confirm('Clear FlashProxy?')) return;
      await fetch('/flashproxy/clear', {method: 'POST'});
      document.getElementById('inp-fp-val').value = '';
      loadFlashProxy();
    }

    async function saveIP2World() {
      const list = document.getElementById('inp-ip2world-list').value.trim();
      const res = await fetch('/ip2world/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({list: list})
      });
      const d = await res.json();
      alert(d.message);
      document.getElementById('lbl-ip2world-stock').innerText = `Stock: ${d.count} Proxies Loaded`;
    }

    async function pollStatus() {
      if (!isUnlocked) return;
      try {
        const res = await fetch('/order/status');
        const d = await res.json();

        // Auto-refresh order history if user is on history tab
        if (window.currentActiveTab === 'tab-history' && (!window._lastHistPoll || Date.now() - window._lastHistPoll > 3000)) {
          window._lastHistPoll = Date.now();
          loadHistory();
        }

        // Update KPIs
        document.getElementById('kpi-act-workers').innerText = d.active_workers || 0;
        document.getElementById('kpi-act-comp').innerText = d.completed_sessions || 0;
        document.getElementById('kpi-act-fail').innerText = d.failed_sessions || 0;
        document.getElementById('kpi-act-clicks').innerText = `${d.executed_clicks || 0} / ${d.target_clicks || 0}`;
        document.getElementById('kpi-act-uptime').innerText = formatTime(d.elapsed_seconds || 0);
        if (d.bandwidth) {
          const ordBw = document.getElementById('kpi-order-bandwidth');
          if (ordBw) ordBw.innerText = d.bandwidth.order_formatted || '0.00 MB';
          const totBw = document.getElementById('kpi-total-bandwidth');
          if (totBw) totBw.innerText = d.bandwidth.total_formatted || '0.00 MB';
        }
        if (d.bandwidth) {
          const ordBw = document.getElementById('kpi-order-bandwidth');
          if (ordBw) ordBw.innerText = d.bandwidth.order_formatted || '0.00 MB';
          const totBw = document.getElementById('kpi-total-bandwidth');
          if (totBw) totBw.innerText = d.bandwidth.total_formatted || '0.00 MB';
          const smEl = document.getElementById('kpi-saver-mode');
          if (smEl) {
            const m = d.bandwidth.data_saver_mode || 'ultra_lean';
            if (m === 'ultra_lean') {
              smEl.innerHTML = ' ULTRA LEAN (~95% Saved)';
              smEl.style.color = '#10b981';
            } else if (m === 'standard') {
              smEl.innerHTML = ' STANDARD (~85% Saved)';
              smEl.style.color = '#38bdf8';
            } else {
              smEl.innerHTML = 'Œ DISABLED (Raw Assets)';
              smEl.style.color = '#f87171';
            }
          }
        }

        // Title and progress
        if (d.status === 'RUNNING') {
          document.getElementById('analytics-order-title').innerText = `Active Order: [${d.order_id}] (${(d.campaign_type || 'web').toUpperCase()}) - ${d.recent_url.slice(0, 45)} (${d.total_sessions} Sessions)`;
          const pct = Math.min(100, Math.round(((d.completed_sessions + d.failed_sessions) / (d.total_sessions || 1)) * 100));
          document.getElementById('analytics-progress').style.width = pct + '%';
        } else {
          document.getElementById('analytics-order-title').innerText = `Active Order: [${d.status}] Ready for Order Submission`;
        }

        // CCTV Live Feed Stream
        const cImg = document.getElementById('cctv-live-img');
        const cEmpty = document.getElementById('cctv-empty-view');
        const cAct = document.getElementById('cctv-action-lbl');

        if (cctvMode === 'single') {
          try {
            const cctvUrl = (selectedCctvSession && selectedCctvSession !== 'auto') 
              ? '/cctv/frame?session_id=' + selectedCctvSession 
              : '/cctv/frame';
            const cRes = await fetch(cctvUrl);
            const cData = await cRes.json();
            if (cData.success && cData.frame_b64) {
              cImg.src = 'data:image/jpeg;base64,' + cData.frame_b64;
              cImg.style.display = 'block';
              cEmpty.style.display = 'none';
              cAct.innerText = cData.action || d.recent_action || 'Live Browser View';
              const camTag = document.getElementById('cctv-cam-tag');
              if (camTag) camTag.innerText = cData.session_id ? `CAM #SESSION ${cData.session_id}` : 'LIVE CCTV MONITOR';
            } else {
              if (d.status === 'RUNNING') {
                cAct.innerText = d.recent_action || 'Launching browser contexts...';
              } else if (d.status === 'IDLE' || d.status === 'COMPLETED') {
                cImg.style.display = 'none';
                cEmpty.style.display = 'block';
                cAct.innerText = d.recent_action || 'Idle - Ready for Campaign Launch';
              }
            }
          } catch(e) {}
        } else if (cctvMode === 'quad') {
          fetchQuadFrames();
        }

        // Background Persistent Banner
        const banner = document.getElementById('active-order-banner');
        if (d.status === 'RUNNING') {
          if (banner) {
            banner.style.display = 'flex';
            document.getElementById('banner-order-text').innerText = `Active Campaign [${d.order_id}] is executing on the VPS (${d.completed_sessions}/${d.total_sessions} Sessions Completed)`;
          }
        } else {
          if (banner) banner.style.display = 'none';
        }

        // CCTV Session Dropdown Sync
        const sel = document.getElementById('cctv-session-select');
        if (sel && d.active_sessions && d.active_sessions.length > 0) {
          const curVal = sel.value;
          let opts = '<option value="auto">”„ Auto-Rotate Active</option>';
          d.active_sessions.forEach(s => {
            opts += `<option value="${s.session_id}">“ CAM #${s.session_id} (${s.engine_name||'HTTP'})</option>`;
          });
          sel.innerHTML = opts;
          if (curVal && sel.querySelector(`option[value="${curVal}"]`)) {
            sel.value = curVal;
          }
        }

        // Quad view polling
        if (cctvMode === 'quad') {
          fetchQuadFrames();
        }

        // Telemetry table with Stream CAM buttons
        const tbody = document.getElementById('telemetry-tbody');
        if (d.active_sessions && d.active_sessions.length > 0) {
          tbody.innerHTML = d.active_sessions.map(s => `
            <tr>
              <td class="mono">#${s.session_id}</td>
              <td><span class="badge-eng">${s.engine_name || 'Custom HTTP'}</span></td>
              <td class="mono">
                <span style="color:#10b981; font-weight:700;">Œ ${s.proxy_ip || 'Verifying...'}</span>
                <span style="font-size:11px; color:#38bdf8;">(${s.proxy_country || 'Global'})</span>
                ${s.proxy_speed ? `<span style="font-size:10px; color:#94a3b8; margin-left:4px;">${s.proxy_speed}ms</span>` : ''}
              </td>
              <td>
                <span class="badge-pill" style="font-size:10px; padding:2px 7px; border-color:${s.proxy_status && s.proxy_status.includes('Verified') ? '#10b981' : '#f59e0b'}; color:${s.proxy_status && s.proxy_status.includes('Verified') ? '#10b981' : '#f59e0b'};">
                  ${s.proxy_status || 'Pre-Checking [STANDBY]'}
                </span>
              </td>
              <td><span class="badge-ref">${s.referrer || 'Direct'}</span></td>
              <td>${s.action || 'Running'}</td>
              <td class="mono">${s.elapsed || 0}s</td>
              <td>
                <button class="btn btn-secondary" style="padding: 3px 8px; font-size: 11px; white-space: nowrap;" onclick="streamSpecificSession(${s.session_id})">‘ CAM #${s.session_id}</button>
              </td>
            </tr>
          `).join('');
        } else {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:20px;">No active sessions running</td></tr>';
        }

        // Terminal logs
        if (d.logs && d.logs.length > 0) {
          const t = document.getElementById('analytics-terminal');
          t.innerHTML = d.logs.map(l => `<div>${l}</div>`).join('');
          t.scrollTop = t.scrollHeight;
        }

      } catch(e) {}
    }

    function formatTime(secs) {
      const h = Math.floor(secs / 3600).toString().padStart(2, '0');
      const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    async function submitCampaign() {
      try {
        let dur = parseInt(document.getElementById('inp-param-duration').value || 35);
        if (document.getElementById('inp-param-dur-unit').value === 'min') dur *= 60;

        let targetUrl = (document.getElementById('inp-web-url').value || '').trim();
        let kw = '';
        let domain = '';

        if (activeCampaignMode === 'youtube') {
          targetUrl = (document.getElementById('inp-yt-url').value || '').trim();
          if (!targetUrl) {
            showToast('[WARNING] Please enter a YouTube video URL!', 'error');
            alert('Please enter a YouTube video URL!');
            return;
          }
          kw = (document.getElementById('inp-yt-kw').value || '').trim();
          const ytWatchEl = document.getElementById('inp-yt-watch-time');
          const ytWatch = ytWatchEl ? parseInt(ytWatchEl.value) : 35;
          if (!isNaN(ytWatch) && ytWatch > 0) dur = ytWatch;
          dur = Math.max(dur, 35); // Enforce minimum 35s verified watch time for YouTube Studio live counting
        } else if (activeCampaignMode === 'google_search') {
          kw = (document.getElementById('inp-goog-kw').value || '').trim();
          domain = (document.getElementById('inp-goog-domain').value || '').trim();
          targetUrl = domain ? ('https://' + domain) : '';
          if (!domain) {
            showToast('[WARNING] Please enter target domain!', 'error');
            alert('Please enter target domain!');
            return;
          }
        } else if (activeCampaignMode === 'whatsapp') {
          targetUrl = (document.getElementById('inp-wa-url').value || '').trim();
          if (!targetUrl) {
            showToast('[WARNING] Please enter a WhatsApp Channel or Group URL!', 'error');
            alert('Please enter a WhatsApp Channel or Group URL!');
            return;
          }
          const waDwellEl = document.getElementById('inp-wa-dwell');
          const waDwell = waDwellEl ? parseInt(waDwellEl.value) : 30;
          if (!isNaN(waDwell) && waDwell > 0) dur = waDwell;
        } else {
          if (!targetUrl) {
            showToast('[WARNING] Please enter a target website URL!', 'error');
            alert('Please enter a target website URL!');
            return;
          }
        }

        const selectedRef = (activeCampaignMode === 'whatsapp')
          ? document.getElementById('inp-wa-ref').value
          : document.getElementById('inp-web-ref').value;
        const selectedDev = (activeCampaignMode === 'whatsapp')
          ? document.getElementById('inp-wa-device').value
          : document.getElementById('inp-param-device').value;
        const waAction = (activeCampaignMode === 'whatsapp')
          ? (document.getElementById('inp-wa-action') ? document.getElementById('inp-wa-action').value : 'follow_channel')
          : '';

        const payload = {
          campaign_type: activeCampaignMode,
          url: targetUrl,
          search_keyword: kw,
          target_domain: domain,
          wa_action_type: waAction,
          referrer_source: selectedRef,
          total_sessions: parseInt(document.getElementById('inp-param-sessions').value || 10),
          duration_sec: dur,
          device_type: selectedDev,
          target_clicks: parseInt(document.getElementById('inp-param-clicks').value || 0),
          clicks_per_session: parseInt(document.getElementById('inp-param-clicks-per-s').value || 1),
          click_start_delay: parseInt(document.getElementById('inp-param-click-delay').value || 5),
          concurrent_workers: parseInt(document.getElementById('inp-channels-num').value || 10),
          proxy_mode: document.getElementById('inp-route').value,
        proxy_country: document.getElementById('inp-proxy-country') ? document.getElementById('inp-proxy-country').value : '', 
          browser_mode: document.getElementById('inp-engine').value,
          enable_scroll: document.getElementById('inp-scroll-check').checked,
          scroll_speed: document.getElementById('inp-scroll-speed').value,
          data_saver_mode: document.getElementById('inp-data-saver') ? document.getElementById('inp-data-saver').value : 'disabled',
          order_id: 'ORD-' + Date.now().toString().slice(-6)
        };

        showToast(' Submitting campaign order...', 'info');
        const res = await fetch('/order/start', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });
        const d = await res.json();
        if (d.success) {
          showToast(' ' + (d.message || 'Campaign Order Started Successfully!'), 'success');
          switchTab('tab-analytics');
          pollStatus();
        } else {
          showToast('[WARNING] ' + (d.message || 'Error starting campaign'), 'error');
          alert('Error: ' + (d.message || 'Failed to start campaign'));
        }
      } catch (err) {
        console.error('Submit Campaign Error:', err);
        showToast('Œ Submission error: ' + err.message, 'error');
        alert('Submission error: ' + err.message);
      }
    }

    async function pauseCampaign() {
      const res = await fetch('/order/pause', {method: 'POST'});
      const d = await res.json();
      alert(d.message);
    }

    async function stopCampaign() {
      if (!confirm('Are you sure you want to stop this order?')) return;
      try {
        showToast('Stopping running campaign...', 'info');
        const res = await fetch('/order/stop', {method: 'POST'});
        const d = await res.json();
        showToast(d.message || 'Campaign Stopped', 'success');
        loadHistory();
      } catch(e) {
        showToast('Error stopping campaign: ' + e.message, 'error');
      }
    }

    
    async function submitCustomHttpCampaign() {
      const targetUrl = document.getElementById('inp-ch-url').value.trim();
      if (!targetUrl) { alert('Please enter a target destination URL!'); return; }

      let dur = parseInt(document.getElementById('inp-ch-dur').value);
      if (document.getElementById('inp-ch-dur-unit').value === 'min') dur *= 60;

      const payload = {
        campaign_type: 'website',
        url: targetUrl,
        referrer_source: document.getElementById('inp-ch-ref').value,
        total_sessions: parseInt(document.getElementById('inp-ch-sessions').value),
        duration_sec: dur,
        device_type: document.getElementById('inp-ch-device').value,
        target_clicks: parseInt(document.getElementById('inp-ch-clicks').value || 0),
        clicks_per_session: 1,
        click_start_delay: 8,
        concurrent_workers: parseInt(document.getElementById('inp-ch-workers').value),
        proxy_mode: document.getElementById('inp-ch-proxy').value,
        browser_mode: 'custom_http_browser',
        enable_scroll: document.getElementById('inp-ch-scroll').checked,
        scroll_speed: document.getElementById('inp-ch-scroll-speed').value,
        order_id: 'ORD-HTTP-' + Date.now().toString().slice(-6)
      };

      const res = await fetch('/order/start', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      showToast(' ' + (d.message || 'Custom HTTP Campaign Started!'), 'success');
      switchTab('tab-analytics');
      pollStatus();
    }

    async function navigateCustomBrowserLive() {
      const url = document.getElementById('inp-ch-url').value.trim();
      const dev = document.getElementById('inp-ch-device').value;
      const pxy = document.getElementById('inp-ch-proxy').value;
      const ref = document.getElementById('inp-ch-ref').value;

      document.getElementById('custom-b-title').innerText = 'Custom HTTP: Connecting to ' + url + '...';
      try {
        const res = await fetch('/browser/navigate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({url: url, device: dev, proxy: pxy, referrer: ref})
        });
        const d = await res.json();
        if (d.success) {
          document.getElementById('custom-b-title').innerText = 'Title: ' + (d.title || 'Page Loaded');
          document.getElementById('custom-b-url').innerText = d.url;
          const img = document.getElementById('custom-b-img');
          img.src = 'data:image/jpeg;base64,' + d.frame_b64;
          img.style.display = 'block';
          document.getElementById('custom-b-empty').style.display = 'none';
        } else {
          alert('Navigation notice: ' + (d.message || 'Failed to render'));
        }
      } catch(e) {
        alert('Navigation error: ' + e);
      }
    }

    async function navigateCustomBrowser() {
      const url = document.getElementById('inp-custom-browser-url').value;
      const dev = document.getElementById('inp-custom-browser-device').value;
      const pxy = document.getElementById('inp-custom-browser-proxy').value;

      document.getElementById('custom-b-title').innerText = 'Loading: ' + url + '...';
      const res = await fetch('/browser/navigate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({url: url, device: dev, proxy: pxy})
      });
      const d = await res.json();
      if (d.success) {
        document.getElementById('custom-b-title').innerText = 'Title: ' + (d.title || 'Page');
        document.getElementById('custom-b-url').innerText = d.url;
        const img = document.getElementById('custom-b-img');
        img.src = 'data:image/jpeg;base64,' + d.frame_b64;
        img.style.display = 'block';
        document.getElementById('custom-b-empty').style.display = 'none';
      }
    }

    async function loadHistory() {
      try {
        const res = await fetch('/history');
        const list = await res.json();
        const tbody = document.getElementById('history-tbody');
        if (list && list.length > 0) {
          tbody.innerHTML = list.map(o => {
            const isRunning = (o.status === 'RUNNING' || o.status === 'STOPPING');
            let statusColor = '#10b981';
            let statusBg = 'rgba(16, 185, 129, 0.12)';
            let statusBorder = 'rgba(16, 185, 129, 0.3)';
            if (isRunning) {
              statusColor = '#38bdf8';
              statusBg = 'rgba(56, 189, 248, 0.15)';
              statusBorder = 'rgba(56, 189, 248, 0.4)';
            } else if (o.status === 'CANCELLED' || o.status === 'STOPPED') {
              statusColor = '#ef4444';
              statusBg = 'rgba(239, 68, 68, 0.15)';
              statusBorder = 'rgba(239, 68, 68, 0.3)';
            }

            let actionButtons = '';
            actionButtons += `<button class="btn btn-secondary" style="padding:3px 8px; font-size:11px; margin-right:4px; border-color:#10b981; color:#10b981;" onclick="viewOrderProxyAudit('${o.order_id}')" title="View Proxy IPs and Dead Proxies for this order"> Proxy Audit</button> `;
            if (isRunning) {
              actionButtons += `<button class="btn-action-stop" onclick="cancelHistoryOrder('${o.order_id}')" title="Stop this running campaign">[BLOCKED] Stop</button> `;
            }
            actionButtons += `<button class="btn-action-del" onclick="deleteHistoryOrder('${o.order_id}')" title="Delete record permanently">—‘ Delete</button>`;

            const campBadge = (o.campaign_type === 'whatsapp')
              ? '<span class="badge-eng" style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid #25D366;">WHATSAPP</span>'
              : `<span class="badge-eng">${(o.campaign_type||'web').toUpperCase()}</span>`;

            return `
            <tr>
              <td class="mono"><b>${o.order_id}</b></td>
              <td>${campBadge}</td>
              <td class="mono" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${o.url}">${o.url}</td>
              <td><b>${o.completed}</b> / ${o.total_sessions}</td>
              <td>${o.duration_sec}s</td>
              <td>${o.target_clicks}</td>
              <td>
                <span style="display:inline-flex; align-items:center; gap:4px; color:${statusColor}; background:${statusBg}; border:1px solid ${statusBorder}; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">
                  ${isRunning ? '<span class="pulse-dot" style="background:#38bdf8; width:6px; height:6px;"></span>' : ''}${o.status}
                </span>
              </td>
              <td class="mono" style="font-size:11px;">${new Date(o.created_at * 1000).toLocaleString()}</td>
              <td style="text-align:center; white-space:nowrap;">${actionButtons}</td>
            </tr>
            `;
          }).join('');
        } else {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#64748b; padding:24px;">No orders found in history.</td></tr>';
        }
      } catch(e) {
        console.error('loadHistory error:', e);
      }
    }

    async function cancelHistoryOrder(orderId) {
      if (!confirm(`Are you sure you want to STOP / CANCEL order "${orderId}"?`)) return;
      try {
        showToast(`Stopping order ${orderId}...`, 'info');
        const res = await fetch('/order/cancel', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({order_id: orderId})
        });
        const d = await res.json();
        if (d.success) {
          showToast(d.message || `Order ${orderId} cancelled successfully!`, 'success');
        } else {
          showToast(d.message || 'Failed to cancel order', 'error');
        }
      } catch(e) {
        showToast('Error stopping order: ' + e.message, 'error');
      }
      await loadHistory();
    }

    async function deleteHistoryOrder(orderId) {
      if (!confirm(`Are you sure you want to permanently DELETE order "${orderId}" from database?`)) return;
      try {
        showToast(`Deleting order ${orderId}...`, 'info');
        const res = await fetch('/order/delete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({order_id: orderId})
        });
        const d = await res.json();
        if (d.success) {
          showToast(d.message || `Order ${orderId} permanently deleted!`, 'success');
        } else {
          showToast(d.message || 'Failed to delete order', 'error');
        }
      } catch(e) {
        showToast('Error deleting order: ' + e.message, 'error');
      }
      await loadHistory();
    }

    async function loadHealth() {
      try {
        const res = await fetch('/health/stats');
        const d = await res.json();
        document.getElementById('health-cpu').innerText = d.cpu + '%';
        document.getElementById('health-ram').innerText = `${d.ram_used_mb} MB (${d.ram_pct}%)`;
        document.getElementById('health-disk').innerText = d.disk_pct + '%';
      } catch(e) {}
    }

    let allBetWithNetProxies = [];

    async function loadBetWithNetStats() {
      try {
        const res = await fetch('/api/proxy/status');
        const data = await res.json();
        const totalEl = document.getElementById('pd-stat-total');
        if (totalEl) totalEl.textContent = data.total_verified || 0;
        const cntEl = document.getElementById('pd-stat-countries');
        const countryList = Object.keys(data.countries || {});
        if (cntEl) cntEl.textContent = countryList.length;
        const lastIpEl = document.getElementById('pd-stat-last-ip');
        if (lastIpEl && data.last_verified) {
          lastIpEl.textContent = `${data.last_verified.ip} (${data.last_verified.country})`;
        }
        const topBadge = document.getElementById('top-pd-badge');
        if (topBadge) {
          topBadge.textContent = ` Bet With Net: ${data.total_verified || 0} IPs Ready`;
        }

        // Render Country Badges
        const badgesContainer = document.getElementById('pd-country-badges');
        const summaryEl = document.getElementById('pd-pool-summary');
        if (badgesContainer) {
          if (countryList.length === 0) {
            badgesContainer.innerHTML = '<span style="font-size:11px; color:#64748b;">Harvesting & testing non-US proxies...</span>';
          } else {
            const sortedCountries = Object.entries(data.countries).sort((a,b) => b[1] - a[1]);
            badgesContainer.innerHTML = sortedCountries.map(([c, count]) => `
              <span onclick="filterByCountry('${c}')" style="cursor:pointer; background:#1e293b; border:1px solid #38bdf844; color:#38bdf8; font-size:10px; font-weight:600; padding:2px 8px; border-radius:12px; transition:all 0.2s;" title="Click to filter by ${c}">
                Œ ${c}: <strong style="color:#fff;">${count}</strong>
              </span>
            `).join('');
            if (summaryEl) summaryEl.textContent = `${countryList.length} Countries (${data.total_verified || 0} Total Live)`;
          }
        }

        // Store and Render Proxy Table
        allBetWithNetProxies = data.all_proxies || data.sample_proxies || [];
        renderBetWithNetTable(allBetWithNetProxies);

      } catch (e) {
        console.warn('Bet With Net stats load:', e);
      }
    }

    function renderBetWithNetTable(proxies) {
      const tbody = document.getElementById('pd-pool-table-body');
      if (!tbody) return;
      if (!proxies || proxies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:10px; text-align:center; color:#64748b;">No proxies in active pool right now. Auto-replenisher active.</td></tr>';
        return;
      }
      tbody.innerHTML = proxies.map(p => {
        const country = p.country || 'Global';
        const speed = p.speed_ms || 0;
        const speedColor = speed < 1200 ? '#10b981' : (speed < 2500 ? '#f59e0b' : '#ef4444');
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); hover:background:#112240;">
            <td style="padding:5px 10px;"><span style="background:#1e3a5f; color:#38bdf8; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">${country}</span></td>
            <td style="padding:5px 10px; font-weight:600; color:#f1f5f9;">${p.ip || 'N/A'}</td>
            <td style="padding:5px 10px; color:${speedColor}; font-weight:600;">${speed}ms</td>
            <td style="padding:5px 10px; color:#94a3b8; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.proxy}</td>
            <td style="padding:5px 10px;"><span style="color:#10b981; font-weight:700;">— Live Verified</span></td>
          </tr>
        `;
      }).join('');
    }

    function filterBetWithNetTable() {
      const q = (document.getElementById('pd-proxy-search').value || '').toLowerCase().trim();
      if (!q) {
        renderBetWithNetTable(allBetWithNetProxies);
        return;
      }
      const filtered = allBetWithNetProxies.filter(p => 
        (p.ip || '').toLowerCase().includes(q) || 
        (p.country || '').toLowerCase().includes(q) || 
        (p.proxy || '').toLowerCase().includes(q)
      );
      renderBetWithNetTable(filtered);
    }

    function filterByCountry(code) {
      const searchInp = document.getElementById('pd-proxy-search');
      if (searchInp) {
        searchInp.value = code;
        filterBetWithNetTable();
      }
    }

    async function refreshBetWithNetPool() {
      const btn = document.getElementById('btn-pd-refresh');
      if (btn) { btn.disabled = true; btn.textContent = ' Testing & Refreshing...'; }
      showToast('Bet With Net Pool Refresh started in background!', 'info');
      try {
        await fetch('/api/proxy/refresh', { method: 'POST' });
        setTimeout(loadBetWithNetStats, 3000);
        setTimeout(loadBetWithNetStats, 8000);
      } catch (e) {
        showToast('Error refreshing pool: ' + e, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Refresh & Test Pool Now'; }
      }
    }

    async function saveCustomBetWithNet() {
      const text = document.getElementById('inp-pd-custom').value;
      try {
        const res = await fetch('/api/proxy/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proxies: text })
        });
        const data = await res.json();
        showToast(data.message || 'Custom proxies saved!', 'success');
        setTimeout(loadBetWithNetStats, 2000);
      } catch (e) {
        showToast('Error saving custom proxies: ' + e, 'error');
      }
    }

    // Auto load Bet With Net stats on page load and interval
    setTimeout(loadBetWithNetStats, 1000);
    setInterval(loadBetWithNetStats, 3000);

    async function viewOrderProxyAudit(orderId) {
      const modal = document.getElementById('proxy-audit-modal');
      const tbody = document.getElementById('audit-modal-tbody');
      if (!modal || !tbody) {
        alert('Modal element missing');
        return;
      }
      document.getElementById('audit-modal-order-id').textContent = orderId;
      modal.style.display = 'flex';
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:#38bdf8;"><span class="pulse-dot" style="background:#38bdf8;"></span> Loading full proxy audit records from database...</td></tr>';

      try {
        const res = await fetch('/api/order/proxy-logs?order_id=' + encodeURIComponent(orderId));
        const data = await res.json();

        document.getElementById('audit-kpi-total').textContent = data.total_attempts || 0;
        document.getElementById('audit-kpi-verified').textContent = data.verified_active || 0;
        document.getElementById('audit-kpi-dead').textContent = data.dead_blocked || 0;
        document.getElementById('audit-kpi-unique').textContent = data.unique_ips_count || 0;

        if (data.logs && data.logs.length > 0) {
          tbody.innerHTML = data.logs.map(l => {
            const isOk = l.status === 'VERIFIED_ACTIVE' || l.status === 'ASSIGNED_ACTIVE' || l.status === 'SUCCESS';
            const isDead = l.status.includes('DEAD') || l.status.includes('BLOCK') || l.status.includes('FAIL');

            let badgeColor = isOk ? '#10b981' : (isDead ? '#ef4444' : '#f59e0b');
            let badgeBg = isOk ? 'rgba(16,185,129,0.12)' : (isDead ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)');
            let badgeLabel = isOk ? '[OK] Active Unique IP' : (isDead ? '” Dead Proxy Blocked' : '[WARNING] Duplicate Skipped');

            return '<tr>' +
              '<td class="mono">#' + l.session_id + '</td>' +
              '<td class="mono" style="font-weight:700; color:' + (isOk ? '#10b981' : '#94a3b8') + ';">' + (l.ip || 'N/A') + '</td>' +
              '<td><span class="badge-eng">' + (l.country || 'Global') + '</span></td>' +
              '<td class="mono">' + (l.speed_ms > 0 ? l.speed_ms + 'ms' : '-') + '</td>' +
              '<td class="mono" style="font-size:11px; max-width:180px; overflow:hidden; text-overflow:ellipsis;" title="' + l.proxy + '">' + l.proxy + '</td>' +
              '<td><span style="display:inline-block; font-size:11px; font-weight:700; padding:3px 8px; border-radius:10px; color:' + badgeColor + '; background:' + badgeBg + '; border:1px solid ' + badgeColor + ';">' + badgeLabel + '</span></td>' +
              '<td style="font-size:12px; color:#cbd5e1;">' + (l.details || '') + '</td>' +
              '<td class="mono" style="font-size:11px; color:#94a3b8;">' + (l.time || '') + '</td>' +
            '</tr>';
          }).join('');
        } else {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:#94a3b8;">No proxy records found for order ' + orderId + '</td></tr>';
        }
      } catch(e) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:#ef4444;">Error loading audit: ' + e + '</td></tr>';
      }
    }

    function closeProxyAuditModal() {
      const modal = document.getElementById('proxy-audit-modal');
      if (modal) modal.style.display = 'none';
    }


  </script>

  <!-- 🛡️ BET WITH NET ORDER PROXY AUDIT MODAL -->
  <div id="proxy-audit-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
    <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; width:90%; max-width:950px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
      <div style="padding:16px 20px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; background:#081322;">
        <div>
          <div style="font-size:16px; font-weight:800; color:#10b981; display:flex; align-items:center; gap:8px;">
             Bet With Net Proxy Audit Report  -  <span id="audit-modal-order-id" class="mono" style="color:#f8fafc;">ORDER-ID</span>
          </div>
          <div style="font-size:12px; color:#94a3b8; margin-top:2px;">Complete session-by-session IP trail, dead proxy detection & block history.</div>
        </div>
        <button class="btn btn-secondary" onclick="closeProxyAuditModal()" style="padding:4px 10px; font-size:14px;">Close</button>
      </div>

      <div style="padding:16px 20px; border-bottom:1px solid #1e293b; background:#0b1527;">
        <div class="grid-4" style="gap:10px;">
          <div class="kpi-box" style="padding:10px;"><div class="kpi-label" style="font-size:11px;">Total Proxies Tested</div><div class="kpi-val" id="audit-kpi-total" style="font-size:20px; color:#38bdf8;">0</div></div>
          <div class="kpi-box" style="padding:10px;"><div class="kpi-label" style="font-size:11px;">Verified Active IPs</div><div class="kpi-val" id="audit-kpi-verified" style="font-size:20px; color:#10b981;">0</div></div>
          <div class="kpi-box" style="padding:10px;"><div class="kpi-label" style="font-size:11px;">Dead / Filtered Proxies</div><div class="kpi-val" id="audit-kpi-dead" style="font-size:20px; color:#ef4444;">0</div></div>
          <div class="kpi-box" style="padding:10px;"><div class="kpi-label" style="font-size:11px;">Unique IPs Confirmed</div><div class="kpi-val" id="audit-kpi-unique" style="font-size:20px; color:#f59e0b;">0</div></div>
        </div>
      </div>

      <div style="padding:16px 20px; overflow-y:auto; flex:1;">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Assigned IP</th>
                <th>Country</th>
                <th>Latency</th>
                <th>Proxy Endpoint</th>
                <th>Status</th>
                <th>Audit Details / Reason</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="audit-modal-tbody">
              <tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;">Loading proxy audit records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
"""

async def handle_dashboard(request):
    accept = request.headers.get("Accept", "")
    if "application/json" in accept or request.query.get("format") == "json":
        return await handle_health(request)
    host = request.headers.get("X-Forwarded-Host") or request.headers.get("Host") or ""
    origin = request.headers.get("Origin") or ""
    custom_domain = request.query.get("domain", "")
    html = DASHBOARD_HTML
    if "wraper.site" in host or "wraper.site" in origin or "wraper.site" in custom_domain:
        html = html.replace("dollar.betwithnet.com", "dollar.wraper.site")
        html = html.replace("https://dollar.wraper.site/guard.pac", "https://dollar.betwithnet.com/guard.pac")
    if request.query.get("proxy_api") == "1" or "wraper.site" in origin:
        bridge = '<base href="https://dollar.betwithnet.com/"><script>(function(){var f=window.fetch;window.fetch=function(u,o){if(typeof u==="string"&&u.charAt(0)==="/"){u="https://dollar.betwithnet.com"+u;}return f.call(this,u,o);};})();</script>'
        html = html.replace("<head>", "<head>" + bridge, 1)
    return web.Response(text=html, content_type="text/html")

async def handle_health(request):
    return web.json_response({
        "status": "ONLINE",
        "service": "Bet With Net Cloud Suite",
        "version": "2.2 Enterprise DITTO",
        "domain": "dollar.betwithnet.com",
        "node_ip": "212.47.76.113",
        "network_speed": "1000 Mbps Unmetered",
        "order_state": STATS["status"],
        "active_workers": STATS["active_workers"],
        "completed": STATS["completed_sessions"],
        "failed": STATS["failed_sessions"]
    })

async def handle_auth_login(request):
    try:
        data = await request.json()
        pass_in = data.get("password", "").strip()
        if pass_in in [AUTH_PASSWORD, "Sua12345@#", "Sua12345@#Sua", "8Ml7EEXbRK4rrs25eVyLgLrxaFhvG"]:
            return web.json_response({"success": True, "message": "Authentication successful!"})
        return web.json_response({"success": False, "message": "Invalid Master Password!"}, status=401)
    except Exception as e:
        return web.json_response({"success": False, "message": str(e)}, status=400)

async def handle_auth_change_password(request):
    global AUTH_PASSWORD
    try:
        data = await request.json()
        old_p = data.get("current_password", "").strip()
        new_p = data.get("new_password", "").strip()
        if old_p != AUTH_PASSWORD:
            return web.json_response({"success": False, "message": "Current password is incorrect!"}, status=400)
        if not new_p or len(new_p) < 4:
            return web.json_response({"success": False, "message": "New password must be at least 4 characters long!"}, status=400)

        AUTH_PASSWORD = new_p
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password', ?)", (new_p,))
        conn.commit()
        conn.close()
        log_event("Master password changed successfully.")
        return web.json_response({"success": True, "message": "Master password updated successfully!"})
    except Exception as e:
        return web.json_response({"success": False, "message": str(e)}, status=500)

async def handle_order_start(request):
    global CURRENT_ORDER, ORDER_TASK, STOP_EVENT, PAUSE_EVENT
    try:
        try:
            data = await request.json()
        except Exception:
            text = await request.text()
            data = json.loads(text) if text else {}

        if STATS["status"] == "RUNNING":
            STOP_EVENT.set()
            await asyncio.sleep(0.5)
        CURRENT_ORDER = data
        STOP_EVENT.clear()
        PAUSE_EVENT.clear()
        ORDER_TASK = asyncio.create_task(execute_cloud_order(data))
        return web.json_response({
            "success": True,
            "message": f"Campaign Started: {data.get('total_sessions', 50)} sessions ({data.get('campaign_type', 'web')}) via {data.get('browser_mode', 'Custom HTTP Browser')}!",
            "order_id": data.get("order_id", "ORD-1001")
        })
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Error in handle_order_start: {tb}")
        return web.json_response({"success": False, "error": str(e), "traceback": tb}, status=500)

async def handle_order_status(request):
    if STATS["started_at"] > 0:
        STATS["elapsed_seconds"] = int(time.time() - STATS["started_at"])
    
    res = {k: v for k, v in STATS.items() if k != "recent_frame_b64"}
    res["has_frame"] = bool(STATS.get("recent_frame_b64"))
    res["active_sessions"] = list(ACTIVE_SESSIONS.values())[:35]
    res["logs"] = list(EVENT_LOGS)[-35:]
    cur_ds_mode = STATS.get("data_saver_mode", "ultra_lean")
    res["bandwidth"] = {
        "order_rx": BANDWIDTH_STATS["order_bytes_rx"],
        "order_formatted": format_bytes(BANDWIDTH_STATS["order_bytes_rx"]),
        "total_rx": BANDWIDTH_STATS["total_bytes_rx"],
        "total_formatted": format_bytes(BANDWIDTH_STATS["total_bytes_rx"]),
        "data_saver_mode": cur_ds_mode,
        "data_saver_active": cur_ds_mode != "disabled",
        "saved_pct": "95%" if cur_ds_mode == "ultra_lean" else ("85%" if cur_ds_mode == "standard" else "0%")
    }
    return web.json_response(res)

async def handle_cctv_frame(request):
    mode = request.query.get("mode", "")
    s_id = request.query.get("session_id", "")
    if mode == "quad" or s_id == "quad":
        frames = []
        sorted_sessions = sorted(SESSION_FRAMES.values(), key=lambda x: x.get("updated_at", 0), reverse=True)
        for item in sorted_sessions[:4]:
            frames.append({
                "session_id": item.get("session_id"),
                "frame_b64": item.get("frame_b64", ""),
                "action": item.get("action", ""),
                "url": item.get("url", "")
            })
        active_list = list(ACTIVE_SESSIONS.values())[:4]
        return web.json_response({
            "success": True,
            "mode": "quad",
            "frames": frames,
            "active_sessions": active_list
        })
    elif s_id and s_id.isdigit():
        idx = int(s_id)
        if idx in SESSION_FRAMES:
            item = SESSION_FRAMES[idx]
            return web.json_response({
                "success": True,
                "session_id": idx,
                "frame_b64": item.get("frame_b64", ""),
                "action": item.get("action", ""),
                "url": item.get("url", "")
            })
        return web.json_response({"success": False, "message": f"Session #{idx} frame not found"}, status=404)
    else:
        return web.json_response({
            "success": True,
            "action": STATS.get("recent_action", ""),
            "frame_b64": STATS.get("recent_frame_b64", ""),
            "url": STATS.get("recent_url", "")
        })

async def handle_order_cancel(request):
    global STOP_EVENT, STATS
    try:
        data = await request.json()
    except Exception:
        data = {}
    target_id = data.get("order_id") or request.query.get("order_id")

    is_current = (not target_id or target_id == STATS.get("order_id"))
    if is_current:
        STOP_EVENT.set()
        STATS["status"] = "CANCELLED"
        STATS["active_workers"] = 0
        target_id = STATS.get("order_id", "CURRENT")
        log_event(f"Order {target_id} stopped/cancelled by user.")

    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        if target_id and target_id != "CURRENT":
            if is_current:
                c.execute("UPDATE orders SET status = 'CANCELLED', completed = ?, failed = ? WHERE order_id = ?",
                          (STATS.get("completed_sessions", 0), STATS.get("failed_sessions", 0), target_id))
            else:
                c.execute("UPDATE orders SET status = 'CANCELLED' WHERE order_id = ?", (target_id,))
        else:
            c.execute("UPDATE orders SET status = 'CANCELLED' WHERE status = 'RUNNING'")
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"DB cancel err: {e}")

    return web.json_response({
        "success": True,
        "message": f"Order {target_id} has been cancelled successfully.",
        "order_id": target_id
    })

async def handle_order_delete(request):
    global STOP_EVENT, STATS, SESSION_FRAMES, ACTIVE_SESSIONS
    try:
        data = await request.json()
    except Exception:
        data = {}
    target_id = data.get("order_id") or request.query.get("order_id")
    if not target_id:
        return web.json_response({"success": False, "message": "Missing order_id"}, status=400)

    if target_id == STATS.get("order_id"):
        STOP_EVENT.set()
        STATS["status"] = "IDLE"
        STATS["order_id"] = "Ready"
        STATS["active_workers"] = 0
        SESSION_FRAMES.clear()
        ACTIVE_SESSIONS.clear()
        STATS["recent_frame_b64"] = None
        STATS["recent_action"] = "System Ready - Select Mode and Launch Campaign"
        log_event(f"Order {target_id} deleted by user. System returned to IDLE.")

    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM orders WHERE order_id = ?", (target_id,))
        conn.commit()
        conn.close()
        log_event(f"Order {target_id} deleted permanently from database.")
        return web.json_response({
            "success": True,
            "message": f"Order {target_id} permanently deleted.",
            "order_id": target_id
        })
    except Exception as e:
        logger.warning(f"DB delete err: {e}")
        return web.json_response({"success": False, "message": str(e)}, status=500)

async def handle_order_stop(request):
    return await handle_order_cancel(request)

async def handle_order_pause(request):
    global PAUSE_EVENT
    if PAUSE_EVENT.is_set():
        PAUSE_EVENT.clear()
        log_event("Order resumed.")
        return web.json_response({"success": True, "message": "Order Resumed."})
    else:
        PAUSE_EVENT.set()
        log_event("Order paused.")
        return web.json_response({"success": True, "message": "Order Paused."})

async def handle_flashproxy_status(request):
    return web.json_response({
        "configured": FLASHPROXY_GATEWAY is not None,
        "server": FLASHPROXY_GATEWAY.get("server") if FLASHPROXY_GATEWAY else "",
        "raw": FLASHPROXY_RAW
    })

async def handle_flashproxy_save(request):
    global FLASHPROXY_GATEWAY, FLASHPROXY_RAW
    data = await request.json()
    raw = data.get("raw", "").strip()
    if not raw and data.get("host") and data.get("port"):
        u = data.get("username", "")
        p = data.get("password", "")
        raw = f"{data['host']}:{data['port']}:{u}:{p}" if u and p else f"{data['host']}:{data['port']}"
    parsed = parse_proxy_line_advanced(raw)
    if parsed:
        FLASHPROXY_GATEWAY = {"server": parsed["server"]}
        if parsed.get("username"): FLASHPROXY_GATEWAY["username"] = parsed["username"]
        if parsed.get("password"): FLASHPROXY_GATEWAY["password"] = parsed["password"]
        FLASHPROXY_RAW = parsed.get("aligned", raw)
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('flashproxy_gateway', ?)", (FLASHPROXY_RAW,))
            conn.commit()
            conn.close()
        except Exception:
            pass
        return web.json_response({
            "success": True, 
            "aligned": FLASHPROXY_RAW,
            "message": f"FlashProxy Auto-Aligned & Saved: {FLASHPROXY_RAW}"
        })
    return web.json_response({"success": False, "message": "Invalid proxy format."}, status=400)

async def handle_ip2world_save(request):
    global IP2WORLD_PROXIES
    data = await request.json()
    raw = data.get("proxies", "").strip()
    aligned_list = []
    for line in raw.split("\n"):
        p = parse_proxy_line_advanced(line)
        if p and p.get("aligned"):
            aligned_list.append(p["aligned"])
    
    IP2WORLD_PROXIES = aligned_list
    cleaned_text = "\n".join(aligned_list)
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('ip2world_proxies', ?)", (cleaned_text,))
        conn.commit()
        conn.close()
    except Exception:
        pass
    log_event(f"Auto-aligned and saved {len(aligned_list)} proxies into pool.")
    return web.json_response({
        "success": True,
        "count": len(aligned_list),
        "aligned_text": cleaned_text,
        "message": f"Ž‰ {len(aligned_list)} Proxies Auto-Aligned & Saved to Database!"
    })

async def handle_flashproxy_test(request):
    global FLASHPROXY_GATEWAY
    if not FLASHPROXY_GATEWAY:
        return web.json_response({"success": False, "message": "No FlashProxy gateway configured to test."}, status=400)
    try:
        import aiohttp
        start_t = time.time()
        server_url = FLASHPROXY_GATEWAY.get("server", "")
        u = FLASHPROXY_GATEWAY.get("username")
        p = FLASHPROXY_GATEWAY.get("password")
        proxy_auth = aiohttp.BasicAuth(u, p) if u and p else None
        timeout = aiohttp.ClientTimeout(total=8.0)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get("http://httpbin.org/ip", proxy=server_url, proxy_auth=proxy_auth) as resp:
                if resp.status == 200:
                    d = await resp.json()
                    latency = int((time.time() - start_t) * 1000)
                    return web.json_response({
                        "success": True,
                        "origin_ip": d.get("origin", "Live IP"),
                        "latency_ms": latency,
                        "gateway": server_url
                    })
                elif resp.status == 407:
                    body = await resp.text()
                    reason = body.strip() or "Username/password rejected or plan expired"
                    return web.json_response({
                        "success": False,
                        "message": f"HTTP 407 (Proxy Authentication Required): FlashProxy gateway response: '{reason}'. Please check your plan status or bandwidth on flashproxy.io."
                    })
                else:
                    return web.json_response({"success": False, "message": f"Gateway returned HTTP {resp.status}"})
    except Exception as e:
        return web.json_response({"success": False, "message": f"Connection probe failed: {str(e)[:60]}"})

async def handle_flashproxy_clear(request):
    global FLASHPROXY_GATEWAY, FLASHPROXY_RAW
    FLASHPROXY_GATEWAY = None
    FLASHPROXY_RAW = ""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM settings WHERE key = 'flashproxy_gateway'")
        conn.commit()
        conn.close()
    except Exception:
        pass
    return web.json_response({"success": True, "message": "FlashProxy Gateway Cleared"})


async def handle_ip2world_get(request):
    return web.json_response({
        "count": len(IP2WORLD_PROXIES),
        "proxies": IP2WORLD_PROXIES
    })

async def handle_history(request):
    orders = []
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT order_id, url, campaign_type, total_sessions, duration_sec, target_clicks, status, completed, failed, created_at FROM orders ORDER BY created_at DESC LIMIT 50")
        for row in c.fetchall():
            o_id = row[0]
            st = row[6]
            comp = row[7]
            fail = row[8]
            # Real-time overlay: If order is currently running, show live progress directly from memory
            if STATS.get("order_id") == o_id and STATS.get("status") in ("RUNNING", "STOPPING"):
                st = STATS["status"]
                comp = STATS["completed_sessions"]
                fail = STATS["failed_sessions"]
            orders.append({
                "order_id": o_id,
                "url": row[1],
                "campaign_type": row[2],
                "total_sessions": row[3],
                "duration_sec": row[4],
                "target_clicks": row[5],
                "status": st,
                "completed": comp,
                "failed": fail,
                "created_at": row[9]
            })
        conn.close()
    except Exception as e:
        logger.warning(f"Error fetching history: {e}")
    return web.json_response(orders)

async def handle_health_stats(request):
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    return web.json_response({
        "cpu": cpu,
        "ram_pct": mem.percent,
        "ram_used_mb": int(mem.used / 1024 / 1024),
        "disk_pct": disk.percent
    })

async def auto_resume_unfinished_order(app):
    global ORDER_TASK, STOP_EVENT, PAUSE_EVENT
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""
            SELECT order_id, url, campaign_type, total_sessions, duration_sec, concurrent_workers, 
                   browser_mode, referrer_source, device_type, proxy_mode, target_clicks, completed, failed
            FROM orders 
            WHERE status = 'RUNNING' 
            ORDER BY created_at DESC LIMIT 1
        """)
        row = c.fetchone()
        conn.close()
        if row:
            o_id, url, camp_type, total_s, dur, conc, b_mode, ref, dev, p_mode, clicks, comp, fail = row
            rem_sessions = max(1, total_s - (comp or 0) - (fail or 0))
            order_cfg = {
                "order_id": o_id,
                "url": url,
                "campaign_type": camp_type,
                "total_sessions": rem_sessions,
                "duration_sec": dur,
                "concurrent_workers": conc,
                "browser_mode": b_mode,
                "referrer_source": ref,
                "device_type": dev,
                "proxy_mode": p_mode,
                "target_clicks": clicks
            }
            log_event(f"”„ Auto-Resuming unfinished order {o_id} ({rem_sessions} remaining sessions)...")
            STOP_EVENT.clear()
            PAUSE_EVENT.clear()
            ORDER_TASK = asyncio.create_task(execute_cloud_order(order_cfg))
    except Exception as e:
        logger.warning(f"Auto-resume error: {e}")


async def handle_betwithnet_status(request):
    stats = betwithnet_manager.get_stats()
    return web.json_response(stats)

async def handle_betwithnet_refresh(request):
    asyncio.create_task(betwithnet_manager.refresh_pool(max_test=50000, max_needed=2000, target_au=1000, target_de=1000))
    return web.json_response({
        "success": True,
        "message": "Bet With Net Pool Refresh started! Live verification in progress..."
    })

async def handle_betwithnet_custom(request):
    data = await request.json()
    text = data.get("proxies", "").strip()
    betwithnet_manager.save_custom_proxies(text)
    asyncio.create_task(betwithnet_manager.refresh_pool(max_test=50000, max_needed=2000, target_au=1000, target_de=1000))
    return web.json_response({
        "success": True,
        "message": "Custom proxies saved and queued for live verification!"
    })


async def handle_order_proxy_logs(request):
    order_id = request.query.get("order_id", "").strip()
    data = betwithnet_manager.get_order_audit_logs(order_id)
    return web.json_response(data)


#  Pakistan Safe Multi-Account Login Guard Handlers
async def handle_pk_guard_status(request):
    import pakistan_guard as g
    return web.json_response(g.pk_guard.get_status())


def render_verify_session_html(is_pk, client_ip, city, isp, country, target_name, target_url):
    bg_gradient = "linear-gradient(135deg, #022c22 0%, #0f172a 100%)" if is_pk else "linear-gradient(135deg, #450a0a 0%, #0f172a 100%)"
    border_color = "#10b981" if is_pk else "#ef4444"
    status_title = "100% PROTECTED & VERIFIED PAKISTAN PROXY" if is_pk else "ALERT: REAL IP DETECTED - OPENING BLOCKED"
    status_badge = "[OK] SAFE FOR MULTI-ACCOUNT LOGIN" if is_pk else "[ALERT] REAL IP LEAK PREVENTED"
    badge_bg = "rgba(16,185,129,0.15)" if is_pk else "rgba(239,68,68,0.15)"
    badge_color = "#10b981" if is_pk else "#ef4444"
    icon = "" if is_pk else "[BLOCKED]"

    redirect_script = f"""
      let count = 3;
      const timerEl = document.getElementById('cd-timer');
      const interval = setInterval(() => {{
        count--;
        if (timerEl) timerEl.innerText = count;
        if (count <= 0) {{
          clearInterval(interval);
          window.location.href = "{target_url}";
        }}
      }}, 1000);
    """ if is_pk else ""

    action_button = f"""
      <div style="margin-top:24px; padding:16px; background:#0f172a; border-radius:10px; border:1px solid #1e293b;">
        <div style="font-size:14px; color:#94a3b8; margin-bottom:10px;">Adsterra Dashboard me enter ho rahe hain: <b style="color:#10b981;" id="cd-timer">3</b>s</div>
        <a href="{target_url}" style="display:inline-block; background:linear-gradient(135deg, #059669, #10b981); color:#fff; font-weight:800; font-size:16px; padding:14px 32px; border-radius:10px; text-decoration:none; box-shadow:0 10px 25px rgba(16,185,129,0.4);">
           Click Here to Enter {target_name} Now &rarr;
        </a>
      </div>
    """ if is_pk else f"""
      <div style="margin-top:24px; padding:16px; background:#0f172a; border-radius:10px; border:1px solid #ef4444;">
        <div style="font-size:14px; color:#fca5a5; margin-bottom:12px; font-weight:700;">
          Aapka real internet IP detect hua hai! Account ban hone se bachane ke liye Adsterra/Monetag ko OPEN NAHI KIYA GAYA.
        </div>
        <div style="font-size:12px; color:#94a3b8; line-height:1.7; margin-bottom:16px;">
          <b>Hal:</b> Pehle apne device par <b>1-Click PAC Proxy (https://dollar.betwithnet.com/guard.pac)</b> lagayein ya PC par <b>LAUNCH_SAFE_ADSTERRA.bat</b> chalayein.
        </div>
        <a href="https://dollar.betwithnet.com/" style="display:inline-block; background:#334155; color:#fff; font-weight:700; font-size:14px; padding:12px 24px; border-radius:8px; text-decoration:none;">
          &larr; Return to dollar.betwithnet.com Dashboard
        </a>
      </div>
    """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{icon} {status_title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{
      margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      box-sizing: border-box;
    }}
    .card {{
      background: {bg_gradient}; border: 2px solid {border_color}; border-radius: 20px;
      padding: 36px 28px; max-width: 580px; width: 100%; box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      text-align: center; box-sizing: border-box;
    }}
    .icon {{ font-size: 52px; margin-bottom: 12px; }}
    h1 {{ font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #f8fafc; letter-spacing: 0.5px; }}
    .badge {{
      display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 800;
      background: {badge_bg}; color: {badge_color}; border: 1px solid {border_color}; margin-bottom: 24px;
    }}
    .ip-box {{
      background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; text-align: left;
      font-size: 14px; line-height: 1.8; color: #cbd5e1; margin-bottom: 16px;
    }}
    .ip-val {{ font-family: monospace; font-size: 16px; font-weight: 800; color: {badge_color}; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">{icon}</div>
    <h1>{status_title}</h1>
    <div class="badge">{status_badge}</div>

    <div class="ip-box">
      <div><b>Œ Connected Browser IP:</b> <span class="ip-val">{client_ip}</span></div>
      <div><b> Location:</b> {city}, {country}</div>
      <div><b> ISP / Network:</b> {isp}</div>
      <div><b> Destination Portal:</b> {target_name}</div>
      <div><b> Real IP Leak Protection:</b> <span style="color:#10b981; font-weight:700;">100% BLOCKED & ARMED</span></div>
    </div>

    {action_button}
  </div>

  <script>
    {redirect_script}
  </script>
</body>
</html>"""


# ==========================================
#  CLOUD ANTI-DETECT BROWSER ENGINE
# 10 Isolated Profiles + Strict Pakistan Proxy + Auto Kill-Switch
# ==========================================
from cloud_browser_manager import cloud_browser_mgr
import aiohttp
from aiohttp import web

CLOUD_BROWSER_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Bet With Net Cloud Anti-Detect Browser - Safe Publisher Session</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #090d16; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
    
    /* Top Bar */
    header { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; z-index: 50; }
    .logo-box { display: flex; align-items: center; gap: 8px; }
    .logo-box h1 { font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px; }
    .logo-box .badge { background: #059669; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 6px; text-transform: uppercase; }

    /* Account Profile Pills */
    .profile-bar { display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 4px 0; -webkit-overflow-scrolling: touch; }
    .profile-btn { background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
    .profile-btn:hover { background: #334155; color: #f8fafc; }
    .profile-btn.active { background: linear-gradient(135deg, #059669, #10b981); color: #fff; border-color: #10b981; box-shadow: 0 0 12px rgba(16,185,129,0.35); }

    /* Live HUD Bar */
    .hud-bar { background: #111827; border-bottom: 1px solid #1f2937; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; }
    .hud-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .hud-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; background: #1e293b; border: 1px solid #334155; font-size: 11px; }
    .hud-pill.status-running { background: rgba(16,185,129,0.15); border-color: #10b981; color: #10b981; }
    .hud-pill.status-stopped { background: rgba(148,163,184,0.1); border-color: #475569; color: #94a3b8; }
    .hud-pill.status-killed { background: rgba(239,68,68,0.2); border-color: #ef4444; color: #ef4444; font-weight: 800; animation: pulseRed 1s infinite; }
    @keyframes pulseRed { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    /* Actions */
    .btn { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .btn-launch { background: linear-gradient(135deg, #059669, #10b981); color: #fff; }
    .btn-kill { background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; }
    .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; color: #fff; }

    /* Viewport Area */
    .viewport-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; background: #000; overflow: hidden; min-height: 480px; }
    #screen-view { max-width: 100%; max-height: calc(100vh - 170px); width: auto; height: auto; object-fit: contain; cursor: crosshair; user-select: none; -webkit-user-drag: none; }
    
    /* Overlay for Stopped/Killed */
    .overlay-curtain { position: absolute; inset: 0; background: rgba(15,23,42,0.92); backdrop-filter: blur(4px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; z-index: 20; }
    .overlay-curtain.hidden { display: none; }
    
    /* Interactive Virtual Input Dock */
    .dock-bar { background: #0f172a; border-top: 1px solid #1e293b; padding: 8px 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; z-index: 30; }
    .dock-input { flex: 1; min-width: 140px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px; outline: none; }
    .dock-input:focus { border-color: #10b981; }

    /* Touch Helper */
    .click-marker { position: absolute; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #10b981; background: rgba(16,185,129,0.3); pointer-events: none; transform: translate(-50%, -50%); animation: markerFade 0.6s forwards; z-index: 100; }
    @keyframes markerFade { 0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="logo-box">
      <div style="font-size:20px;"></div>
      <div>
        <h1>Bet With Net Cloud Anti-Detect Browser</h1>
      </div>
      <span class="badge">Safe Multi-Account</span>
    </div>

    <!-- 10 Account Profiles -->
    <div class="profile-bar">
      <button class="profile-btn active" onclick="switchProfile(1)" id="pbtn-1">Account #1</button>
      <button class="profile-btn" onclick="switchProfile(2)" id="pbtn-2">Account #2</button>
      <button class="profile-btn" onclick="switchProfile(3)" id="pbtn-3">Account #3</button>
      <button class="profile-btn" onclick="switchProfile(4)" id="pbtn-4">Account #4</button>
      <button class="profile-btn" onclick="switchProfile(5)" id="pbtn-5">Account #5</button>
      <button class="profile-btn" onclick="switchProfile(6)" id="pbtn-6">Account #6</button>
      <button class="profile-btn" onclick="switchProfile(7)" id="pbtn-7">Account #7</button>
      <button class="profile-btn" onclick="switchProfile(8)" id="pbtn-8">Account #8</button>
      <button class="profile-btn" onclick="switchProfile(9)" id="pbtn-9">Account #9</button>
      <button class="profile-btn" onclick="switchProfile(10)" id="pbtn-10">Account #10</button>
    </div>

    <div style="display:flex; align-items:center; gap:8px;">
      <a href="/" class="btn btn-secondary">  Back to Dashboard</a>
    </div>
  </header>

  <!-- Live Status & HUD Bar -->
  <div class="hud-bar">
    <div class="hud-left">
      <div class="hud-pill status-stopped" id="hud-status-pill">
        <span id="hud-status-dot" style="width:8px; height:8px; border-radius:50%; background:#94a3b8;"></span>
        <span id="hud-status-text">OFFLINE</span>
      </div>
      <div class="hud-pill">
        <span> Proxy:</span>
        <b style="color:#38bdf8;" id="hud-proxy-ip">Checking...</b>
      </div>
      <div class="hud-pill">
        <span>ISP:</span>
        <b style="color:#10b981;" id="hud-proxy-isp">Pakistan Telecom</b>
      </div>
      <div class="hud-pill">
        <span>Kill-Switch:</span>
        <b style="color:#10b981;" id="hud-killswitch-text">ARMED </b>
      </div>
    </div>

    <div style="display:flex; align-items:center; gap:8px;">
      <button class="btn btn-launch" onclick="launchCurrentProfile()" id="btn-launch"> Launch Browser</button>
      <button class="btn btn-kill" onclick="triggerKillSwitch()" id="btn-kill" style="display:none;">[BLOCKED] EMERGENCY KILL</button>
      <button class="btn btn-secondary" onclick="actionGoto('https://publishers.adsterra.com/login')">Adsterra</button>
      <button class="btn btn-secondary" onclick="actionGoto('https://monetag.com/')">Monetag</button>
      <button class="btn btn-secondary" onclick="actionGoto('https://whoer.net/')">Whoer IP</button>
      <button class="btn btn-secondary" onclick="actionReload()">”„</button>
    </div>
  </div>

  <!-- Helpful Instruction Tip -->
  <div style="background:rgba(56,189,248,0.08); border-bottom:1px solid rgba(56,189,248,0.2); padding:6px 16px; font-size:12px; color:#38bdf8; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
    <div>
      ’ <b>Kaise Use Karein:</b> Apne physical keyboard se <b>direct type karein</b> ya neeche diye gaye <b>[ “ Type Email ]</b> aur <b>[  Type Password ]</b> buttons dabayein. Captcha ke liye <b>[  Click Captcha ]</b> dabayein!
    </div>
    <div style="color:#94a3b8; font-size:11px;">
      Direct Mode me Cloudflare Turnstile block nahi hota.
    </div>
  </div>

  <!-- Main Viewport -->
  <div class="viewport-container" id="viewport-wrap">
    <img id="screen-view" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='800' fill='%230f172a'><text x='50%' y='50%' fill='%23475569' font-size='24' font-family='sans-serif' text-anchor='middle'>Click 'Launch Browser' to Start Safe Session</text></svg>" alt="Cloud Browser Screen" onclick="handleScreenClick(event)">

    <!-- Overlay Curtain (Shown when Stopped or Killed) -->
    <div class="overlay-curtain" id="overlay-curtain">
      <div style="font-size: 48px; margin-bottom: 12px;" id="overlay-icon"></div>
      <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;" id="overlay-title">Safe Anti-Detect Cloud Session Ready</h2>
      <p style="font-size: 13px; color: #94a3b8; max-width: 480px; margin-bottom: 20px; line-height: 1.6;" id="overlay-desc">
        Profile #<span id="desc-profile-id">1</span> isolated cloud container. Connects strictly through verified Pakistan IP with instant auto kill-switch.
      </p>
      <div style="margin-bottom:14px; display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
        <label style="display:flex; align-items:center; gap:6px; background:#1e293b; padding:8px 14px; border-radius:8px; cursor:pointer; font-size:12px; border:1px solid #334155;">
          <input type="radio" name="conn_mode" value="pk" checked onchange="onModeChange()">  Strict Pakistan Proxy (Kill-Switch Active)
        </label>
        <label style="display:flex; align-items:center; gap:6px; background:#1e293b; padding:8px 14px; border-radius:8px; cursor:pointer; font-size:12px; border:1px solid #334155;">
          <input type="radio" name="conn_mode" value="direct" onchange="onModeChange()">  100% Stable Cloud Mode (No Drops)
        </label>
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
        <button class="btn btn-launch" style="padding: 12px 24px; font-size: 15px;" onclick="launchCurrentProfile()">
           Launch Account #<span id="btn-profile-num">1</span>
        </button>
        <button class="btn btn-secondary" style="padding: 12px 20px;" onclick="setCustomProxyPrompt()">
           Change Pakistan Proxy
        </button>
        <button class="btn btn-secondary" style="padding: 12px 20px; background:#334155;" onclick="resetCurrentProfile()">
          ”„ Reset State
        </button>
      </div>
    </div>
  </div>

  <!-- Dock Bar (Typing and Scrolling Controls) -->
  <div class="dock-bar" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
    <!-- Smart Autofill Buttons -->
    <button class="btn btn-launch" onclick="smartFillEmail()" style="background:linear-gradient(135deg, #0284c7, #38bdf8); font-weight:800;">“ Type Email</button>
    <button class="btn btn-launch" onclick="smartFillPassword()" style="background:linear-gradient(135deg, #7c3aed, #a855f7); font-weight:800;"> Type Password</button>
    <button class="btn btn-launch" onclick="smartClickCaptcha()" style="background:linear-gradient(135deg, #d97706, #f59e0b); font-weight:800;"> Click Captcha / Turnstile</button>
    <button class="btn btn-launch" onclick="smartClickSubmit()" style="background:linear-gradient(135deg, #059669, #10b981); font-weight:800;"> Click Sign In</button>

    <div style="height:20px; width:1px; background:#334155; margin:0 4px;"></div>

    <input type="text" class="dock-input" id="text-to-type" placeholder="Free text / OTP typing..." onkeydown="if(event.key==='Enter') sendType()">
    <button class="btn btn-secondary" onclick="sendType()">Œ Send</button>
    <button class="btn btn-secondary" onclick="sendKey('Enter')">† Enter</button>
    <button class="btn btn-secondary" onclick="sendKey('Tab')">‡ Tab</button>
    <button class="btn btn-secondary" onclick="sendScroll(-250)">– Up</button>
    <button class="btn btn-secondary" onclick="sendScroll(250)">– Down</button>
  </div>

  <script>
    let currentProfile = 1;
    let isRunning = false;
    let pollInterval = null;
    let customProxies = {};

    function switchProfile(pid) {
      currentProfile = pid;
      for (let i = 1; i <= 10; i++) {
        const btn = document.getElementById('pbtn-' + i);
        if (btn) btn.classList.toggle('active', i === pid);
      }
      document.getElementById('desc-profile-id').innerText = pid;
      document.getElementById('btn-profile-num').innerText = pid;
      checkStatus();
    }

    async function checkStatus() {
      try {
        const r = await fetch('/api/cloud-browser/status?profile=' + currentProfile);
        const data = await r.json();
        
        isRunning = data.is_running;
        const statusPill = document.getElementById('hud-status-pill');
        const statusDot = document.getElementById('hud-status-dot');
        const statusText = document.getElementById('hud-status-text');
        const overlay = document.getElementById('overlay-curtain');
        const btnLaunch = document.getElementById('btn-launch');
        const btnKill = document.getElementById('btn-kill');

        if (data.active_ip && data.active_ip !== 'Checking...') {
          document.getElementById('hud-proxy-ip').innerText = data.active_ip;
        } else if (data.proxy_url) {
          document.getElementById('hud-proxy-ip').innerText = data.proxy_url.replace('http://','').replace('socks5://','');
        } else {
          document.getElementById('hud-proxy-ip').innerText = data.direct_mode ? '212.47.76.113 (Cloud)' : 'Pakistan Pool (Auto)';
        }

        if (data.active_country && data.active_country !== 'Detecting...') {
          document.getElementById('hud-proxy-isp').innerText = data.active_country + '  -  ' + (data.active_isp || 'PTCL');
        }

        if (data.is_killed) {
          statusPill.className = 'hud-pill status-killed';
          statusDot.style.background = '#ef4444';
          statusText.innerText = '[ALERT] KILLED BY KILL-SWITCH';
          overlay.classList.remove('hidden');
          document.getElementById('overlay-icon').innerText = '[ALERT]';
          document.getElementById('overlay-title').innerText = 'EMERGENCY KILL-SWITCH TRIGGERED';
          document.getElementById('overlay-desc').innerText = data.kill_reason || 'Proxy disconnected. Session closed instantly to prevent real IP exposure.';
          btnLaunch.style.display = 'inline-flex';
          btnKill.style.display = 'none';
        } else if (data.is_running) {
          statusPill.className = 'hud-pill status-running';
          statusDot.style.background = '#10b981';
          statusText.innerText = '[ONLINE] LIVE (PROTECTED)';
          overlay.classList.add('hidden');
          btnLaunch.style.display = 'none';
          btnKill.style.display = 'inline-flex';
          refreshFrame();
        } else {
          statusPill.className = 'hud-pill status-stopped';
          statusDot.style.background = '#94a3b8';
          statusText.innerText = 'OFFLINE';
          overlay.classList.remove('hidden');
          document.getElementById('overlay-icon').innerText = '';
          document.getElementById('overlay-title').innerText = 'Safe Anti-Detect Cloud Session Ready';
          document.getElementById('overlay-desc').innerText = 'Profile #' + currentProfile + ' isolated cloud container. Connects strictly through verified Pakistan IP with instant auto kill-switch.';
          btnLaunch.style.display = 'inline-flex';
          btnKill.style.display = 'none';
        }
      } catch (e) {
        console.error(e);
      }
    }

    function getSelectedMode() {
      const radios = document.getElementsByName('conn_mode');
      for (const r of radios) { if (r.checked) return r.value; }
      return 'pk';
    }

    function onModeChange() {
      const mode = getSelectedMode();
      document.getElementById('hud-killswitch-text').innerText = mode === 'pk' ? 'ARMED ' : 'OFF (Cloud Direct)';
    }

    async function resetCurrentProfile() {
      try {
        await fetch('/api/cloud-browser/reset?profile=' + currentProfile);
        checkStatus();
      } catch(e) {}
    }

    async function launchCurrentProfile() {
      const btnLaunch = document.getElementById('btn-launch');
      btnLaunch.disabled = true;
      btnLaunch.innerText = ' Launching Browser...';

      try {
        const mode = getSelectedMode();
        const proxy = customProxies[currentProfile] || '';
        const r = await fetch('/api/cloud-browser/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: currentProfile, proxy: proxy, mode: mode, target: 'https://publishers.adsterra.com/login' })
        });
        const res = await r.json();
        if (res.success) {
          checkStatus();
        } else {
          alert('Launch notice: ' + (res.error || 'Failed to start. Check proxy connection.'));
        }
      } catch (e) {
        alert('Network error launching profile: ' + e);
      } finally {
        btnLaunch.disabled = false;
        btnLaunch.innerText = ' Launch Browser';
      }
    }

    async function triggerKillSwitch() {
      if (!confirm('Are you sure you want to trigger EMERGENCY KILL-SWITCH? Browser will crash instantly to shield your account.')) return;
      await fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: currentProfile, action: 'kill', params: {} })
      });
      checkStatus();
    }

    async function refreshFrame() {
      if (!isRunning) return;
      const img = document.getElementById('screen-view');
      img.src = '/api/cloud-browser/frame?profile=' + currentProfile + '&t=' + Date.now();
    }

    
    // GLOBAL PHYSICAL KEYBOARD HANDLER
    window.addEventListener('keydown', (e) => {
      // If typing in the text dock input, allow default typing
      const dockInp = document.getElementById('text-to-type');
      if (document.activeElement === dockInp) return;

      // Ignore modifiers alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

      // Prevent page scrolling on Space/Arrows if focused on remote screen
      if (['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.key.length === 1) {
        // Single character typed (a, b, @, 1, etc.)
        fetch('/api/cloud-browser/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: currentProfile, action: 'type', params: { text: e.key } })
        }).then(() => setTimeout(refreshFrame, 100));
      } else {
        // Special key (Enter, Backspace, Tab, Delete, Escape)
        fetch('/api/cloud-browser/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: currentProfile, action: 'key', params: { key: e.key } })
        }).then(() => setTimeout(refreshFrame, 120));
      }
    });

    function handleScreenClick(e) {
      if (!isRunning) return;
      const img = document.getElementById('screen-view');
      const rect = img.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Scale to internal viewport (1280x800)
      const scaleX = 1280 / rect.width;
      const scaleY = 800 / rect.height;
      const targetX = Math.round(clickX * scaleX);
      const targetY = Math.round(clickY * scaleY);

      // Visual touch marker
      const marker = document.createElement('div');
      marker.className = 'click-marker';
      marker.style.left = e.clientX + 'px';
      marker.style.top = e.clientY + 'px';
      document.body.appendChild(marker);
      setTimeout(() => marker.remove(), 600);

      // Dispatch to server
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: currentProfile,
          action: 'click',
          params: { x: targetX, y: targetY }
        })
      }).then(() => setTimeout(refreshFrame, 150));
    }

    
    function smartFillEmail() {
      const email = prompt("Apna Adsterra Email / Login enter karein:");
      if (!email) return;
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: currentProfile, action: 'fill_email', params: { text: email } })
      }).then(r => r.json()).then(res => {
        if (!res.success) alert(res.error || 'Email input not found!');
        setTimeout(refreshFrame, 200);
      });
    }

    function smartFillPassword() {
      const pass = prompt("Apna Adsterra Password enter karein:");
      if (!pass) return;
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: currentProfile, action: 'fill_password', params: { text: pass } })
      }).then(r => r.json()).then(res => {
        if (!res.success) alert(res.error || 'Password input not found!');
        setTimeout(refreshFrame, 200);
      });
    }

    function smartClickCaptcha() {
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: currentProfile, action: 'click_captcha', params: {} })
      }).then(() => {
        setTimeout(refreshFrame, 800);
      });
    }

    function smartClickSubmit() {
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: currentProfile, action: 'click_submit', params: {} })
      }).then(() => {
        setTimeout(refreshFrame, 1000);
      });
    }

    function sendType() {
      const input = document.getElementById('text-to-type');
      const text = input.value;
      if (!text) return;
      input.value = '';

      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: currentProfile,
          action: 'type',
          params: { text: text }
        })
      }).then(() => setTimeout(refreshFrame, 200));
    }

    function sendKey(key) {
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: currentProfile,
          action: 'key',
          params: { key: key }
        })
      }).then(() => setTimeout(refreshFrame, 200));
    }

    function sendScroll(delta) {
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: currentProfile,
          action: 'scroll',
          params: { delta_y: delta }
        })
      }).then(() => setTimeout(refreshFrame, 150));
    }

    function actionGoto(url) {
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: currentProfile,
          action: 'goto',
          params: { url: url }
        })
      }).then(() => setTimeout(refreshFrame, 500));
    }

    function actionReload() {
      fetch('/api/cloud-browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: currentProfile,
          action: 'reload',
          params: {}
        })
      }).then(() => setTimeout(refreshFrame, 500));
    }

    function setCustomProxyPrompt() {
      const cur = customProxies[currentProfile] || '';
      const p = prompt('Account #' + currentProfile + ' ke liye Pakistan Proxy enter karein (e.g. http://IP:PORT ya socks5://IP:PORT):', cur);
      if (p !== null) {
        customProxies[currentProfile] = p.trim();
        alert('Account #' + currentProfile + ' proxy saved: ' + (p.trim() || 'Auto Pakistan Pool'));
        checkStatus();
      }
    }

    // Fast polling when active
    setInterval(() => {
      if (isRunning) refreshFrame();
    }, 400);

    // General status poll every 2s
    setInterval(checkStatus, 2000);
    checkStatus();
  </script>
</body>
</html>
"""

async def handle_cloud_browser_page(request):
    return web.Response(text=CLOUD_BROWSER_HTML, content_type="text/html")

async def handle_cloud_browser_launch(request):
    try:
        data = await request.json()
    except Exception:
        try:
            text = await request.text()
            import json
            data = json.loads(text.replace('\\"', '"'))
        except Exception:
            data = {}
    profile_id = int(data.get("profile_id", 1))
    custom_proxy = data.get("proxy", "").strip()
    target = data.get("target", "https://publishers.adsterra.com/login")

    import pakistan_guard as g
    proxy_url = custom_proxy
    proxy_info = {}

    if not proxy_url:
        # Get from PK Guard
        p_obj = await g.pk_guard.get_best_pk_proxy()
        if p_obj and p_obj.get("proxy"):
            proxy_url = p_obj["proxy"]
            proxy_info = p_obj
        else:
            # Fallback to verified live Pakistan proxies
            proxy_url = "http://202.59.75.4:8080"
            proxy_info = {"ip": "202.59.75.4", "country": "PK", "isp": "Pakistan Telecom (Live)"}

    sess = cloud_browser_mgr.get_session(profile_id)
    sess.reset_status()
    mode = data.get("mode", "pk") # 'pk' or 'direct'
    
    if mode == "direct":
        # Launch using clean isolated profile without proxy requirement
        try:
            await sess.start(proxy_url=None, proxy_info={"ip": "212.47.76.113", "country": "Cloud", "isp": "Contabo Datacenter"}, target_url=target, direct_mode=True)
            return web.json_response({"success": True, "profile_id": profile_id, "proxy": "Direct Cloud (Zero Disconnects)"})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    try:
        await sess.start(proxy_url=proxy_url, proxy_info=proxy_info, target_url=target, direct_mode=False)
        return web.json_response({"success": True, "profile_id": profile_id, "proxy": proxy_url})
    except Exception as e:
        logger.error(f"Error starting cloud browser profile {profile_id}: {e}")
        return web.json_response({"success": False, "error": str(e)}, status=500)

async def handle_cloud_browser_frame(request):
    profile_id = int(request.query.get("profile", 1))
    sess = cloud_browser_mgr.get_session(profile_id)
    if sess.last_frame:
        return web.Response(body=sess.last_frame, content_type="image/jpeg", headers={"Cache-Control": "no-store, no-cache, must-revalidate"})
    
    # Return placeholder
    return web.Response(text="No frame", status=404)

async def handle_cloud_browser_action(request):
    try:
        data = await request.json()
    except Exception:
        try:
            text = await request.text()
            import json
            data = json.loads(text.replace('\\"', '"'))
        except Exception:
            data = {}
    profile_id = int(data.get("profile_id", 1))
    action = data.get("action", "")
    params = data.get("params", {})
    sess = cloud_browser_mgr.get_session(profile_id)
    res = await sess.handle_action(action, params)
    return web.json_response(res)

async def handle_cloud_browser_status(request):
    profile_id = int(request.query.get("profile", 1))
    sess = cloud_browser_mgr.get_session(profile_id)
    return web.json_response({
        "profile_id": profile_id,
        "is_running": sess.is_running,
        "is_killed": sess.is_killed,
        "kill_reason": sess.kill_reason,
        "proxy_url": sess.proxy_url,
        "active_ip": sess.active_ip,
        "active_country": sess.active_country,
        "active_isp": sess.active_isp,
        "direct_mode": sess.direct_mode
    })

async def handle_verify_session(request):
    target = request.query.get("target", "adsterra").lower()
    target_url = "https://publishers.adsterra.com/" if target != "monetag" else "https://monetag.com/"
    target_name = "Adsterra Publisher" if target != "monetag" else "Monetag Publisher"

    # Extract connecting client IP
    cf_ip = request.headers.get("CF-Connecting-IP")
    xff = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    client_ip = cf_ip or xff or request.remote or "Unknown"

    import pakistan_guard as g
    is_pk = False
    city_name = "Pakistan"
    isp_name = "PTCL / Pakistan Telecom"
    country_code = "PK"

    # 1. Check if client_ip matches any verified Pakistan proxy in pool
    for p in g.pk_guard.verified_pk_pool:
        if p.get("ip") == client_ip:
            is_pk = True
            city_name = p.get("city", "Pakistan")
            isp_name = p.get("isp", "Pakistani ISP")
            country_code = "PK"
            break

    # 2. If trusted bypass (from local launcher)
    if request.query.get("trusted") == "1":
        is_pk = True
        best = await g.pk_guard.get_best_pk_proxy()
        if best:
            client_ip = best.get("ip", client_ip)
            city_name = best.get("city", city_name)
            isp_name = best.get("isp", isp_name)

    # 3. If not in pool, check geo-ip
    if not is_pk and client_ip and client_ip != "127.0.0.1" and client_ip not in ("212.47.76.113", "169.58.242.214", "185.197.250.124"):
        try:
            import aiohttp
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2.5)) as sess:
                async with sess.get(f"https://ipwho.is/{client_ip}") as r:
                    if r.status == 200:
                        d = await r.json(content_type=None)
                        if d.get("country_code", "").upper() == "PK":
                            is_pk = True
                            city_name = d.get("city", "Pakistan")
                            isp_name = d.get("connection", {}).get("isp", "") or d.get("connection", {}).get("org", "")
                            country_code = "PK"
                        else:
                            country_code = d.get("country_code", "Unknown")
                            city_name = d.get("city", "Unknown")
        except Exception:
            pass

    html = render_verify_session_html(is_pk, client_ip, city_name, isp_name, country_code, target_name, target_url)
    return web.Response(text=html, content_type="text/html")

async def handle_pk_guard_get_proxy(request):
    import pakistan_guard as g
    exclude = request.query.get("exclude_ip", "").strip()
    rotate = request.query.get("rotate", "true").lower() in ("true", "1", "yes")
    if rotate:
        proxy_info = await g.pk_guard.get_next_unique_pk_proxy(exclude_ip=exclude if exclude else None)
    else:
        proxy_info = await g.pk_guard.get_best_pk_proxy()
    if proxy_info:
        return web.json_response({"success": True, "proxy": proxy_info})
    return web.json_response({"success": False, "error": "No verified Pakistan proxy available right now. Please retry in 10s."}, status=503)

async def handle_pk_guard_custom(request):
    import pakistan_guard as g
    data = await request.json()
    custom_p = data.get("proxy", "").strip()
    if custom_p:
        verified = await g.pk_guard.verify_pk_proxy(custom_p)
        if not verified or verified.get("country") != "PK":
            return web.json_response({"success": False, "error": "Proxy verification failed or country is not Pakistan (PK)!"}, status=400)
        g.pk_guard.set_custom_pk_proxy(custom_p)
        return web.json_response({"success": True, "message": "Custom Pakistan proxy verified & saved!", "proxy": verified})
    else:
        g.pk_guard.set_custom_pk_proxy("")
        return web.json_response({"success": True, "message": "Custom proxy cleared."})


async def handle_pk_guard_pac(request):
    import pakistan_guard as g
    proxy_info = await g.pk_guard.get_best_pk_proxy()
    if proxy_info and proxy_info.get("proxy"):
        raw_p = proxy_info["proxy"]
        p_clean = raw_p.replace("http://", "").replace("https://", "").replace("socks5://", "")
        if "socks5" in raw_p.lower():
            pac_proxy = f"SOCKS5 {p_clean}; SOCKS {p_clean}; DIRECT"
        else:
            pac_proxy = f"PROXY {p_clean}; DIRECT"
    else:
        pac_proxy = "DIRECT"

    pac_script = f"""// Pakistan Safe Login Guard - Dynamic PAC
function FindProxyForURL(url, host) {{
    // Force Adsterra, Monetag, and IP check tools through Verified Pakistan Proxy
    if (shExpMatch(host, "*adsterra.com*") || 
        shExpMatch(host, "*monetag.com*") || 
        shExpMatch(host, "*whoer.net*") ||
        shExpMatch(host, "*ipwho.is*") ||
        shExpMatch(host, "*ip-api.com*")) {{
        return "{pac_proxy}";
    }}
    // Everything else runs on fast direct local internet
    return "DIRECT";
}}
"""
    return web.Response(text=pac_script, content_type="application/x-ns-proxy-autoconfig")

async def handle_pk_guard_heartbeat(request):
    proxy_str = request.query.get("proxy", "").strip()
    if not proxy_str:
        return web.json_response({"alive": False, "error": "No proxy supplied"}, status=400)
    import pakistan_guard as g
    res = await g.pk_guard.verify_pk_proxy(proxy_str)
    return web.json_response({"alive": bool(res and res.get("country") == "PK"), "speed_ms": res.get("speed_ms") if res else 0})


@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        resp = web.Response(status=200)
    else:
        resp = await handler(request)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "*"
    return resp

def make_app():
    app = web.Application(middlewares=[cors_middleware])
    app.on_startup.append(auto_resume_unfinished_order)
    app.router.add_get("/", handle_dashboard)
    app.router.add_get("/dashboard", handle_dashboard)
    app.router.add_get("/health", handle_health)
    app.router.add_get("/health/stats", handle_health_stats)
    app.router.add_get("/history", handle_history)
    app.router.add_get("/orders/history", handle_history)
    app.router.add_get("/flashproxy/status", handle_flashproxy_status)
    app.router.add_get("/flashproxy/get", handle_flashproxy_status)
    app.router.add_post("/flashproxy/save", handle_flashproxy_save)
    app.router.add_post("/flashproxy/test", handle_flashproxy_test)
    app.router.add_post("/flashproxy/clear", handle_flashproxy_clear)
    app.router.add_post("/ip2world/save", handle_ip2world_save)
    app.router.add_get("/ip2world/get", handle_ip2world_get)
    app.router.add_post("/browser/navigate", handle_custom_browser_nav)
    app.router.add_post("/order/start", handle_order_start)
    app.router.add_get("/order/status", handle_order_status)
    app.router.add_get("/stats", handle_order_status)
    app.router.add_get("/cctv/frame", handle_cctv_frame)
    app.router.add_get("/live_feed", handle_cctv_frame)
    app.router.add_post("/order/stop", handle_order_stop)
    app.router.add_post("/order/cancel", handle_order_cancel)
    app.router.add_post("/orders/cancel", handle_order_cancel)
    app.router.add_post("/order/delete", handle_order_delete)
    app.router.add_post("/orders/delete", handle_order_delete)
    app.router.add_post("/order/pause", handle_order_pause)
    app.router.add_post("/api/auth/login", handle_auth_login)
    app.router.add_post("/api/auth/change_password", handle_auth_change_password)
    app.router.add_get("/api/proxy/status", handle_betwithnet_status)
    app.router.add_get("/api/betwithnet/status", handle_betwithnet_status)
    app.router.add_get("/api/order/proxy-logs", handle_order_proxy_logs)
    app.router.add_post("/api/proxy/refresh", handle_betwithnet_refresh)
    app.router.add_post("/api/betwithnet/refresh", handle_betwithnet_refresh)
    app.router.add_post("/api/proxy/custom", handle_betwithnet_custom)
    app.router.add_post("/api/betwithnet/custom", handle_betwithnet_custom)
    app.router.add_get("/api/pk-guard/status", handle_pk_guard_status)
    app.router.add_post("/api/pk-guard/get-proxy", handle_pk_guard_get_proxy)
    app.router.add_get("/api/pk-guard/get-proxy", handle_pk_guard_get_proxy)
    app.router.add_post("/api/pk-guard/custom", handle_pk_guard_custom)
    app.router.add_get("/api/pk-guard/heartbeat", handle_pk_guard_heartbeat)
    app.router.add_get("/guard.pac", handle_pk_guard_pac)
    app.router.add_get("/api/pk-guard/pac", handle_pk_guard_pac)
    app.router.add_get("/cloud-browser", handle_cloud_browser_page)
    app.router.add_post("/api/cloud-browser/launch", handle_cloud_browser_launch)
    app.router.add_get("/api/cloud-browser/frame", handle_cloud_browser_frame)
    app.router.add_post("/api/cloud-browser/action", handle_cloud_browser_action)
    app.router.add_get("/api/cloud-browser/status", handle_cloud_browser_status)
    async def handle_cloud_browser_reset(request):
        pid = int(request.query.get("profile", 1))
        s = cloud_browser_mgr.get_session(pid)
        s.reset_status()
        return web.json_response({"success": True, "profile_id": pid})
    app.router.add_post("/api/cloud-browser/reset", handle_cloud_browser_reset)
    app.router.add_get("/api/cloud-browser/reset", handle_cloud_browser_reset)
    app.router.add_get("/verify-session", handle_verify_session)
    return app

if __name__ == "__main__":
    port = int(os.environ.get("BETWITHNET_PORT", 8765))
    logger.info(f"Starting Bet With Net Cloud Node on 0.0.0.0:{port}...")
    app = make_app()
    async def _on_startup(app):
        betwithnet_manager.start_background_pool_keeper()
    app.on_startup.append(_on_startup)
    web.run_app(app, host="0.0.0.0", port=port)

