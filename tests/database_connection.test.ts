import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresService } from '../services/backend/dist/store/postgres.js';

test('PostgreSQL - LockWatch Application Backend Connection Test', async () => {
  const pgService = PostgresService.getInstance();
  const health = await pgService.testConnection();

  assert.equal(health.connected, true, `Database should connect successfully: ${health.error}`);
  assert.ok(health.database === 'neondb' || health.database === 'lockwatch', `Connected database should be neondb or lockwatch, got: ${health.database}`);
  assert.ok(health.user === 'neondb_owner' || health.user === 'lockwatch_app', `Connected user must be neondb_owner or lockwatch_app, got: ${health.user}`);
  assert.ok(health.serverVersion, 'Server version should be reported');
  assert.ok(typeof health.latencyMs === 'number', 'Latency should be measured');

  // Verify clean, unseeded production tables
  const countRes = await pgService.query('SELECT count(*)::int as count FROM users;');
  assert.equal(countRes.rows[0].count, 0, 'Production database must be clean and unseeded');

  await pgService.close();
});
