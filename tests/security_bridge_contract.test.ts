import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SecurityCapability,
  CapabilityStatus,
  PlatformSecurityStatus
} from '@lockwatch/shared-models';

test('SecurityBridge Contract - Capability Invariants & Offline Safety Watchdog Simulation', async () => {
  // Define a mockable instance conforming strictly to IPlatformSecurityManager
  class TestPlatformSecurityManager {
    public isLocked = false;
    public emergencyActive = false;
    public watchdogFired = false;
    private watchdogTimer: any = null;

    async checkCapabilities(): Promise<Record<SecurityCapability, CapabilityStatus>> {
      return {
        [SecurityCapability.ANDROID_LOCK_TASK]: CapabilityStatus.SUPPORTED,
        [SecurityCapability.ANDROID_DEVICE_OWNER]: CapabilityStatus.SUPPORTED,
        [SecurityCapability.IOS_AAC]: CapabilityStatus.SUPPORTED,
        [SecurityCapability.IOS_MDM]: CapabilityStatus.CONFIGURATION_REQUIRED,
        [SecurityCapability.IOS_SINGLE_APP_MODE]: CapabilityStatus.SUPPORTED,
        [SecurityCapability.REALTIME_CONNECTIVITY]: CapabilityStatus.SUPPORTED,
        [SecurityCapability.PUSH_NOTIFICATIONS]: CapabilityStatus.SUPPORTED
      };
    }

    async verifyReadiness(): Promise<{ isReady: boolean; problem?: string }> {
      return { isReady: true };
    }

    async startLock(): Promise<{ success: boolean; error?: string }> {
      this.isLocked = true;
      return { success: true };
    }

    async stopLock(): Promise<{ success: boolean; error?: string }> {
      this.isLocked = false;
      this.emergencyActive = false;
      if (this.watchdogTimer) clearInterval(this.watchdogTimer);
      return { success: true };
    }

    async getSecurityStatus(): Promise<PlatformSecurityStatus> {
      return {
        isSupported: true,
        isEnrolled: true,
        isLocked: this.isLocked,
        activeMechanism: this.isLocked ? 'ANDROID_LOCK_TASK' : 'NONE',
        details: { mode: 'LOCK_TASK_FEATURE_NONE' }
      };
    }

    async enterEmergency(durationSeconds: number): Promise<{ success: boolean; error?: string }> {
      this.emergencyActive = true;
      return { success: true };
    }

    async exitEmergency(): Promise<{ success: boolean; error?: string }> {
      this.emergencyActive = false;
      return { success: true };
    }

    armOfflineWatchdog(endsAtIsoString: string, onTrigger: () => void) {
      const targetTime = new Date(endsAtIsoString).getTime();
      this.watchdogTimer = setInterval(() => {
        if (Date.now() >= targetTime) {
          this.watchdogFired = true;
          this.stopLock();
          onTrigger();
          clearInterval(this.watchdogTimer);
        }
      }, 50);
    }
  }

  const manager = new TestPlatformSecurityManager();

  // 1. Verify capabilities
  const caps = await manager.checkCapabilities();
  assert.equal(caps[SecurityCapability.ANDROID_LOCK_TASK], CapabilityStatus.SUPPORTED);
  assert.equal(caps[SecurityCapability.IOS_AAC], CapabilityStatus.SUPPORTED);

  // 2. Verify readiness
  const ready = await manager.verifyReadiness();
  assert.equal(ready.isReady, true);

  // 3. Start Lock
  const lockRes = await manager.startLock();
  assert.equal(lockRes.success, true);
  assert.equal(manager.isLocked, true);

  const status = await manager.getSecurityStatus();
  assert.equal(status.isLocked, true);
  assert.equal(status.activeMechanism, 'ANDROID_LOCK_TASK');

  // 4. Test Emergency Window
  await manager.enterEmergency(15);
  assert.equal(manager.emergencyActive, true);
  await manager.exitEmergency();
  assert.equal(manager.emergencyActive, false);

  // 5. Test Offline Watchdog (triggers unlock when time reaches endsAt even offline)
  let watchdogTriggered = false;
  const expiredTime = new Date(Date.now() + 100).toISOString(); // 100ms in future
  manager.armOfflineWatchdog(expiredTime, () => {
    watchdogTriggered = true;
  });

  // Wait for watchdog to trigger
  await new Promise(resolve => setTimeout(resolve, 250));

  assert.equal(manager.watchdogFired, true, 'Watchdog must fire when endsAt is reached');
  assert.equal(watchdogTriggered, true, 'Callback must execute');
  assert.equal(manager.isLocked, false, 'Device must be unlocked by safety watchdog');
});
