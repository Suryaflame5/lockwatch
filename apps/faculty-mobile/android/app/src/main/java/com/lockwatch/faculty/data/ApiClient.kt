package com.lockwatch.faculty.data

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

object FacultyApiClient {
    private const val BASE_URL = "https://lockwatch.onrender.com"
    private const val WS_URL = "wss://lockwatch.onrender.com/ws"
    private val JSON = "application/json; charset=utf-8".toMediaType()

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    var accessToken: String? = null
    var refreshToken: String? = null

    private fun authRequest(url: String): Request.Builder {
        return Request.Builder().url(url).header("Authorization", "Bearer ${accessToken ?: ""}")
    }

    fun login(email: String, password: String): LoginResponse {
        val body = JSONObject().apply {
            put("identifier", email.trim())
            if (password.length == 6 && password.all { it.isDigit() }) {
                put("pin", password)
            } else {
                put("password", password)
            }
            put("institutionCode", "TECH-UNI")
        }.toString().toRequestBody(JSON)
        val req = Request.Builder().url("$BASE_URL/auth/faculty/login").post(body).build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Login failed: ${resp.code}")
            val json = JSONObject(resp.body!!.string())
            val userJ = json.getJSONObject("user")
            val facJ = if (json.has("faculty")) json.getJSONObject("faculty") else userJ.getJSONObject("facultyProfile")
            val instJ = if (json.has("institution")) json.getJSONObject("institution") else userJ.getJSONObject("institution")
            val user = User(
                userJ.getString("id"),
                userJ.getString("name"),
                userJ.getString("email"),
                userJ.getString("role")
            )
            val faculty = Faculty(
                facJ.getString("id"),
                facJ.getString("userId"),
                facJ.getString("institutionId"),
                facJ.optString("department").takeIf { it.isNotEmpty() },
                facJ.optString("designation").takeIf { it.isNotEmpty() }
            )
            val inst = Institution(
                instJ.getString("id"),
                instJ.getString("name"),
                instJ.getString("code")
            )
            accessToken = json.getString("accessToken")
            refreshToken = json.getString("refreshToken")
            return LoginResponse(accessToken!!, refreshToken!!, user, faculty, inst)
        }
    }

    fun getClasses(): List<AcademicClass> {
        val req = authRequest("$BASE_URL/classes").get().build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Get classes failed: ${resp.code}")
            val arr = JSONArray(resp.body!!.string())
            return (0 until arr.length()).map {
                val j = arr.getJSONObject(it)
                val joinCodeVal = if (j.has("joinCode")) j.getString("joinCode") else j.optString("classCode", "")
                AcademicClass(
                    id = j.getString("id"),
                    name = j.getString("name"),
                    subject = j.getString("subject"),
                    section = j.optString("section").takeIf { s -> s.isNotEmpty() },
                    joinCode = joinCodeVal,
                    facultyId = j.optString("facultyId", j.optString("createdBy", "")),
                    institutionId = j.getString("institutionId"),
                    studentCount = j.optInt("studentCount", 0)
                )
            }
        }
    }

    fun createClass(name: String, subject: String, section: String?): AcademicClass {
        val body = JSONObject().apply {
            put("name", name)
            put("subject", subject)
            if (section != null) put("section", section)
        }.toString().toRequestBody(JSON)
        val req = authRequest("$BASE_URL/classes").post(body).build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Create class failed: ${resp.code}")
            val j = JSONObject(resp.body!!.string())
            return AcademicClass(
                id = j.getString("id"),
                name = j.getString("name"),
                subject = j.getString("subject"),
                section = j.optString("section").takeIf { s -> s.isNotEmpty() },
                joinCode = j.getString("joinCode"),
                facultyId = j.getString("facultyId"),
                institutionId = j.getString("institutionId")
            )
        }
    }

    fun getRoster(classId: String): List<RosterStudent> {
        val req = authRequest("$BASE_URL/classes/$classId/roster").get().build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Get roster failed: ${resp.code}")
            val arr = JSONArray(resp.body!!.string())
            return (0 until arr.length()).map {
                val j = arr.getJSONObject(it)
                RosterStudent(
                    id = j.getString("id"),
                    userId = j.getString("userId"),
                    name = j.getString("name"),
                    registerNumber = j.optString("registerNumber").takeIf { s -> s.isNotEmpty() },
                    email = j.optString("email").takeIf { s -> s.isNotEmpty() }
                )
            }
        }
    }

    fun getSessions(classId: String): List<Session> {
        val req = authRequest("$BASE_URL/classes/$classId/sessions").get().build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Get sessions failed: ${resp.code}")
            val arr = JSONArray(resp.body!!.string())
            return (0 until arr.length()).map {
                val j = arr.getJSONObject(it)
                Session(
                    id = j.getString("id"),
                    classId = j.getString("classId"),
                    name = j.getString("name"),
                    status = j.getString("status"),
                    joinCode = j.optString("joinCode"),
                    startedAt = j.optString("startedAt").takeIf { s -> s.isNotEmpty() },
                    endedAt = j.optString("endedAt").takeIf { s -> s.isNotEmpty() }
                )
            }
        }
    }

    fun createSession(classId: String, name: String): Session {
        val body = JSONObject().apply { put("name", name) }.toString().toRequestBody(JSON)
        val req = authRequest("$BASE_URL/classes/$classId/sessions").post(body).build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Create session failed: ${resp.code}")
            val j = JSONObject(resp.body!!.string())
            return Session(
                id = j.getString("id"),
                classId = j.getString("classId"),
                name = j.getString("name"),
                status = j.getString("status"),
                joinCode = j.optString("joinCode"),
                startedAt = j.optString("startedAt").takeIf { s -> s.isNotEmpty() },
                endedAt = j.optString("endedAt").takeIf { s -> s.isNotEmpty() }
            )
        }
    }

    fun startSession(sessionId: String) { controlSession(sessionId, "start") }
    fun pauseSession(sessionId: String) { controlSession(sessionId, "pause") }
    fun resumeSession(sessionId: String) { controlSession(sessionId, "resume") }
    fun endSession(sessionId: String) { controlSession(sessionId, "end") }

    private fun controlSession(sessionId: String, action: String) {
        val body = "".toRequestBody(JSON)
        val req = authRequest("$BASE_URL/faculty/sessions/$sessionId/$action").post(body).build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Session $action failed: ${resp.code}")
        }
    }

    fun getLiveParticipants(sessionId: String): List<SessionParticipant> {
        val req = authRequest("$BASE_URL/faculty/sessions/$sessionId/live").get().build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Get live failed: ${resp.code}")
            val json = JSONObject(resp.body!!.string())
            val arr = json.getJSONArray("participants")
            return (0 until arr.length()).map {
                val j = arr.getJSONObject(it)
                val studentName = j.optJSONObject("student")?.optString("name") ?: "Unknown"
                val regNo = j.optJSONObject("student")?.optString("registerNumber")
                SessionParticipant(
                    id = j.getString("id"),
                    studentId = j.getString("studentId"),
                    deviceId = j.optString("deviceId").takeIf { s -> s.isNotEmpty() },
                    status = j.getString("status"),
                    batteryLevel = if (j.has("batteryLevel") && !j.isNull("batteryLevel")) j.getInt("batteryLevel") else null,
                    deviceLocked = j.optBoolean("deviceLocked", false),
                    networkQuality = j.optString("networkQuality").takeIf { s -> s.isNotEmpty() },
                    studentName = studentName,
                    registerNumber = regNo?.takeIf { s -> s.isNotEmpty() }
                )
            }
        }
    }

    fun connectWebSocket(sessionId: String, listener: WebSocketListener): WebSocket {
        val req = authRequest("$WS_URL?token=${accessToken}&sessionId=$sessionId").build()
        return client.newWebSocket(req, listener)
    }
}
