import React, { createContext, useContext, useState, useEffect } from 'react';
import { LockWatchApiClient } from '@lockwatch/api-client';
import {
  Class,
  ClassRosterStudent,
  ClassHistoryItem,
  ClassReportSummary,
  Session,
  SessionParticipant
} from '@lockwatch/shared-models';

interface FacultyAuthContextType {
  client: LockWatchApiClient;
  user: any | null;
  faculty: any | null;
  institution: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  classes: Class[];
  activeClass: Class | null;
  sessions: Session[];
  activeSession: Session | null;
  roster: ClassRosterStudent[];
  login: (identifier: string, password?: string, pin?: string, institutionCode?: string) => Promise<void>;
  logout: () => void;
  fetchClasses: () => Promise<void>;
  selectClass: (cls: Class) => Promise<void>;
  createClass: (data: any) => Promise<Class>;
  archiveClass: (classId: string) => Promise<void>;
  generateClassQr: (classId: string) => Promise<{ token: string; qrPayload: string; expiresAt: string }>;
  fetchRoster: (classId: string) => Promise<void>;
  addStudentToClass: (classId: string, registerNumber: string) => Promise<void>;
  bulkAddStudents: (classId: string, registerNumbers: string[]) => Promise<{ added: number; failed: string[] }>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  createClassSession: (classId: string, data: any) => Promise<Session>;
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  fetchClassHistory: (classId: string) => Promise<ClassHistoryItem[]>;
  fetchClassReport: (classId: string) => Promise<ClassReportSummary>;
}

const FacultyAuthContext = createContext<FacultyAuthContextType | undefined>(undefined);

import { apiClient } from '../../context/StudentAuthContext';

export const FacultyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [faculty, setFaculty] = useState<any | null>(null);
  const [institution, setInstitution] = useState<any | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeClass, setActiveClass] = useState<Class | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [roster, setRoster] = useState<ClassRosterStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const clsList = await apiClient.getFacultyClasses();
      setClasses(clsList);
      if (clsList.length > 0 && !activeClass) {
        setActiveClass(clsList[0]);
        await fetchRoster(clsList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch faculty classes', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const sessList = await apiClient.getFacultySessions();
      setSessions(sessList);
      const active = sessList.find(s => s.status === 'ACTIVE' || s.status === 'READY' || s.status === 'PAUSED');
      if (active) setActiveSession(active);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  };

  const fetchRoster = async (classId: string) => {
    try {
      const r = await apiClient.getClassRoster(classId);
      setRoster(r);
    } catch (err) {
      console.error('Failed to fetch class roster', err);
    }
  };

  const selectClass = async (cls: Class) => {
    setActiveClass(cls);
    await fetchRoster(cls.id);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getAccessToken();
      const role = typeof localStorage !== 'undefined' ? localStorage.getItem('lockwatch_user_role') : null;
      if (token && role === 'FACULTY') {
        try {
          const profile = await apiClient.getFacultyMe();
          setUser(profile.user);
          setFaculty(profile.faculty);
          setInstitution(profile.institution);
          await fetchClasses();
          await fetchSessions();
        } catch {
          apiClient.clearTokens();
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('lockwatch_user_role');
          }
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (identifier: string, password?: string, pin?: string, institutionCode: string = 'TECH-UNI') => {
    const res = await apiClient.facultyLogin({
      identifier,
      password,
      pin,
      institutionCode
    });
    setUser(res.user);
    setFaculty(res.faculty);
    setInstitution(res.institution);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lockwatch_user_role', 'FACULTY');
    }
    await fetchClasses();
    await fetchSessions();
  };

  // Real-time synchronization of classes, sessions, and active roster
  useEffect(() => {
    if (!user || !faculty) return;
    const interval = setInterval(() => {
      fetchClasses();
      fetchSessions();
      if (activeClass?.id) {
        fetchRoster(activeClass.id);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [user?.id, faculty?.id, activeClass?.id]);

  const logout = () => {
    apiClient.logout();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('lockwatch_user_role');
    }
    setUser(null);
    setFaculty(null);
    setInstitution(null);
    setClasses([]);
    setActiveClass(null);
    setSessions([]);
    setActiveSession(null);
    setRoster([]);
  };

  const createClass = async (data: any): Promise<Class> => {
    const newCls = await apiClient.createClass(data);
    await fetchClasses();
    setActiveClass(newCls);
    return newCls;
  };

  const archiveClass = async (classId: string) => {
    await apiClient.archiveClass(classId);
    await fetchClasses();
  };

  const generateClassQr = async (classId: string) => {
    return apiClient.generateClassQr(classId);
  };

  const addStudentToClass = async (classId: string, registerNumber: string) => {
    await apiClient.addStudentToClass(classId, registerNumber);
    await fetchRoster(classId);
  };

  const bulkAddStudents = async (classId: string, registerNumbers: string[]) => {
    const res = await apiClient.bulkAddStudents(classId, registerNumbers);
    await fetchRoster(classId);
    return res;
  };

  const removeStudentFromClass = async (classId: string, studentId: string) => {
    await apiClient.removeStudentFromClass(classId, studentId);
    await fetchRoster(classId);
  };

  const createClassSession = async (classId: string, data: any) => {
    const sess = await apiClient.createClassSession(classId, data);
    await fetchSessions();
    setActiveSession(sess);
    return sess;
  };

  const startSession = async (sessionId: string) => {
    await apiClient.startSession(sessionId);
    await fetchSessions();
  };

  const pauseSession = async (sessionId: string) => {
    await apiClient.pauseSession(sessionId);
    await fetchSessions();
  };

  const resumeSession = async (sessionId: string) => {
    await apiClient.resumeSession(sessionId);
    await fetchSessions();
  };

  const endSession = async (sessionId: string) => {
    await apiClient.endSession(sessionId);
    await fetchSessions();
    setActiveSession(null);
  };

  const fetchClassHistory = async (classId: string) => {
    return apiClient.getClassHistory(classId);
  };

  const fetchClassReport = async (classId: string) => {
    return apiClient.getClassReport(classId);
  };

  return (
    <FacultyAuthContext.Provider value={{
      client: apiClient,
      user,
      faculty,
      institution,
      isAuthenticated: !!user,
      isLoading,
      classes,
      activeClass,
      sessions,
      activeSession,
      roster,
      login,
      logout,
      fetchClasses,
      selectClass,
      createClass,
      archiveClass,
      generateClassQr,
      fetchRoster,
      addStudentToClass,
      bulkAddStudents,
      removeStudentFromClass,
      createClassSession,
      startSession,
      pauseSession,
      resumeSession,
      endSession,
      fetchClassHistory,
      fetchClassReport
    }}>
      {children}
    </FacultyAuthContext.Provider>
  );
};

export const useFacultyAuth = () => {
  const context = useContext(FacultyAuthContext);
  if (!context) throw new Error('useFacultyAuth must be used within FacultyAuthProvider');
  return context;
};
