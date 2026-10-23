def fix_index():
    path = '/home/betwithnet.com/public_html/games/ab_engine/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Restore index.html from backup to have clean file
    with open('/home/betwithnet.com/public_html/games/ab_engine/index.html.bak', 'r', encoding='utf-8') as f_bak:
        c = f_bak.read()

    # 1. Add 'andar-bahar_do_not_show_game_rule_at_startup' to localStorage
    t1 = "localStorage.setItem('isSoundMuted', 'false');"
    r1 = """localStorage.setItem('isSoundMuted', 'false');
        localStorage.setItem('andar-bahar_do_not_show_game_rule_at_startup', 'true');"""
    if t1 in c:
        c = c.replace(t1, r1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Cleaned and set startup rule in index.html")

fix_index()
