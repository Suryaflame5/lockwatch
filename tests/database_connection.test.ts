import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresService } from '../services/backend/dist/store/postgres.js';

test('PostgreSQL - LockWatch Application Backend Connection Test', async () => {
  const pgService = PostgresService.getInstance();
  const health = await pgService.testConnection();

  assert.equal(health.connected, true, `Database should connect successfully: ${health.error}`);
  assert.equal(health.database, 'lockwatch', 'Connected database should be lockwatch');
  assert.equal(health.user, 'lockwatch_app', 'Connected user must be lockwatch_app (least-privilege)');
  assert.ok(health.serverVersion, 'Server version should be reported');
  assert.ok(typeof health.latencyMs === 'number', 'Latency should be measured');

  // Verify that lockwatch_app cannot perform superuser actions
  await assert.rejects(
    async () => {
      await pgService.query('CREATE DATABASE lockwatch_unauthorized_test;');
    },
    /permission denied/i,
    'Application user lockwatch_app must not have CREATEDB or superuser permissions'
  );

  // Verify clean, unseeded production tables
  const countRes = await pgService.query('SELECT count(*)::int as count FROM users;');
  assert.equal(countRes.rows[0].count, 0, 'Production database must be clean and unseeded');

  await pgService.close();
});
