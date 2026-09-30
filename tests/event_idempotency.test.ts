import test from 'node:test';
import assert from 'node:assert/strict';
import { EventService } from '../services/backend/dist/services/event.service.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import { EventType, StudentStatus } from '@lockwatch/shared-models';

test('EventService - Idempotent deduplication and participant state updates', () => {
  const eventService = new EventService();
  const store = DataStore.getInstance();

  const sessionId = '77777777-7777-7777-7777-777777777777';
  const studentId = '55555555-5555-5555-5555-555555555001';
  const deviceId = '66666666-6666-6666-6666-666666666001';

  // 1. Process Event
  const res1 = eventService.processEvent({
    id: '12345678-1234-1234-1234-123456789001',
    sessionId,
    studentId,
    deviceId,
    institutionId: '11111111-1111-1111-1111-111111111111',
    type: EventType.LOCK_CONFIRMED,
    sequence: 101,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: {}
  });

  assert.equal(res1.accepted, true);
  assert.equal(res1.duplicate, false);

  const participant = store.findParticipant(sessionId, studentId);
  assert.equal(participant?.status, StudentStatus.ACTIVE);
  assert.equal(participant?.lockVerified, true);

  // 2. Resend exactly same event (duplicate retry)
  const resDuplicate = eventService.processEvent({
    id: '12345678-1234-1234-1234-123456789001',
    sessionId,
    studentId,
    deviceId,
    institutionId: '11111111-1111-1111-1111-111111111111',
    type: EventType.LOCK_CONFIRMED,
    sequence: 101,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: {}
  });

  assert.equal(resDuplicate.accepted, false);
  assert.equal(resDuplicate.duplicate, true);

  // 3. Test App Left / Supervision Interrupted
  eventService.processEvent({
    id: '12345678-1234-1234-1234-123456789002',
    sessionId,
    studentId,
    deviceId,
    institutionId: '11111111-1111-1111-1111-111111111111',
    type: EventType.APP_LEFT,
    sequence: 102,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: {}
  });

  assert.equal(participant?.status, StudentStatus.LEFT_SUPERVISION);
  assert.equal(participant?.interruptionCount, 1);
});
