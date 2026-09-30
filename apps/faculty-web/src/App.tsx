import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { FacultyLoginView } from './views/FacultyLoginView';
import { DashboardView } from './views/DashboardView';
import { ReportsView } from './views/ReportsView';
import { AuditLogsView } from './views/AuditLogsView';
import { Header } from './components/Header';
import { CreateSessionModal } from './components/CreateSessionModal';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, client } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const fetchSessions = async () => {
    try {
      const list = await client.getFacultySessions();
      setSessions(list);
      if (list.length > 0) {
        // Pick the latest active or ready session
        const current = list.find((s: any) => s.status === 'ACTIVE' || s.status === 'READY') || list[0];
        setActiveSession(current);
      }
    } catch (e) {
      console.error('Failed to load faculty sessions', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  // Connect to realtime WebSocket
  useEffect(() => {
    if (!isAuthenticated || !activeSession?.id) return;

    const token = client.getAccessToken();
    const wsUrl = `ws://localhost:4000/ws?token=${token}&sessionId=${activeSession.id}`;
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [isAuthenticated, activeSession?.id]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0a0d14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8'
      }}>
        Initializing LockWatch Console...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacultyLoginView />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0d14' }}>
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeSession={activeSession}
        isConnected={isConnected}
      />

      <main>
        {currentTab === 'dashboard' || currentTab === 'monitor' ? (
          <DashboardView
            activeSession={activeSession}
            onCreateSessionClick={() => setShowCreateModal(true)}
            onRefreshSession={fetchSessions}
          />
        ) : currentTab === 'reports' ? (
          <ReportsView activeSessionId={activeSession?.id} />
        ) : (
          <AuditLogsView activeSessionId={activeSession?.id} />
        )}
      </main>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchSessions();
        }}
        onSubmit={async (data) => {
          const session = await client.createSession(data);
          setActiveSession(session);
          return session;
        }}
      />
    </div>
  );
};
