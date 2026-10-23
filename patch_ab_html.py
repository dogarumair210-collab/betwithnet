def patch_andarbahar():
    path = '/home/betwithnet.com/public_html/games/andarbahar.html'
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Add back button style
    style_target = ".game-iframe {"
    style_add = """        .bwn-back-lobby {
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 999999;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            border-radius: 20px;
            background: rgba(18, 20, 28, 0.85);
            border: 1px solid rgba(255, 215, 0, 0.5);
            color: #ffd700;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
            transition: transform 0.15s ease, background 0.15s ease;
            cursor: pointer;
        }
        .bwn-back-lobby:hover {
            background: rgba(35, 30, 14, 0.95);
            transform: translateY(-1px);
        }
        @media (max-width: 768px) {
            .bwn-back-lobby {
                top: 8px;
                left: 8px;
                padding: 5px 11px;
                font-size: 11px;
            }
        }
        .game-iframe {"""

    if style_target in code and '.bwn-back-lobby' not in code:
        code = code.replace(style_target, style_add)

    # Add back button HTML
    body_target = "<body>"
    body_add = """<body>
    <a href="/casino.html" class="bwn-back-lobby">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Lobby
    </a>"""
    if body_target in code and 'class="bwn-back-lobby"' not in code:
        code = code.replace(body_target, body_add)

    # Update cache buster
    code = code.replace('v=20261009_multiplayer_sync1', 'v=20261009_v2')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Successfully patched andarbahar.html")

patch_andarbahar()
