window.boot = function () {
    if (iOS()) cc.sys.isMobile = true;
    window.isIOSOver14Device = cc.sys.os === cc.sys.OS_IOS && cc.sys.isBrowser && cc.sys.isMobile && /iPhone OS (?=14|15)/.test(window.navigator.userAgent);
    if (isIOSOver14Device) {    cc.MeshBuffer.prototype.checkAndSwitchBuffer = function (vertexCount) {        if (this.vertexOffset + vertexCount > 65535) {            this.uploadData();            this._batcher._flush();        }    };    cc.MeshBuffer.prototype.forwardIndiceStartToOffset = function () {        this.uploadData();        this.switchBuffer();    };}
    
    // 在正式執行boot之前先preboot
    window.dispatchEvent(
        new CustomEvent('preboot', {
            bubbles: true,
            detail: {}
        }
    ));
    
    var settings = window._CCSettings;
    var splash_status = window._SplashStatus;
    window._CCSettings = undefined;
    
    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay () {
        if (typeof splash_status == 'undefined') return;
        // Loading splash scene
        var splash = splash_status['obj'];
        splash.sceneLaunched = false;   // cocos 場景是否載入完成
        let audio_source;
        //--- 場景 load 完後觸發 ---
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            if (!splash.sceneLaunched) splash.sceneLaunched = true;
            if (splash_status['ended']() === true){
                splash_status['fadeOut']();
                audio_source = cc.Canvas.instance.node.getComponentInChildren(cc.AudioSource);
                if (audio_source) {
                    audio_source.resume();
                    audio_source = undefined;
                }
            }
        });
        //--- 影片播放完畢 ＆ Cocos 場景載入完畢 ---
        if (splash_status['ended']() && splash.sceneLaunched === true){ 
            splash_status['fadeOut']();
        }
        //--- 僅影片播放完畢 ---
        if (splash_status['ended']()) return;
        //--- 等待影片播放完畢後判斷 ---
        var splash_loader = splash_status['load_obj'];
        if (!splash_status['is_video_type']){
            splash_loader._onloadEvents.push(function(){
                if (splash.sceneLaunched === true){
                    splash_status['fadeOut']();
                    audio_source = cc.Canvas.instance.node.getComponentInChildren(cc.AudioSource);
                    if (audio_source) {
                        audio_source.resume();
                        audio_source = undefined;
                    }
                }
            });
            return;
        }
        splash_loader.addOnceEventListener('ended', function (e) {
            if (splash.sceneLaunched === true){
                splash_status['fadeOut']();
                audio_source = cc.Canvas.instance.node.getComponentInChildren(cc.AudioSource);
                if (audio_source) {
                    audio_source.resume();
                    audio_source = undefined;
                }
            }
        });
    }

    var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        function loadScene(launchScene) {
            setLoadingDisplay();
            var splash = splash_status['obj'];
            var progressBar = splash.querySelector('.progress-bar span');
            progressBar.style.width = '0%';
            progressBar.isFinish = false;
            // 預先載入場景
            cc.director.preloadScene(launchScene, 
                function (completedCount, totalCount, item) {
                    if (progressBar && !progressBar.isFinish) {
                        var percent = 100 * completedCount / totalCount;
                        if (percent < 99.9) progressBar.style.width = percent.toFixed(2) + '%';
                        else {
                            let progressBarDiv = splash.querySelector('.progress-bar');
                            progressBar.style.width = '100%';
                            progressBar.isFinish = true;
                            fadeOut(progressBarDiv, 0.5, 0.05);
                        }
                    }
                },
                function () {
                    // 預載完成後，在執行載入場景
                    cc.director.loadScene(launchScene, null, function(){
                        if (cc.sys.isBrowser) {
                            // show canvas
                            var canvas = document.getElementById('GameCanvas');
                            canvas.style.visibility = '';
                            var div = document.getElementById('GameDiv');
                            if (div) {
                                div.style.backgroundImage = '';
                            }
                        }
                        cc.loader.onProgress = null;
                        console.log('Success to load scene: ' + launchScene);
                        
                        // 場景載入完成
                        window.dispatchEvent(
                            new CustomEvent('scene-loaded', {
                                bubbles: true,
                                detail: {}
                            }
                        ));
                    });
                }
            );

        }

        var launchScene = settings.launchScene;

        // load scene
        loadScene(launchScene);

    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({ 
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });
    
    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb (err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) {
                    cc.game.run(option, onStart);
                }
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }

    if (!window.config || (window.config && window.config['env'] != "production")) {
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            const RootNode = cc.Canvas.instance.node.parent;
            const findchildren = (node, nodeKey="") => {
                let childsPairs = node.children.reduce((obj, cur)=>{
                    let newKey = `${nodeKey}/${cur.name}`;
                    obj.push({key: newKey, node: cur});
                    if (cur.childrenCount > 0) {
                        let n = findchildren(cur, newKey);
                        obj = obj.concat(n);
                    }
                    return obj;
                }, []);
                return childsPairs;
            };
            let __all_node = {};
            findchildren(RootNode, RootNode.name).forEach(({key, node}, i) => {
                __all_node[`${i} ${key}`] = node;
            });
            window.__all_node = __all_node;
        });
    }
};