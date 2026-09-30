import deviceConfig from '../test_device_config.json' with { type: 'json' };

export const TEST_CONNECTED_DEVICE = deviceConfig.device;
export const TEST_AUTH_CREDENTIALS = deviceConfig.auth;

export default {
  device: TEST_CONNECTED_DEVICE,
  auth: TEST_AUTH_CREDENTIALS
};
