import React, { createContext, useContext, useState, useEffect } from 'react';
import { LockWatchApiClient } from '@lockwatch/api-client';
import { PlatformSecurityBridge } from '../platform/PlatformSecurityBridge';
import { StudentStatus, PlatformType } from '@lockwatch/shared-models';

interface StudentAuthContextType {
  client: LockWatchApiClient;
  securityBridge: PlatformSecurityBridge;
  user: any | null;
  student: any | null;
  device: any | null;
  activeSession: any | null;
  participant: any | null;
  enrolledClasses: Array<{ class: any; membership: any; activeSession: any }>;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverUrl: string;
  updateServerUrl: (url: string) => void;
  login: (identifier: string, password: string, institutionCode?: string) => Promise<void>;
  requestSignupOtp: (phoneNumber: string) => Promise<{ challengeId: string; phoneNumber: string; expiresInSeconds: number; resendCooldownSeconds: number }>;
  verifySignupOtp: (challengeId: string, otp: string) => Promise<{ verificationToken: string }>;
  createAccount: (data: { verificationToken: string; password: string; name: string; registerNumber: string; institutionCode?: string }) => Promise<void>;
  requestPasswordResetOtp: (phoneNumber: string) => Promise<{ challengeId: string; phoneNumber: string; expiresInSeconds: number; resendCooldownSeconds: number }>;
  verifyPasswordResetOtp: (challengeId: string, otp: string) => Promise<{ verificationToken: string }>;
  resetPassword: (verificationToken: string, newPassword: string) => Promise<void>;
  joinSession: (joinCode: string) => Promise<void>;
  leaveSession: () => void;
  logout: () => void;
  setActiveSession: (sess: any) => void;
  setParticipant: (part: any) => void;
  fetchStudentClasses: () => Promise<void>;
  joinClassByCode: (code: string, academicIdentity?: { displayName?: string; registerNumber?: string }) => Promise<{ message?: string }>;
  joinClassByQr: (token: string, academicIdentity?: { displayName?: string; registerNumber?: string }) => Promise<{ message?: string }>;
  refreshProfile: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

const getInitialBaseUrl = (): string => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('lockwatch_server_url');
    if (saved) return saved;
  }
  return 'http://localhost:4000';
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if blocked
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const apiClient = new LockWatchApiClient({
  baseUrl: getInitialBaseUrl(),
  storage: {
    getItem: (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
    setItem: (key, val) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
      }
    },
    removeItem: (key) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  }
});

export const securityBridge = PlatformSecurityBridge.getInstance();

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrl] = useState<string>(getInitialBaseUrl());
  const [user, setUser] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [device, setDevice] = useState<any | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [participant, setParticipant] = useState<any | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<Array<{ class: any; membership: any; activeSession: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateServerUrl = (newUrl: string) => {
    const sanitized = newUrl.trim().replace(/\/$/, '');
    setServerUrl(sanitized);
    apiClient.setBaseUrl(sanitized);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lockwatch_server_url', sanitized);
    }
  };

  const fetchStudentClasses = async () => {
    try {
      const classes = await apiClient.getStudentClasses();
      setEnrolledClasses(classes);
      // Auto-detect active session if present in one of the enrolled classes
      const live = classes.find(c => c.activeSession && (c.activeSession.status === 'ACTIVE' || c.activeSession.status === 'READY'));
      if (live && !activeSession) {
        setActiveSession(live.activeSession);
      }
    } catch (err) {
      console.error('Failed to fetch student classes', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getAccessToken();
      const role = typeof localStorage !== 'undefined' ? localStorage.getItem('lockwatch_user_role') : null;
      if (token && role !== 'FACULTY') {
        try {
          const profile = await apiClient.getStudentMe();
          setUser(profile.user);
          setStudent(profile.student);
          setDevice(profile.device);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lockwatch_user_role', 'STUDENT');
          }
          await fetchStudentClasses();
        } catch {
          if (role === 'STUDENT') {
            apiClient.clearTokens();
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('lockwatch_user_role');
            }
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Heartbeat loop every 5 seconds while participating in an active session (Section 33)
  useEffect(() => {
    if (!student || !device || !activeSession?.id) return;

    let seq = 1;
    const interval = setInterval(async () => {
      try {
        const secStatus = await securityBridge.getSecurityStatus();
        await apiClient.sendHeartbeat({
          eventId: generateUUID(),
          deviceId: device.id,
          studentId: student.id,
          sessionId: activeSession.id,
          sequence: seq++,
          platform: PlatformType.ANDROID,
          appVersion: '1.0.0',
          securityState: {
            isSupervised: secStatus.isLocked,
            isLockActive: secStatus.isLocked,
            nativeMechanism: secStatus.activeMechanism,
            verificationSignal: secStatus.isLocked ? 'CONFIRMED_BY_OS' : 'UNLOCKED'
          },
          sessionState: secStatus.isLocked ? StudentStatus.ACTIVE : StudentStatus.READY,
          batteryLevel: 92,
          isCharging: false,
          networkState: 'WIFI',
          screenOn: true,
          deviceLocked: false,
          clientTimestamp: new Date().toISOString()
        });
      } catch (err) {
        // Handled silently by offline queue in ApiClient
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [student?.id, device?.id, activeSession?.id]);

  const refreshProfile = async () => {
    try {
      const profile = await apiClient.getStudentMe();
      setUser(profile.user);
      setStudent(profile.student);
      setDevice(profile.device);
      await fetchStudentClasses();
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  const login = async (identifier: string, password: string, institutionCode: string = 'TECH-UNI') => {
    const trimmed = identifier.trim();
    const isPhone = /^[+]?[0-9\s-]{7,15}$/.test(trimmed);
    const res = await apiClient.studentLogin({
      ...(isPhone ? { phoneNumber: trimmed } : { registerNumber: trimmed }),
      password,
      institutionCode
    });
    setUser(res.user);
    setStudent(res.user.studentProfile);
    setDevice(res.user.device);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lockwatch_user_role', 'STUDENT');
    }
    await fetchStudentClasses();
  };

  const requestSignupOtp = async (phoneNumber: string) => {
    return apiClient.requestStudentSignupOtp(phoneNumber);
  };

  const verifySignupOtp = async (challengeId: string, otp: string) => {
    const res = await apiClient.verifyStudentSignupOtp(challengeId, otp);
    return { verificationToken: res.verificationToken };
  };

  const createAccount = async (data: { verificationToken: string; password: string; name: string; registerNumber: string; institutionCode?: string }) => {
    const res = await apiClient.createStudentAccount(data);
    setUser(res.user);
    setStudent(res.user.studentProfile);
    setDevice(res.user.device);
    await fetchStudentClasses();
  };

  const requestPasswordResetOtp = async (phoneNumber: string) => {
    return apiClient.requestStudentPasswordResetOtp(phoneNumber);
  };

  const verifyPasswordResetOtp = async (challengeId: string, otp: string) => {
    const res = await apiClient.verifyStudentPasswordResetOtp(challengeId, otp);
    return { verificationToken: res.resetToken };
  };

  const resetPassword = async (verificationToken: string, newPassword: string) => {
    await apiClient.resetStudentPassword({ resetToken: verificationToken, newPassword });
  };

  const joinSession = async (joinCode: string) => {
    if (!device) throw new Error('Unregistered student device');
    const res = await apiClient.joinSession(joinCode, device.id);
    setActiveSession(res.session);
    setParticipant(res.participant);
  };

  const joinClassByCode = async (code: string, academicIdentity?: { displayName?: string; registerNumber?: string }) => {
    if (!device) throw new Error('Unregistered student device');
    const res = await apiClient.joinClassByCode(code, academicIdentity, device.id);
    await fetchStudentClasses();
    return { message: res.message };
  };

  const joinClassByQr = async (token: string, academicIdentity?: { displayName?: string; registerNumber?: string }) => {
    if (!device) throw new Error('Unregistered student device');
    const res = await apiClient.joinClassByQr(token, academicIdentity, device.id);
    await fetchStudentClasses();
    return { message: res.message };
  };

  const leaveSession = () => {
    setActiveSession(null);
    setParticipant(null);
    fetchStudentClasses();
  };

  const logout = () => {
    apiClient.logout();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('lockwatch_user_role');
    }
    setUser(null);
    setStudent(null);
    setDevice(null);
    setActiveSession(null);
    setEnrolledClasses([]);
  };

  return (
    <StudentAuthContext.Provider value={{
      client: apiClient,
      securityBridge,
      user,
      student,
      device,
      activeSession,
      participant,
      enrolledClasses,
      isAuthenticated: !!user,
      isLoading,
      serverUrl,
      updateServerUrl,
      login,
      requestSignupOtp,
      verifySignupOtp,
      createAccount,
      requestPasswordResetOtp,
      verifyPasswordResetOtp,
      resetPassword,
      joinSession,
      leaveSession,
      logout,
      setActiveSession,
      setParticipant,
      fetchStudentClasses,
      joinClassByCode,
      joinClassByQr,
      refreshProfile
    }}>
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return context;
};
