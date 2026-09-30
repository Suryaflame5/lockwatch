import {
  Device,
  PlatformType,
  SecurityCapability,
  CapabilityStatus,
  DeviceEnrollmentStatus
} from '@lockwatch/shared-models';

/**
 * SecurityCapabilityService
 * Evaluates authentic native OS security capabilities and enrollment status.
 * Section 73 & Section 21: There is no "Demo Mode". Devices are either SECURE READY or NOT READY.
 */
export class SecurityCapabilityService {
  public static evaluateDeviceCapabilities(device: Device): Record<SecurityCapability, CapabilityStatus> {
    const capabilities: Record<SecurityCapability, CapabilityStatus> = {
      [SecurityCapability.ANDROID_LOCK_TASK]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.ANDROID_DEVICE_OWNER]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.IOS_AAC]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.IOS_MDM]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.IOS_SINGLE_APP_MODE]: CapabilityStatus.UNSUPPORTED,
      [SecurityCapability.REALTIME_CONNECTIVITY]: CapabilityStatus.SUPPORTED,
      [SecurityCapability.PUSH_NOTIFICATIONS]: CapabilityStatus.SUPPORTED
    };

    if (device.platform === PlatformType.ANDROID) {
      if (device.isDeviceOwner) {
        capabilities[SecurityCapability.ANDROID_DEVICE_OWNER] = CapabilityStatus.SUPPORTED;
        capabilities[SecurityCapability.ANDROID_LOCK_TASK] = CapabilityStatus.SUPPORTED;
      } else {
        capabilities[SecurityCapability.ANDROID_DEVICE_OWNER] = CapabilityStatus.CONFIGURATION_REQUIRED;
        capabilities[SecurityCapability.ANDROID_LOCK_TASK] = CapabilityStatus.UNSUPPORTED;
      }
    } else if (device.platform === PlatformType.IOS) {
      if (device.hasAacEntitlement) {
        capabilities[SecurityCapability.IOS_AAC] = CapabilityStatus.SUPPORTED;
      } else {
        capabilities[SecurityCapability.IOS_AAC] = CapabilityStatus.CONFIGURATION_REQUIRED;
      }
      // Supervised MDM Single App Mode capability
      capabilities[SecurityCapability.IOS_MDM] = CapabilityStatus.SUPPORTED;
      capabilities[SecurityCapability.IOS_SINGLE_APP_MODE] = CapabilityStatus.SUPPORTED;
    }

    return capabilities;
  }

  public static determineEnrollmentStatus(device: Device): {
    status: DeviceEnrollmentStatus;
    reason?: string;
  } {
    if (device.platform === PlatformType.ANDROID) {
      if (device.isDeviceOwner) {
        return { status: DeviceEnrollmentStatus.SECURE_READY };
      }
      return {
        status: DeviceEnrollmentStatus.NOT_READY,
        reason: 'Android device is not provisioned as a managed Device Owner.'
      };
    } else if (device.platform === PlatformType.IOS) {
      if (device.hasAacEntitlement) {
        return { status: DeviceEnrollmentStatus.SECURE_READY };
      }
      return {
        status: DeviceEnrollmentStatus.NOT_READY,
        reason: 'iOS Automatic Assessment Configuration (AAC) entitlement or MDM Single App Mode is unavailable.'
      };
    }

    return {
      status: DeviceEnrollmentStatus.NOT_READY,
      reason: 'Unsupported hardware operating platform.'
    };
  }
}
