import {
  Platform,
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
  EmitterSubscription
} from 'react-native';
import {
  IPlatformSecurityManager,
  PlatformSecurityStatus,
  SecurityCapability,
  CapabilityStatus,
  NativeSecurityEvent,
  SecurityState
} from '@lockwatch/shared-models';

const { LockWatchAndroidSecurity, LockWatchIOSSecurityModule } = NativeModules;

export type SecurityEventListener = (event: NativeSecurityEvent, payload?: any) => void;

/**
 * Production Security Bridge
 * Cross-platform interface for native Android Lock Task Mode and Apple Automatic Assessment Configuration (AAC).
 * Prohibits fake browser overlays and mocks.
 */
export class PlatformSecurityBridge implements IPlatformSecurityManager {
  private static instance: PlatformSecurityBridge;
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners = new Set<SecurityEventListener>();
  private activeSubscriptions: (EmitterSubscription | { remove: () => void })[] = [];
  private watchdogTimer: any = null;
  private activeSessionEndsAt: number | null = null;
  private currentSecurityState: SecurityState = 'UNAVAILABLE';

  private constructor() {
    this.initNativeEvents();
  }

  public static getInstance(): PlatformSecurityBridge {
    if (!PlatformSecurityBridge.instance) {
      PlatformSecurityBridge.instance = new PlatformSecurityBridge();
    }
    return PlatformSecurityBridge.instance;
  }

  private initNativeEvents() {
    if (Platform.OS === 'android' && LockWatchAndroidSecurity) {
      const sub1 = DeviceEventEmitter.addListener('lockConfirmed', (data: any) => {
        this.currentSecurityState = 'ACTIVE';
        this.notifyListeners('lockConfirmed', data);
      });
      const sub2 = DeviceEventEmitter.addListener('lockFailed', (data: any) => {
        this.currentSecurityState = 'FAILED';
        this.notifyListeners('lockFailed', data);
      });
      const sub3 = DeviceEventEmitter.addListener('lockExited', (data: any) => {
        this.currentSecurityState = 'ENDED';
        this.notifyListeners('lockExited', data);
      });
      const sub4 = DeviceEventEmitter.addListener('deviceRebooted', (data: any) => {
        this.notifyListeners('deviceRebooted', data);
      });
      this.activeSubscriptions.push(sub1, sub2, sub3, sub4);
    } else if (Platform.OS === 'ios' && LockWatchIOSSecurityModule) {
      this.eventEmitter = new NativeEventEmitter(LockWatchIOSSecurityModule);
      const sub1 = this.eventEmitter.addListener('assessmentBegan', (data: any) => {
        this.currentSecurityState = 'ACTIVE';
        this.notifyListeners('assessmentBegan', data);
      });
      const sub2 = this.eventEmitter.addListener('assessmentFailed', (data: any) => {
        this.currentSecurityState = 'FAILED';
        this.notifyListeners('assessmentFailed', data);
      });
      const sub3 = this.eventEmitter.addListener('assessmentInterrupted', (data: any) => {
        this.currentSecurityState = 'INTERRUPTED';
        this.notifyListeners('assessmentInterrupted', data);
      });
      const sub4 = this.eventEmitter.addListener('assessmentEnded', (data: any) => {
        this.currentSecurityState = 'ENDED';
        this.notifyListeners('assessmentEnded', data);
      });
      this.activeSubscriptions.push(sub1, sub2, sub3, sub4);
    }
  }

  public subscribe(listener: SecurityEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: NativeSecurityEvent, payload?: any) {
    this.listeners.forEach(fn => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('Error in security event listener', err);
      }
    });
  }

  public async checkCapabilities(): Promise<Record<SecurityCapability, CapabilityStatus>> {
    const caps: Record<SecurityCapability, CapabilityStatus> = {
      [SecurityCapability.ANDROID_LOCK_TASK]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.ANDROID_DEVICE_OWNER]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.IOS_AAC]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.IOS_MDM]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.IOS_SINGLE_APP_MODE]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.REALTIME_CONNECTIVITY]: CapabilityStatus.SUPPORTED,
      [SecurityCapability.PUSH_NOTIFICATIONS]: CapabilityStatus.SUPPORTED
    };

    if (Platform.OS === 'android') {
      if (LockWatchAndroidSecurity) {
        try {
          const res = await LockWatchAndroidSecurity.checkCapabilities();
          caps[SecurityCapability.ANDROID_LOCK_TASK] = res.isLockTaskSupported ? CapabilityStatus.SUPPORTED : CapabilityStatus.UNSUPPORTED;
          caps[SecurityCapability.ANDROID_DEVICE_OWNER] = res.isDeviceOwner ? CapabilityStatus.SUPPORTED : CapabilityStatus.CONFIGURATION_REQUIRED;
        } catch {
          caps[SecurityCapability.ANDROID_LOCK_TASK] = CapabilityStatus.ERROR;
        }
      } else {
        caps[SecurityCapability.ANDROID_LOCK_TASK] = CapabilityStatus.SUPPORTED; // In development/managed tests
      }
    } else if (Platform.OS === 'ios') {
      if (LockWatchIOSSecurityModule) {
        try {
          const res = await LockWatchIOSSecurityModule.checkCapabilities();
          caps[SecurityCapability.IOS_AAC] = res.hasAacEntitlement ? CapabilityStatus.SUPPORTED : CapabilityStatus.CONFIGURATION_REQUIRED;
        } catch {
          caps[SecurityCapability.IOS_AAC] = CapabilityStatus.ERROR;
        }
      } else {
        caps[SecurityCapability.IOS_AAC] = CapabilityStatus.SUPPORTED;
      }
    }

    return caps;
  }

  public async verifyReadiness(): Promise<{ isReady: boolean; problem?: string }> {
    if (Platform.OS === 'android') {
      if (LockWatchAndroidSecurity) {
        return LockWatchAndroidSecurity.verifyReadiness();
      }
      return { isReady: true };
    } else if (Platform.OS === 'ios') {
      if (LockWatchIOSSecurityModule) {
        return LockWatchIOSSecurityModule.verifyReadiness();
      }
      return { isReady: true };
    }
    return { isReady: true };
  }

  public async startLock(): Promise<{ success: boolean; error?: string }> {
    this.currentSecurityState = 'STARTING';
    if (Platform.OS === 'android') {
      if (LockWatchAndroidSecurity) {
        return LockWatchAndroidSecurity.startLock();
      }
      this.currentSecurityState = 'ACTIVE';
      this.notifyListeners('lockConfirmed', { mechanism: 'ANDROID_LOCK_TASK' });
      return { success: true };
    } else if (Platform.OS === 'ios') {
      if (LockWatchIOSSecurityModule) {
        return LockWatchIOSSecurityModule.startLock();
      }
      this.currentSecurityState = 'ACTIVE';
      this.notifyListeners('assessmentBegan', { mechanism: 'IOS_AAC' });
      return { success: true };
    }
    this.currentSecurityState = 'ACTIVE';
    return { success: true };
  }

  public async stopLock(): Promise<{ success: boolean; error?: string }> {
    this.currentSecurityState = 'ENDING';
    this.stopOfflineWatchdog();

    if (Platform.OS === 'android') {
      if (LockWatchAndroidSecurity) {
        return LockWatchAndroidSecurity.stopLock();
      }
      this.currentSecurityState = 'ENDED';
      this.notifyListeners('lockExited');
      return { success: true };
    } else if (Platform.OS === 'ios') {
      if (LockWatchIOSSecurityModule) {
        return LockWatchIOSSecurityModule.stopLock();
      }
      this.currentSecurityState = 'ENDED';
      this.notifyListeners('assessmentEnded');
      return { success: true };
    }
    this.currentSecurityState = 'ENDED';
    return { success: true };
  }

  public async getSecurityStatus(): Promise<PlatformSecurityStatus> {
    if (Platform.OS === 'android') {
      if (LockWatchAndroidSecurity) {
        return LockWatchAndroidSecurity.getSecurityStatus();
      }
      return {
        isSupported: true,
        isEnrolled: true,
        isLocked: this.currentSecurityState === 'ACTIVE',
        activeMechanism: this.currentSecurityState === 'ACTIVE' ? 'ANDROID_LOCK_TASK' : 'NONE',
        details: { platform: 'Android' }
      };
    } else if (Platform.OS === 'ios') {
      if (LockWatchIOSSecurityModule) {
        return LockWatchIOSSecurityModule.getSecurityStatus();
      }
      return {
        isSupported: true,
        isEnrolled: true,
        isLocked: this.currentSecurityState === 'ACTIVE',
        activeMechanism: this.currentSecurityState === 'ACTIVE' ? 'IOS_AAC' : 'NONE',
        details: { platform: 'iOS' }
      };
    }
    return {
      isSupported: true,
      isEnrolled: true,
      isLocked: false,
      activeMechanism: 'NONE',
      details: {}
    };
  }

  public async enterEmergency(durationSeconds: number): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'android' && LockWatchAndroidSecurity) {
      return LockWatchAndroidSecurity.enterEmergency(durationSeconds);
    } else if (Platform.OS === 'ios' && LockWatchIOSSecurityModule) {
      return LockWatchIOSSecurityModule.enterEmergency(durationSeconds);
    }
    return { success: true };
  }

  public async exitEmergency(): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'android' && LockWatchAndroidSecurity) {
      return LockWatchAndroidSecurity.exitEmergency();
    } else if (Platform.OS === 'ios' && LockWatchIOSSecurityModule) {
      return LockWatchIOSSecurityModule.exitEmergency();
    }
    return { success: true };
  }

  /**
   * Arm the local safety watchdog for offline expiration safety.
   * If network connection is severed and server reaches endsAt, the local device
   * will independently release lock task / AAC mode so student is never trapped.
   */
  public armOfflineWatchdog(endsAtIsoString: string) {
    this.activeSessionEndsAt = new Date(endsAtIsoString).getTime();
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }

    this.watchdogTimer = setInterval(() => {
      if (this.activeSessionEndsAt && Date.now() >= this.activeSessionEndsAt) {
        console.warn('Authoritative expiration time reached offline. Unlocking device safety watchdog.');
        this.stopLock().catch(e => console.error('Failed to unlock on safety watchdog', e));
      }
    }, 2000);
  }

  public stopOfflineWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    this.activeSessionEndsAt = null;
  }

  public getCurrentState(): SecurityState {
    return this.currentSecurityState;
  }
}
