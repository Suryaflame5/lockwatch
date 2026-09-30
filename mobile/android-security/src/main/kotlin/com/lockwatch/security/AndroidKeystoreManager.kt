package com.lockwatch.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature

/**
 * AndroidKeystoreManager
 * Generates hardware-backed cryptographic identity in AndroidKeyStore (TEE / StrongBox).
 * Used for anti-tamper telemetry signatures and device registration (Section 18, 56).
 */
class AndroidKeystoreManager {

    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val KEY_ALIAS = "lockwatch_device_identity"
    }

    private val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }

    fun getOrCreateDeviceKeyPair(): String {
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val kpg = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC,
                ANDROID_KEYSTORE
            )
            val parameterSpec = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            ).run {
                setDigests(KeyProperties.DIGEST_SHA256)
                setUserAuthenticationRequired(false)
                build()
            }
            kpg.initialize(parameterSpec)
            kpg.generateKeyPair()
        }

        val certificate = keyStore.getCertificate(KEY_ALIAS)
        return Base64.encodeToString(certificate.publicKey.encoded, Base64.NO_WRAP)
    }

    fun signData(data: ByteArray): String {
        val entry = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.PrivateKeyEntry
            ?: throw IllegalStateException("Device identity key not found in Keystore")

        val s = Signature.getInstance("SHA256withECDSA").apply {
            initSign(entry.privateKey)
            update(data)
        }
        val signature = s.sign()
        return Base64.encodeToString(signature, Base64.NO_WRAP)
    }
}
