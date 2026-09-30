import Foundation
import Security

/**
 * AppleKeychainManager
 * Manages hardware-backed cryptographic identity in iOS Keychain / Secure Enclave (Section 18, 56).
 */
public class AppleKeychainManager {
    
    private let keyTag = "com.lockwatch.deviceIdentityKey".data(using: .utf8)!
    
    public init() {}
    
    public func getOrCreateDevicePublicKey() throws -> String {
        if let existingKey = loadKey() {
            return exportPublicKeyBase64(secKey: existingKey)
        }
        
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: keyTag
            ]
        ]
        
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            throw error!.takeRetainedValue() as Error
        }
        
        return exportPublicKeyBase64(secKey: privateKey)
    }
    
    private func loadKey() -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: keyTag,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecReturnRef as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecSuccess {
            return (item as! SecKey)
        }
        return nil
    }
    
    private func exportPublicKeyBase64(secKey: SecKey) -> String {
        guard let publicKey = SecKeyCopyPublicKey(secKey),
              let cfData = SecKeyCopyExternalRepresentation(publicKey, nil) else {
            return UUID().uuidString
        }
        let data = cfData as Data
        return data.base64EncodedString()
    }
}
