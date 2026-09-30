# LockWatch Production Deployment Guide

## 1. System Requirements & Infrastructure

- **Node.js**: v20+ LTS
- **PostgreSQL**: v15 or v16
- **Redis**: v7+ (for clustering and pub-sub)
- **Containerization**: Docker 24+ & Docker Compose v2.20+
- **Reverse Proxy**: NGINX / Cloudflare / AWS ALB with TLS 1.3

---

## 2. Backend & Database Deployment

### Step 1: Database Migration
Execute schema migrations in sequential order against the production PostgreSQL instance:
```bash
psql -U lockwatch_admin -d lockwatch -f database/migrations/001_initial_schema.sql
psql -U lockwatch_admin -d lockwatch -f database/migrations/002_indexes_and_constraints.sql
```

### Step 2: Environment Variables
Create `/etc/lockwatch/production.env` from `.env.example`:
```bash
DATABASE_URL=postgres://lockwatch_admin:<SECURE_PASSWORD>@db.internal:5432/lockwatch
REDIS_URL=redis://redis.internal:6379
JWT_SECRET=<64_CHAR_HEX_SECRET>
REFRESH_SECRET=<64_CHAR_HEX_SECRET>
PORT=4000
```

### Step 3: Launch with Docker Compose
```bash
docker compose -f infrastructure/docker-compose.yml up -d --build
```

---

## 3. Android Enterprise Release & Distribution

### Build Variants
- **Release APK**: Signed APK for institutional sideloading via MDM or local deployment.
- **Release AAB**: Signed Android App Bundle for Google Play Private Corporate Store.

### Building Release Artifacts:
```bash
cd mobile/android-security
./gradlew assembleRelease
./gradlew bundleRelease
```

### Signing Configuration:
Ensure `keystore.properties` is configured in your build environment with:
```properties
storeFile=/path/to/lockwatch-release.jks
storePassword=KEYSTORE_PASSWORD
keyAlias=lockwatch_production
keyPassword=KEY_PASSWORD
```

---

## 4. Apple iOS / iPadOS Deployment & Entitlement Workflow

### Automatic Assessment Configuration (AAC) Entitlement Application:
1. Log into your institution's **Apple Developer Program** account.
2. Visit **Certificates, Identifiers & Profiles** -> **Identifiers** -> select `com.lockwatch.app`.
3. In **Additional Capabilities**, submit a request for:
   `com.apple.developer.automatic-assessment-configuration`
4. Provide Apple with your institutional assessment mandate, testing protocols, and privacy policy URL.
5. Once granted, regenerate your App Provisioning Profile containing the entitlement.

### Institutional Supervised MDM Deployment:
For institution-owned iPhones and iPads enrolled in **Apple School Manager (ASM)** or **Apple Business Manager (ABM)**:
1. Export the Single App Mode configuration profile:
   `mobile/ios-security/LockWatchSecurity/ManagedDeviceProfileHandler.swift`
2. Push `LockWatch_SingleAppMode.mobileconfig` via Jamf School, Microsoft Intune, or Apple Configurator.
3. The device will automatically lock to the LockWatch application during active testing periods.

---

## 5. Monitoring & Health Endpoints

- Health check: `GET /health` (Returns HTTP 200 `{"status": "HEALTHY"}`)
- Readiness probe: `GET /ready` (Validates database connectivity and institutional tenant loading)
- WebSocket gateway: `ws://api.lockwatch.example/ws?token=<JWT>&sessionId=<SESSION_ID>`
