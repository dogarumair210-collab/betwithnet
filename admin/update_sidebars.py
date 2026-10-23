import glob
import re

admin_dir = "/home/betwithnet.com/public_html/admin"
html_files = glob.glob(f"{admin_dir}/*.html")

wa_sidebar_item = '''            <li class="sidebar-item">
                <a href="whatsapp.html" class="sidebar-link {active_class}">
                    <div class="sidebar-link-content">
                        <span class="sidebar-link-icon" style="color:#25D366;">💬</span>
                        <span style="font-weight:700;">WhatsApp Group Link</span>
                    </div>
                    <span class="sidebar-badge badge-success" style="background:#25D366; color:#000; font-weight:800; font-size:10px; padding:2px 6px; border-radius:4px;">LIVE</span>
                </a>
            </li>
'''

for filepath in html_files:
    filename = filepath.split('/')[-1]
    if filename in ['whatsapp.html', 'login.html']:
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already added
    if 'href="whatsapp.html"' in content:
        print(f"Skipping {filename}, already has whatsapp link")
        continue

    # Insert before or after site-settings.html
    # Look for site-settings.html pattern
    pattern = re.compile(r'(<li class="sidebar-item">\s*<a href="site-settings\.html"[^>]*>[\s\S]*?</li>)', re.MULTILINE)
    
    if pattern.search(content):
        item_to_insert = wa_sidebar_item.replace('{active_class}', '')
        # Insert right before site-settings.html
        new_content = pattern.sub(f'{item_to_insert}\\1', content, count=1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated sidebar in {filename}")
    else:
        print(f"Could not find site-settings.html in {filename}")

print("Sidebar update complete!")
