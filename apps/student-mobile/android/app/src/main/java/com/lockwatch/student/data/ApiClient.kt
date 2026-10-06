package com.lockwatch.student.data

import android.content.Context
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.UUID
import java.util.concurrent.TimeUnit

class StudentApiClient(private val context: Context) {

    companion object {
        const val BASE_URL = "https://lockwatch.onrender.com"
        const val WS_URL = "wss://lockwatch.onrender.com/ws"
        private val JSON = "application/json; charset=utf-8".toMediaType()
        private const val PREFS_NAME = "lockwatch_student_prefs"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
    }

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private var activeWebSocket: WebSocket? = null

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS_TOKEN, null)
        set(value) {
            prefs.edit().putString(KEY_ACCESS_TOKEN, value).apply()
        }

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH_TOKEN, null)
        set(value) {
            prefs.edit().putString(KEY_REFRESH_TOKEN, value).apply()
        }

    fun clearTokens() {
        prefs.edit().remove(KEY_ACCESS_TOKEN).remove(KEY_REFRESH_TOKEN).apply()
    }

    val isAuthenticated: Boolean
        get() = !accessToken.isNullOrBlank()

    private suspend fun executeRequest(request: Request): JSONObject = withContext(Dispatchers.IO) {
        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: "{}"
        if (!response.isSuccessful) {
            val errMsg = try {
                JSONObject(responseBody).optString("message", "HTTP error ${response.code}")
            } catch (e: Exception) {
                "HTTP error ${response.code}"
            }
            throw IOException(errMsg)
        }
        JSONObject(responseBody)
    }

    private suspend fun executeArrayRequest(request: Request): JSONArray = withContext(Dispatchers.IO) {
        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: "[]"
        if (!response.isSuccessful) {
            throw IOException("HTTP error ${response.code}")
        }
        JSONArray(responseBody)
    }

    private fun newRequestBuilder(endpoint: String): Request.Builder {
        val url = if (endpoint.startsWith("http")) endpoint else "$BASE_URL$endpoint"
        val builder = Request.Builder().url(url)
        accessToken?.let {
            builder.addHeader("Authorization", "Bearer $it")
        }
        return builder
    }

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    suspend fun login(identifier: String, pass: String, institutionCode: String = "TECH-UNI"): User = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            val isPhone = identifier.matches(Regex("^[+]?[0-9\\s-]{7,15}$"))
            if (isPhone) {
                put("phoneNumber", identifier.trim())
            } else {
                put("registerNumber", identifier.trim())
            }
            put("password", pass)
            put("institutionCode", institutionCode)
        }

        val request = Request.Builder()
            .url("$BASE_URL/auth/student/login")
            .post(json.toString().toRequestBody(JSON))
            .build()

        val resp = executeRequest(request)
        accessToken = resp.getString("accessToken")
        refreshToken = resp.optString("refreshToken", null)

        val uObj = resp.getJSONObject("user")
        parseUser(uObj)
    }

    suspend fun requestSignupOtp(phoneNumber: String): Pair<String, String?> = withContext(Dispatchers.IO) {
        val json = JSONObject().apply { put("phoneNumber", phoneNumber) }
        val req = Request.Builder()
            .url("$BASE_URL/auth/student/request-signup-otp")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        val challengeId = resp.getString("challengeId")
        val debugOtp = if (resp.has("debugOtp")) resp.getString("debugOtp") else null
        Pair(challengeId, debugOtp)
    }

    suspend fun verifySignupOtp(challengeId: String, otp: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("challengeId", challengeId)
            put("otp", otp)
        }
        val req = Request.Builder()
            .url("$BASE_URL/auth/student/verify-signup-otp")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        resp.getString("verificationToken")
    }

    suspend fun createAccount(
        verificationToken: String,
        password: String,
        name: String,
        registerNumber: String,
        institutionCode: String = "TECH-UNI"
    ): User = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("verificationToken", verificationToken)
            put("password", password)
            put("name", name)
            put("registerNumber", registerNumber)
            put("institutionCode", institutionCode)
        }
        val req = Request.Builder()
            .url("$BASE_URL/auth/student/create-account")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        accessToken = resp.getString("accessToken")
        refreshToken = resp.optString("refreshToken", null)
        parseUser(resp.getJSONObject("user"))
    }

    suspend fun getProfile(): User = withContext(Dispatchers.IO) {
        val req = newRequestBuilder("/students/me").get().build()
        val resp = executeRequest(req)
        parseUser(resp.getJSONObject("user"))
    }

    // ==========================================
    // ACADEMIC CLASSES
    // ==========================================

    suspend fun getClasses(): List<AcademicClass> = withContext(Dispatchers.IO) {
        val req = newRequestBuilder("/students/classes").get().build()
        val arr = executeArrayRequest(req)
        val list = mutableListOf<AcademicClass>()
        for (i in 0 until arr.length()) {
            val item = arr.getJSONObject(i)
            val cObj = item.getJSONObject("class")
            val sessObj = item.optJSONObject("activeSession")

            val activeSess = if (sessObj != null) {
                SessionSummary(
                    id = sessObj.getString("id"),
                    classId = sessObj.getString("classId"),
                    name = sessObj.getString("name"),
                    status = sessObj.getString("status"),
                    durationMinutes = sessObj.optInt("durationMinutes", 60),
                    joinCode = sessObj.optString("joinCode", null),
                    startsAt = sessObj.optString("startsAt", null),
                    endsAt = sessObj.optString("endsAt", null)
                )
            } else null

            list.add(
                AcademicClass(
                    id = cObj.getString("id"),
                    name = cObj.getString("name"),
                    subject = cObj.optString("subject", ""),
                    department = cObj.optString("department", ""),
                    year = cObj.optString("year", ""),
                    semester = cObj.optString("semester", ""),
                    section = cObj.optString("section", ""),
                    classCode = cObj.getString("classCode"),
                    isActive = cObj.optBoolean("isActive", true),
                    activeSession = activeSess
                )
            )
        }
        list
    }

    suspend fun joinClassByCode(code: String, displayName: String?, regNumber: String?, deviceId: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("classCode", code)
            displayName?.let { put("displayName", it) }
            regNumber?.let { put("registerNumber", it) }
            put("deviceId", deviceId)
        }
        val req = newRequestBuilder("/students/classes/join-code")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        resp.optString("message", "Successfully enrolled in class")
    }

    suspend fun joinClassByQr(token: String, displayName: String?, regNumber: String?, deviceId: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("qrToken", token)
            displayName?.let { put("displayName", it) }
            regNumber?.let { put("registerNumber", it) }
            put("deviceId", deviceId)
        }
        val req = newRequestBuilder("/students/classes/join-qr")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        resp.optString("message", "Successfully joined via QR")
    }

    // ==========================================
    // EXAMINATION SESSIONS
    // ==========================================

    suspend fun joinSession(joinCode: String, deviceId: String): Pair<SessionSummary, SessionParticipant> = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("joinCode", joinCode)
            put("deviceId", deviceId)
        }
        val req = newRequestBuilder("/sessions/$joinCode/join")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        val sObj = resp.getJSONObject("session")
        val pObj = resp.getJSONObject("participant")

        val sess = SessionSummary(
            id = sObj.getString("id"),
            classId = sObj.getString("classId"),
            name = sObj.getString("name"),
            status = sObj.getString("status"),
            durationMinutes = sObj.optInt("durationMinutes", 60),
            joinCode = sObj.optString("joinCode", null),
            startsAt = sObj.optString("startsAt", null),
            endsAt = sObj.optString("endsAt", null)
        )
        val part = SessionParticipant(
            id = pObj.getString("id"),
            sessionId = pObj.getString("sessionId"),
            studentId = pObj.getString("studentId"),
            deviceId = pObj.getString("deviceId"),
            status = pObj.getString("status"),
            batteryLevel = pObj.optInt("batteryLevel", 100),
            isCharging = pObj.optBoolean("isCharging", false),
            deviceLocked = pObj.optBoolean("deviceLocked", false),
            networkQuality = pObj.optString("networkQuality", "EXCELLENT")
        )
        Pair(sess, part)
    }

    suspend fun sendHeartbeat(
        sessionId: String,
        studentId: String,
        deviceId: String,
        sequence: Int,
        isLockActive: Boolean,
        batteryLevel: Int,
        isCharging: Boolean
    ): Unit = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("eventId", UUID.randomUUID().toString())
            put("sessionId", sessionId)
            put("studentId", studentId)
            put("deviceId", deviceId)
            put("sequence", sequence)
            put("platform", "ANDROID")
            put("appVersion", "1.0.0")
            put("securityState", JSONObject().apply {
                put("isSupervised", isLockActive)
                put("isLockActive", isLockActive)
                put("nativeMechanism", "ANDROID_LOCK_TASK")
                put("verificationSignal", if (isLockActive) "CONFIRMED_BY_OS" else "UNLOCKED")
            })
            put("sessionState", if (isLockActive) "ACTIVE" else "READY")
            put("batteryLevel", batteryLevel)
            put("isCharging", isCharging)
            put("networkState", "WIFI")
            put("screenOn", true)
            put("deviceLocked", isLockActive)
            put("clientTimestamp", java.time.Instant.now().toString())
        }

        val req = newRequestBuilder("/devices/$deviceId/heartbeat")
            .post(json.toString().toRequestBody(JSON))
            .build()
        executeRequest(req)
    }

    suspend fun requestEmergency(sessionId: String, studentId: String, deviceId: String, reason: String): Int = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("sessionId", sessionId)
            put("studentId", studentId)
            put("deviceId", deviceId)
            put("reason", reason)
            put("clientTimestamp", java.time.Instant.now().toString())
        }
        val req = newRequestBuilder("/emergency/request")
            .post(json.toString().toRequestBody(JSON))
            .build()
        val resp = executeRequest(req)
        resp.optInt("emergencyDurationSeconds", 15)
    }

    suspend fun exitEmergency(sessionId: String, studentId: String, deviceId: String): Unit = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("sessionId", sessionId)
            put("studentId", studentId)
            put("deviceId", deviceId)
            put("clientTimestamp", java.time.Instant.now().toString())
        }
        val req = newRequestBuilder("/emergency/exit")
            .post(json.toString().toRequestBody(JSON))
            .build()
        executeRequest(req)
    }

    // ==========================================
    // WEBSOCKET REALTIME
    // ==========================================

    fun connectWebSocket(sessionId: String, onEvent: (String, JSONObject) -> Unit) {
        activeWebSocket?.close(1000, "Reconnecting")
        val token = accessToken ?: return
        val url = "$WS_URL?token=$token&sessionId=$sessionId"

        val req = Request.Builder().url(url).build()
        activeWebSocket = client.newWebSocket(req, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val obj = JSONObject(text)
                    val event = obj.optString("event", "")
                    onEvent(event, obj)
                } catch (e: Exception) {
                    // Ignore malformed WS frames
                }
            }
        })
    }

    fun disconnectWebSocket() {
        activeWebSocket?.close(1000, "Session closed")
        activeWebSocket = null
    }

    private fun parseUser(uObj: JSONObject): User {
        val sObj = uObj.optJSONObject("studentProfile")
        val dObj = uObj.optJSONObject("device")

        val sProfile = if (sObj != null) {
            StudentProfile(
                id = sObj.getString("id"),
                userId = sObj.getString("userId"),
                registerNumber = sObj.getString("registerNumber"),
                admissionYear = sObj.optString("admissionYear", null),
                department = sObj.optString("department", null),
                program = sObj.optString("program", null),
                status = sObj.optString("status", "ACTIVE")
            )
        } else null

        val device = if (dObj != null) {
            Device(
                id = dObj.getString("id"),
                platform = dObj.optString("platform", "ANDROID"),
                model = dObj.optString("model", Build.MODEL),
                osVersion = dObj.optString("osVersion", Build.VERSION.RELEASE),
                isSupervised = dObj.optBoolean("isSupervised", false),
                enrollmentStatus = dObj.optString("enrollmentStatus", "ACTIVE")
            )
        } else null

        val instObj = uObj.optJSONObject("institution")
        val institutionId = when {
            uObj.has("institutionId") && !uObj.isNull("institutionId") -> uObj.getString("institutionId")
            instObj != null && instObj.has("id") -> instObj.getString("id")
            sObj != null && sObj.has("institutionId") -> sObj.getString("institutionId")
            else -> ""
        }

        return User(
            id = uObj.getString("id"),
            email = uObj.optString("email", null),
            phoneNumber = uObj.optString("phoneNumber", null),
            name = uObj.getString("name"),
            role = uObj.getString("role"),
            institutionId = institutionId,
            studentProfile = sProfile,
            device = device
        )
    }
}
