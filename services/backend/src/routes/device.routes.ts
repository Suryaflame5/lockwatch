import { Router, type Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { DeviceRegistrationSchema, HeartbeatSchema } from '@lockwatch/validation';
import { HeartbeatService } from '../services/heartbeat.service.js';
import { SecurityCapabilityService } from '../services/capability.service.js';
import { DataStore } from '../store/database.js';
import { Device, DeviceEnrollmentStatus } from '@lockwatch/shared-models';

export const deviceRouter = Router();
const heartbeatService = new HeartbeatService();
const store = DataStore.getInstance();

deviceRouter.use(requireAuth);

deviceRouter.post('/register', (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = DeviceRegistrationSchema.parse(req.body);
    const student = store.findStudentByUserId(req.user!.userId);
    if (!student) {
      return res.status(403).json({ message: 'Only registered students can register devices' });
    }

    const device: Device = {
      id: validated.deviceId,
      studentId: student.id,
      institutionId: req.user!.institutionId,
      platform: validated.platform,
      manufacturer: validated.manufacturer,
      model: validated.model,
      osVersion: validated.osVersion,
      appVersion: validated.appVersion,
      enrollmentStatus: validated.isDeviceOwner || validated.hasAacEntitlement
        ? DeviceEnrollmentStatus.SECURE_READY
        : DeviceEnrollmentStatus.NOT_READY,
      isDeviceOwner: validated.isDeviceOwner,
      hasAacEntitlement: validated.hasAacEntitlement,
      publicKey: validated.publicKey,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.devices.set(device.id, device);

    const capabilities = SecurityCapabilityService.evaluateDeviceCapabilities(device);
    const enrollment = SecurityCapabilityService.determineEnrollmentStatus(device);

    res.status(201).json({
      device,
      capabilities,
      enrollment
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

deviceRouter.get('/:id', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const device = store.devices.get(req.params.id);
  if (!device || device.institutionId !== req.user!.institutionId) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const capabilities = SecurityCapabilityService.evaluateDeviceCapabilities(device);
  const enrollment = SecurityCapabilityService.determineEnrollmentStatus(device);

  res.json({
    device,
    capabilities,
    enrollment
  });
});

deviceRouter.post('/:id/heartbeat', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const validated = HeartbeatSchema.parse(req.body);
    const result = heartbeatService.recordHeartbeat(validated);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});
