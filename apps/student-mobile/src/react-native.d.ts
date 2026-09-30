declare module 'react-native' {
  export const Platform: {
    OS: 'android' | 'ios' | 'windows' | 'macos' | 'web';
    select: <T>(specifics: { [platform: string]: T }) => T;
  };
  export const NativeModules: {
    LockWatchAndroidSecurity?: any;
    LockWatchIOSSecurityModule?: any;
    [key: string]: any;
  };
  export class NativeEventEmitter {
    constructor(module?: any);
    addListener(event: string, callback: (data: any) => void): { remove: () => void };
  }
  export const DeviceEventEmitter: {
    addListener(event: string, callback: (data: any) => void): { remove: () => void };
  };
  export interface EmitterSubscription {
    remove: () => void;
  }
}
