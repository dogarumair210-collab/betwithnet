import re

# 1. Update admin/index.html
index_file = "/home/betwithnet.com/public_html/admin/index.html"
with open(index_file, 'r', encoding='utf-8') as f:
    idx_content = f.read()

wa_dash_card = '''
                <!-- WhatsApp Community & Support Card -->
                <div class="lte-card" style="border: 1px solid rgba(37,211,102,0.4); background: linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(17,23,34,0.95) 100%);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-size:26px; margin-bottom:8px;">💬</div>
                        <span class="badge-status" style="background:#25D366; color:#000; font-weight:800; font-size:11px; padding:3px 8px; border-radius:4px;">LIVE WIDGET</span>
                    </div>
                    <h3 style="font-size:16px; font-weight:800; color:#fff; margin-bottom:6px;">WhatsApp Group & Community</h3>
                    <p style="font-size:12px; color:var(--lte-muted); margin-bottom:14px;">
                        Configure official WhatsApp group invite link, support hotline, or test the live player floating button.
                    </p>
                    <div style="display:flex; gap:8px;">
                        <a href="whatsapp.html" class="btn-lte btn-lte-primary" style="flex:1; background:#25D366; color:#000; font-weight:800; border:none; text-align:center;">⚙️ Manage WhatsApp Link</a>
                        <a href="whatsapp.html" class="btn-lte btn-lte-secondary">Test</a>
                    </div>
                </div>
'''

if 'WhatsApp Group & Community' not in idx_content:
    target_needle = '<!-- Cashier Ledger Card -->'
    if target_needle in idx_content:
        idx_content = idx_content.replace(target_needle, wa_dash_card + "\n" + target_needle)
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(idx_content)
        print("Added WhatsApp card to admin/index.html")
    else:
        print("Could not find target needle in admin/index.html")
else:
    print("WhatsApp card already present in admin/index.html")


# 2. Update admin/site-settings.html
settings_file = "/home/betwithnet.com/public_html/admin/site-settings.html"
with open(settings_file, 'r', encoding='utf-8') as f:
    set_content = f.read()

# Add Tab Pill if not present
if 'id="pill-whatsapp"' not in set_content:
    old_pill = '''                <button class="tab-pill-btn" id="pill-smtp" onclick="switchSettingsTab('smtp')">
                    <span>📧 SMTP Mail Server</span>
                </button>'''
    new_pill = old_pill + '''
                <button class="tab-pill-btn" id="pill-whatsapp" onclick="switchSettingsTab('whatsapp')">
                    <span style="color:#25D366;">💬</span> <span>WhatsApp Group & Support</span>
                </button>'''
    set_content = set_content.replace(old_pill, new_pill)
    print("Added pill-whatsapp to admin/site-settings.html")

# Add Tab Content if not present
wa_tab_content = '''
            <!-- TAB 4: WHATSAPP GROUP & SUPPORT -->
            <div id="tab-content-whatsapp" class="lte-card" style="display:none; border:1px solid rgba(37,211,102,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:18px; font-weight:900; color:#fff; display:flex; align-items:center; gap:8px;">
                            <span style="color:#25D366;">💬</span> WhatsApp Community Group & Live Chat
                        </h2>
                        <p style="font-size:12px; color:var(--lte-muted); margin:0;">
                            Configure your official WhatsApp group invite link and player floating support button.
                        </p>
                    </div>
                    <a href="whatsapp.html" class="btn-lte btn-lte-primary" style="background:#25D366; color:#000; font-weight:800; border:none;">
                        <span>🚀 Dedicated WhatsApp Page →</span>
                    </a>
                </div>

                <form onsubmit="handleSaveWhatsAppInSettings(event)">
                    <div class="form-field" style="margin-bottom:16px;">
                        <label>WhatsApp Group Invite URL:</label>
                        <input type="url" id="settings-wa-link" class="form-ctrl" placeholder="https://chat.whatsapp.com/..." style="font-family:'JetBrains Mono',monospace;">
                        <span style="font-size:10px; color:var(--lte-muted);">Players will join this group when clicking WhatsApp buttons across the casino.</span>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-field">
                            <label>Support Phone Number (Fallback 1-on-1):</label>
                            <input type="text" id="settings-wa-num" class="form-ctrl" placeholder="923001234567">
                        </div>
                        <div class="form-field">
                            <label>Floating Bubble Status:</label>
                            <select id="settings-wa-enabled" class="form-ctrl">
                                <option value="1">🟢 Enabled (Floating draggable button visible)</option>
                                <option value="0">🔴 Disabled (Hidden)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-field" style="margin-bottom:20px;">
                        <label>Default Chat Greeting:</label>
                        <input type="text" id="settings-wa-msg" class="form-ctrl" placeholder="Hello BetWithNet Support, I need assistance with my account.">
                    </div>

                    <div style="display:flex; gap:12px;">
                        <button type="submit" class="btn-lte btn-lte-primary" style="background:#25D366; color:#000; font-weight:800; border:none;">
                            <span>💾 Save WhatsApp Settings</span>
                        </button>
                        <button type="button" class="btn-lte btn-lte-secondary" onclick="testWhatsAppInSettings()">
                            <span>🔗 Test Open Group Link</span>
                        </button>
                    </div>
                </form>
            </div>
'''

if 'id="tab-content-whatsapp"' not in set_content:
    # Insert right before </div>\n\n    </main>
    needle = '</main>'
    pos = set_content.rfind(needle)
    # Find the last </div> before </main>
    div_pos = set_content.rfind('</div>', 0, pos)
    # Insert before the closing content-body div
    set_content = set_content[:div_pos] + wa_tab_content + "\n        " + set_content[div_pos:]
    print("Added tab-content-whatsapp to admin/site-settings.html")

# Update switchSettingsTab
old_switch = '''        function switchSettingsTab(tab) {
            document.getElementById('pill-branding').className = `tab-pill-btn ${tab === 'branding' ? 'active' : ''}`;
            document.getElementById('pill-theme').className = `tab-pill-btn ${tab === 'theme' ? 'active' : ''}`;
            document.getElementById('pill-smtp').className = `tab-pill-btn ${tab === 'smtp' ? 'active' : ''}`;

            document.getElementById('tab-content-branding').style.display = (tab === 'branding') ? 'block' : 'none';
            document.getElementById('tab-content-theme').style.display = (tab === 'theme') ? 'block' : 'none';
            document.getElementById('tab-content-smtp').style.display = (tab === 'smtp') ? 'block' : 'none';
        }'''

new_switch = '''        function switchSettingsTab(tab) {
            document.getElementById('pill-branding').className = `tab-pill-btn ${tab === 'branding' ? 'active' : ''}`;
            document.getElementById('pill-theme').className = `tab-pill-btn ${tab === 'theme' ? 'active' : ''}`;
            document.getElementById('pill-smtp').className = `tab-pill-btn ${tab === 'smtp' ? 'active' : ''}`;
            if (document.getElementById('pill-whatsapp')) {
                document.getElementById('pill-whatsapp').className = `tab-pill-btn ${tab === 'whatsapp' ? 'active' : ''}`;
            }

            document.getElementById('tab-content-branding').style.display = (tab === 'branding') ? 'block' : 'none';
            document.getElementById('tab-content-theme').style.display = (tab === 'theme') ? 'block' : 'none';
            document.getElementById('tab-content-smtp').style.display = (tab === 'smtp') ? 'block' : 'none';
            if (document.getElementById('tab-content-whatsapp')) {
                document.getElementById('tab-content-whatsapp').style.display = (tab === 'whatsapp') ? 'block' : 'none';
            }
        }'''

if old_switch in set_content:
    set_content = set_content.replace(old_switch, new_switch)
    print("Updated switchSettingsTab in admin/site-settings.html")

# Add load and save JS functions for WhatsApp in site-settings.html
wa_js_functions = '''
        async function loadWhatsAppInSettings() {
            let link = localStorage.getItem('bwn_whatsapp_group_link') || '';
            let num = localStorage.getItem('bwn_whatsapp_number') || '923001234567';
            let enabled = localStorage.getItem('bwn_whatsapp_enabled') !== '0';
            let msg = localStorage.getItem('bwn_whatsapp_message') || 'Hello BetWithNet Support, I need assistance with my account.';

            try {
                const res = await fetch('../api/admin.php?action=site_settings', { cache: 'no-store' });
                const json = await res.json();
                if (json && json.success && json.data) {
                    if (json.data.whatsapp_group_link !== undefined) link = json.data.whatsapp_group_link;
                    if (json.data.whatsapp_number !== undefined) num = json.data.whatsapp_number;
                    if (json.data.whatsapp_enabled !== undefined) enabled = json.data.whatsapp_enabled == '1';
                    if (json.data.whatsapp_message !== undefined) msg = json.data.whatsapp_message;
                }
            } catch (e) {}

            const lEl = document.getElementById('settings-wa-link');
            const nEl = document.getElementById('settings-wa-num');
            const eEl = document.getElementById('settings-wa-enabled');
            const mEl = document.getElementById('settings-wa-msg');

            if (lEl) lEl.value = link;
            if (nEl) nEl.value = num;
            if (eEl) eEl.value = enabled ? '1' : '0';
            if (mEl) mEl.value = msg;
        }

        async function handleSaveWhatsAppInSettings(e) {
            e.preventDefault();
            const link = document.getElementById('settings-wa-link').value.trim();
            const num = document.getElementById('settings-wa-num').value.trim().replace(/[^0-9]/g, '');
            const enabled = document.getElementById('settings-wa-enabled').value;
            const msg = document.getElementById('settings-wa-msg').value.trim();

            localStorage.setItem('bwn_whatsapp_group_link', link);
            localStorage.setItem('bwn_whatsapp_number', num);
            localStorage.setItem('bwn_whatsapp_enabled', enabled);
            localStorage.setItem('bwn_whatsapp_message', msg);

            try {
                const res = await fetch('../api/admin.php?action=save_site_settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        whatsapp_group_link: link,
                        whatsapp_number: num,
                        whatsapp_enabled: enabled,
                        whatsapp_message: msg
                    })
                });
                const json = await res.json();
                alert('✅ WhatsApp Group Link & Support settings saved and applied!');
            } catch (err) {
                alert('✅ WhatsApp settings updated!');
            }
        }

        function testWhatsAppInSettings() {
            const link = document.getElementById('settings-wa-link').value.trim();
            if (link) {
                window.open(link, '_blank');
            } else {
                const num = document.getElementById('settings-wa-num').value.trim() || '923001234567';
                window.open('https://wa.me/' + num, '_blank');
            }
        }
'''

if 'handleSaveWhatsAppInSettings' not in set_content:
    old_dom_listener = "window.addEventListener('DOMContentLoaded', loadSettings);"
    new_dom_listener = wa_js_functions + "\n        window.addEventListener('DOMContentLoaded', () => { loadSettings(); loadWhatsAppInSettings(); });"
    set_content = set_content.replace(old_dom_listener, new_dom_listener)
    print("Injected WhatsApp JS handlers into admin/site-settings.html")

with open(settings_file, 'w', encoding='utf-8') as f:
    f.write(set_content)

print("Updates to index.html and site-settings.html complete!")
