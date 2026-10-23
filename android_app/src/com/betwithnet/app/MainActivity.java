package com.betwithnet.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {

    private static final String APP_URL = "https://betwithnet.com/";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView webView;
    private ProgressBar progressBar;
    private View splashContainer;
    private ProgressBar yellowLoadingBar;
    private TextView splashLoadingText;
    private LinearLayout errorLayout;
    private Button btnRetry;

    private ValueCallback<Uri[]> fileUploadCallback;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean isFinishedLoading = false;
    private int simulatedProgress = 30;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware Acceleration on Window for 60-120fps GPU Rendering
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        setContentView(R.layout.activity_main);

        // Dark theme status & navigation bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(0xFF060207);
            getWindow().setNavigationBarColor(0xFF060207);
        }

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        splashContainer = findViewById(R.id.splashContainer);
        yellowLoadingBar = findViewById(R.id.yellowLoadingBar);
        splashLoadingText = findViewById(R.id.splashLoadingText);
        errorLayout = findViewById(R.id.errorLayout);
        btnRetry = findViewById(R.id.btnRetry);

        if (splashContainer != null) {
            splashContainer.setClickable(false);
            splashContainer.setFocusable(false);
        }

        if (yellowLoadingBar != null) {
            yellowLoadingBar.setProgress(30);
        }

        startFastLoading();

        // Safety watchdog: ensure splash ALWAYS disappears and unblocks within 2.0 seconds
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                completeLoadingAndHideSplash();
            }
        }, 2000);

        btnRetry.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                isFinishedLoading = false;
                simulatedProgress = 30;
                if (yellowLoadingBar != null) {
                    yellowLoadingBar.setProgress(30);
                }
                if (splashLoadingText != null) {
                    splashLoadingText.setText("LOADING VIP CASINO...");
                }
                if (splashContainer != null) {
                    splashContainer.setAlpha(1f);
                    splashContainer.setVisibility(View.VISIBLE);
                }
                startFastLoading();
                webView.reload();
            }
        });

        setupWebView();
        webView.clearCache(true);
        webView.loadUrl(APP_URL);
    }

    private void startFastLoading() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isFinishedLoading) return;
                if (simulatedProgress < 90) {
                    simulatedProgress += 20;
                    if (simulatedProgress > 90) simulatedProgress = 90;
                    updateYellowBar(simulatedProgress);
                    handler.postDelayed(this, 60);
                }
            }
        }, 60);
    }

    private void updateYellowBar(int progress) {
        if (yellowLoadingBar != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                yellowLoadingBar.setProgress(progress, true);
            } else {
                yellowLoadingBar.setProgress(progress);
            }
        }
        if (splashLoadingText != null && !isFinishedLoading) {
            splashLoadingText.setText("LOADING VIP CASINO " + progress + "%");
        }
    }

    private void completeLoadingAndHideSplash() {
        if (isFinishedLoading) return;
        isFinishedLoading = true;
        updateYellowBar(100);

        if (splashLoadingText != null) {
            splashLoadingText.setText("WELCOME TO BET WITH NET");
        }

        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (splashContainer != null) {
                    splashContainer.animate()
                        .alpha(0f)
                        .setDuration(150)
                        .withEndAction(new Runnable() {
                            @Override
                            public void run() {
                                if (splashContainer != null) {
                                    splashContainer.setVisibility(View.GONE);
                                    if (splashContainer.getParent() instanceof ViewGroup) {
                                        ((ViewGroup) splashContainer.getParent()).removeView(splashContainer);
                                    }
                                }
                            }
                        });
                }
            }
        }, 50);
    }

    private void setupWebView() {
        // Zero-Lag Native Direct Composition & Native Smooth Scrolling
        webView.setLayerType(View.LAYER_TYPE_NONE, null);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setVerticalScrollBarEnabled(true);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setFadingEdgeLength(0);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // High-Performance Native Cache Engine
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setLoadsImagesAutomatically(true);

        // Pre-raster offscreen contents for butter-smooth 60-120fps scrolling
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setOffscreenPreRaster(true);
        }

        // Custom User-Agent tag to detect native app inside JavaScript
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " BetWithNetApp/1.5");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            settings.setMediaPlaybackRequiresUserGesture(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    return handleUrl(view, request.getUrl().toString());
                }
                return false;
            }

            private boolean handleUrl(WebView view, String url) {
                if (url == null) return false;
                if (url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("tg:") || 
                    url.startsWith("mailto:") || url.startsWith("intent:") ||
                    url.contains("whatsapp.com") || url.contains("wa.me") || url.contains("t.me")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return true;
                    }
                }
                if (url.contains("betwithnet.com") || url.startsWith("file://")) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                completeLoadingAndHideSplash();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    CookieManager.getInstance().flush();
                }
                // Automatic non-stop BGM & sanitize removed payment numbers
                view.evaluateJavascript("try { if (window.core && window.core.sanitizePaymentNumbers) window.core.sanitizePaymentNumbers(); if (typeof selectGateway === 'function' && window.currentGw) selectGateway(window.currentGw); if (window.sound && !window.location.pathname.includes('/games/')) { window.sound.muted = false; window.sound.startCasinoThemeBGM(); } } catch(e) {}", null);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    if (request.isForMainFrame()) {
                        showError();
                    }
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                showError();
            }

            private void showError() {
                isFinishedLoading = true;
                progressBar.setVisibility(View.GONE);
                if (splashContainer != null) {
                    splashContainer.setVisibility(View.GONE);
                }
                webView.setVisibility(View.GONE);
                errorLayout.setVisibility(View.VISIBLE);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress > simulatedProgress) {
                    simulatedProgress = newProgress;
                    updateYellowBar(newProgress);
                }
                if (newProgress >= 60) {
                    completeLoadingAndHideSplash();
                    view.evaluateJavascript("try { if (window.sound && !window.location.pathname.includes('/games/')) { window.sound.muted = false; window.sound.startCasinoThemeBGM(); } } catch(e) {}", null);
                }
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");

                try {
                    startActivityForResult(Intent.createChooser(intent, "Select Picture / Receipt"), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (fileUploadCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
