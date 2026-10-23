$askpass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askpass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$py = @'
import sqlite3
conn = sqlite3.connect("/opt/betwithnet_node/orders.db")
print("RUNNING ORDERS:")
for row in conn.execute("SELECT order_id, total_sessions, duration_sec, concurrent_workers, status, completed FROM orders WHERE status='RUNNING'").fetchall():
    print(" ", row)

print("\nCURRENT TEST SPEED OF ACTIVE PROXIES TO TARGET PAKINVEST.SHOP:")
import urllib.request, time
proxies = conn.execute("SELECT proxy, ip, speed_ms, country FROM verified_proxy_pool ORDER BY speed_ms ASC LIMIT 8").fetchall()
conn.close()

for p, ip, sp, c in proxies:
    t0 = time.time()
    try:
        req = urllib.request.Request("https://pakinvest.shop", headers={"User-Agent": "Mozilla/5.0"})
        ph = urllib.request.ProxyHandler({'http': p, 'https': p})
        opener = urllib.request.build_opener(ph)
        resp = opener.open(req, timeout=5)
        dt = int((time.time() - t0) * 1000)
        print(f"  [OK] {ip} ({c}) - {dt}ms to target site (status {resp.status})")
    except Exception as e:
        print(f"  [FAIL] {ip} ({c}) - Error to target site: {e}")
'@

$b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($py))
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "echo $b64 | base64 -d | python3"
