package com.lockwatch.student

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var securityModule: LockWatchAndroidSecurityModule
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Dark theme system bar configuration
        window.statusBarColor = Color.parseColor("#0a0d14")
        window.navigationBarColor = Color.parseColor("#0a0d14")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true)
        }

        securityModule = LockWatchAndroidSecurityModule(this) { this }

        WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#0a0d14"))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.allowFileAccessFromFileURLs = true
            settings.allowUniversalAccessFromFileURLs = true
            settings.databaseEnabled = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    val msg = "[${consoleMessage?.messageLevel()}] ${consoleMessage?.message()} (${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()})"
                    Log.i("LockWatchJS", msg)
                    println("LockWatchJS: $msg")
                    return true
                }
            }

            webViewClient = object : WebViewClient() {
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    Log.e(
                        "LockWatchWebView",
                        "Error loading ${request?.url}: ${error?.description} (code ${error?.errorCode})"
                    )
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d("LockWatchWebView", "Page finished loading: $url")
                }
            }

            addJavascriptInterface(
                NativeSecurityBridge(this@MainActivity, securityModule),
                "LockWatchNativeSecurity"
            )
        }

        setContentView(webView)

        try {
            val htmlContent = assets.open("www/index.html").bufferedReader().use { it.readText() }
            Log.d("LockWatchWebView", "Loaded index.html from assets, byte count: ${htmlContent.length}")
            webView.loadDataWithBaseURL("https://lockwatch.app/", htmlContent, "text/html", "UTF-8", null)
        } catch (e: Exception) {
            Log.e("LockWatchWebView", "Failed to load index.html via loadDataWithBaseURL, falling back to file URL", e)
            webView.loadUrl("file:///android_asset/www/index.html")
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    class NativeSecurityBridge(
        private val activity: Activity,
        private val securityModule: LockWatchAndroidSecurityModule
    ) {

        @JavascriptInterface
        fun checkCapabilities(): String {
            val caps = securityModule.checkCapabilities()
            return JSONObject(caps).toString()
        }

        @JavascriptInterface
        fun verifyReadiness(): String {
            val ready = securityModule.verifyReadiness()
            val json = JSONObject()
            json.put("isReady", ready)
            if (!ready) {
                json.put("problem", "Android device is not provisioned as a managed Device Owner.")
            }
            return json.toString()
        }

        @JavascriptInterface
        fun startLock(): String {
            var success = false
            var errorMsg: String? = null
            val latch = CountDownLatch(1)

            activity.runOnUiThread {
                try {
                    success = securityModule.startLock(activity)
                } catch (e: Exception) {
                    errorMsg = e.message
                } finally {
                    latch.countDown()
                }
            }

            try {
                latch.await(3, TimeUnit.SECONDS)
            } catch (e: InterruptedException) {
                errorMsg = "Lock request timed out"
            }

            val json = JSONObject()
            json.put("success", success)
            if (!success) {
                json.put("error", errorMsg ?: "Failed to engage Android Lock Task mode.")
            }
            return json.toString()
        }

        @JavascriptInterface
        fun stopLock(): String {
            var success = false
            val latch = CountDownLatch(1)

            activity.runOnUiThread {
                try {
                    success = securityModule.stopLock(activity)
                } catch (e: Exception) {
                    // Ignored
                } finally {
                    latch.countDown()
                }
            }

            try {
                latch.await(3, TimeUnit.SECONDS)
            } catch (e: InterruptedException) {
                // Timeout
            }

            val json = JSONObject()
            json.put("success", success)
            return json.toString()
        }

        @JavascriptInterface
        fun getSecurityStatus(): String {
            val status = securityModule.getSecurityStatus()
            return JSONObject(status).toString()
        }

        @JavascriptInterface
        fun enterEmergency(durationSeconds: Int): String {
            var success = false
            val latch = CountDownLatch(1)

            activity.runOnUiThread {
                try {
                    success = securityModule.enterEmergency(activity, durationSeconds)
                } catch (e: Exception) {
                    // Ignored
                } finally {
                    latch.countDown()
                }
            }

            try {
                latch.await(3, TimeUnit.SECONDS)
            } catch (e: InterruptedException) {
                // Timeout
            }

            val json = JSONObject()
            json.put("success", success)
            return json.toString()
        }

        @JavascriptInterface
        fun exitEmergency(): String {
            var success = false
            val latch = CountDownLatch(1)

            activity.runOnUiThread {
                try {
                    success = securityModule.exitEmergency(activity)
                } catch (e: Exception) {
                    // Ignored
                } finally {
                    latch.countDown()
                }
            }

            try {
                latch.await(3, TimeUnit.SECONDS)
            } catch (e: InterruptedException) {
                // Timeout
            }

            val json = JSONObject()
            json.put("success", success)
            return json.toString()
        }
    }
}
