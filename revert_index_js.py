def revert_index_js():
    path = '/home/betwithnet.com/public_html/games/ab_engine/assets/main/index.js'
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    bad = 'try{if(!window.__bwn_auto_entered&&t&&t.length>0){window.__bwn_auto_entered=!0;setTimeout(function(){try{if(s.default.Instance.mainUIManager.getCurrentNameUI()==="lobby"){e.onItemLobbyClicked(t[0]);}}catch(err){}},300);}}catch(err){}}'
    if bad in code:
        code = code.replace(bad, '')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print("Successfully removed auto_entered from index.js")
    else:
        print("auto_entered snippet not found in index.js")

revert_index_js()
