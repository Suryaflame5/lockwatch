import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SummaryCards } from '../components/SummaryCards';
import { StudentCard } from '../components/StudentCard';
import { AlertsSidebar } from '../components/AlertsSidebar';
import { StudentDetailModal } from '../components/StudentDetailModal';
import { ReadinessModal } from '../components/ReadinessModal';
import { SessionControls } from '../components/SessionControls';
import { Search, Plus } from 'lucide-react';
import { DashboardSummaryMetrics, StudentReadinessResult } from '@lockwatch/shared-models';

interface DashboardViewProps {
  activeSession: any;
  onCreateSessionClick: () => void;
  onRefreshSession: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeSession,
  onCreateSessionClick,
  onRefreshSession
}) => {
  const { client } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<DashboardSummaryMetrics>({
    totalStudents: 0,
    connected: 0,
    active: 0,
    emergency: 0,
    leftSupervision: 0,
    offline: 0,
    completed: 0,
    lockErrors: 0,
    ready: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [readinessList, setReadinessList] = useState<StudentReadinessResult[]>([]);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Load session state
  const loadLiveSessionData = async () => {
    if (!activeSession) return;
    try {
      const data = await client.getSessionLiveState(activeSession.id);
      setParticipants(data.participants);
      setMetrics(data.metrics);
      setAlerts(data.alerts);
    } catch (e) {
      console.error('Failed to load session live state', e);
    }
  };

  useEffect(() => {
    loadLiveSessionData();
    const interval = setInterval(loadLiveSessionData, 2500);
    return () => clearInterval(interval);
  }, [activeSession?.id]);

  const handleViewReadiness = async () => {
    if (!activeSession) return;
    try {
      const list = await client.getSessionReadiness(activeSession.id);
      setReadinessList(list);
      setShowReadinessModal(true);
    } catch (e) {
      console.error('Failed to load readiness', e);
    }
  };

  const handleStartSession = async () => {
    await client.startSession(activeSession.id);
    await loadLiveSessionData();
    onRefreshSession();
  };

  const handlePauseSession = async () => {
    await client.pauseSession(activeSession.id);
    await loadLiveSessionData();
    onRefreshSession();
  };

  const handleResumeSession = async () => {
    await client.resumeSession(activeSession.id);
    await loadLiveSessionData();
    onRefreshSession();
  };

  const handleEndSession = async () => {
    await client.endSession(activeSession.id);
    await loadLiveSessionData();
    onRefreshSession();
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await client.acknowledgeAlert(alertId);
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  // Filter & search students
  const filteredParticipants = participants.filter(p => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.registerNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CONNECTED') return p.networkQuality === 'ONLINE';
    return p.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Main Monitoring Content Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {activeSession ? (
          <>
            {/* Session Controls Toolbar */}
            <SessionControls
              session={activeSession}
              studentCount={participants.length}
              onStart={handleStartSession}
              onPause={handlePauseSession}
              onResume={handleResumeSession}
              onEnd={handleEndSession}
              onViewReadiness={handleViewReadiness}
            />

            {/* Metrics Counters Strip */}
            <SummaryCards
              metrics={metrics}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />

            {/* Search & Filter Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              gap: '16px'
            }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <input
                  type="text"
                  placeholder="Search by student name or register number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#101522',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 34px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Showing <strong>{filteredParticipants.length}</strong> of {participants.length} students
              </div>
            </div>

            {/* Student Cards Grid (Section 13 & 46) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px'
            }}>
              {filteredParticipants.map(participant => (
                <StudentCard
                  key={participant.id}
                  participant={participant}
                  onClick={() => setSelectedStudent(participant)}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ fontSize: '18px', color: '#f8fafc' }}>No active session found</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Create an examination session to begin monitoring.</p>
            <button
              onClick={onCreateSessionClick}
              style={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              Create Session
            </button>
          </div>
        )}
      </div>

      {/* Realtime Alert Sidebar */}
      <AlertsSidebar
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSelectStudent={(studentId) => {
          const p = participants.find(part => part.studentId === studentId);
          if (p) setSelectedStudent(p);
        }}
      />

      {/* Student Telemetry Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          participant={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Pre-Session Readiness Modal */}
      <ReadinessModal
        isOpen={showReadinessModal}
        onClose={() => setShowReadinessModal(false)}
        readinessList={readinessList}
      />
    </div>
  );
};
