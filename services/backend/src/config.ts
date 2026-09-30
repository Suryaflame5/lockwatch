export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'lockwatch_super_secure_jwt_secret_key_2026',
  refreshSecret: process.env.REFRESH_SECRET || 'lockwatch_super_secure_refresh_secret_key_2026',
  jwtExpiresIn: '15m',
  refreshExpiresInDays: 7,
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  webBaseUrl: process.env.WEB_BASE_URL || 'http://localhost:3000',
  appleTeamId: process.env.APPLE_TEAM_ID || 'TEAM123456',
  appleKeyId: process.env.APPLE_KEY_ID || 'KEY12345678',
  appBundleId: process.env.APP_BUNDLE_ID || 'com.lockwatch.app',
  defaultEmergencySeconds: 15,
  heartbeatIntervalSeconds: 5,
  staleThresholdSeconds: 15,
  offlineThresholdSeconds: 30
};
