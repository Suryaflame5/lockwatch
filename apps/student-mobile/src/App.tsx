import React, { useState } from 'react';
import { useStudentAuth } from './context/StudentAuthContext';
import { useFacultyAuth } from './faculty/context/FacultyAuthContext';
import { UnifiedLoginView } from './views/UnifiedLoginView';
import { FacultyWorkspaceView } from './faculty/FacultyWorkspaceView';
import { StudentHomeView } from './views/StudentHomeView';
import { PreSessionReadinessView } from './views/PreSessionReadinessView';
import { ActiveSessionView } from './views/ActiveSessionView';
import { SessionEndedView } from './views/SessionEndedView';

export const App: React.FC = () => {
  const studentAuth = useStudentAuth();
  const facultyAuth = useFacultyAuth();
  const [sessionPhase, setSessionPhase] = useState<'CLASSES' | 'READINESS' | 'ACTIVE' | 'ENDED'>('CLASSES');
  const [completedSession, setCompletedSession] = useState<any | null>(null);

  if (studentAuth.isLoading || facultyAuth.isLoading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#111111',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Initializing LockWatch...
      </div>
    );
  }

  // If faculty is logged in, show Faculty Workspace
  if (facultyAuth.isAuthenticated) {
    return <FacultyWorkspaceView />;
  }

  // If neither is authenticated, show Unified Login Portal
  if (!studentAuth.isAuthenticated) {
    return <UnifiedLoginView />;
  }

  // Student is authenticated:
  if (sessionPhase === 'ENDED') {
    return (
      <SessionEndedView
        session={completedSession || studentAuth.activeSession}
        onReturnToClasses={() => {
          setCompletedSession(null);
          studentAuth.leaveSession();
          setSessionPhase('CLASSES');
        }}
      />
    );
  }

  if (sessionPhase === 'ACTIVE' && studentAuth.activeSession) {
    return (
      <ActiveSessionView
        onSessionFinished={() => {
          setCompletedSession(studentAuth.activeSession);
          setSessionPhase('ENDED');
        }}
      />
    );
  }

  if (sessionPhase === 'READINESS' && studentAuth.activeSession) {
    return (
      <PreSessionReadinessView
        onSessionStarted={() => setSessionPhase('ACTIVE')}
        onCancel={() => {
          studentAuth.leaveSession();
          setSessionPhase('CLASSES');
        }}
      />
    );
  }

  // Default Student view: Student Home
  return (
    <StudentHomeView
      onEnterSession={(session) => {
        studentAuth.setActiveSession(session);
        setSessionPhase('READINESS');
      }}
    />
  );
};
