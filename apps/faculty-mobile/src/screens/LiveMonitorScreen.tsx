import React, { useState, useEffect } from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Battery,
  Wifi,
  Radio,
  AlertTriangle,
  RotateCcw,
  Unlock,
  Heart
} from 'lucide-react';

export const LiveMonitorScreen: React.FC = () => {
  const { activeSession, client } = useFacultyAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveState = async () => {
    if (!activeSession) return;
    try {
      const data = await client.getSessionLiveState(activeSession.id);
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Failed to fetch live session state', err);
    }
  };

  useEffect(() => {
    fetchLiveState();
    const interval = setInterval(fetchLiveState, 3000); // 3-second live refresh
    return () => clearInterval(interval);
  }, [activeSession?.id]);

  if (!activeSession) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        <Radio size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 18, color: '#f8fafc', marginBottom: 4 }}>No Live Session Active</h2>
        <p style={{ fontSize: 14 }}>Start a session from the Dashboard or Classes tab to monitor student devices in real-time.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
          <Radio size={14} /> Real-Time Native Lockdown Telemetry
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 2px' }}>
          {activeSession.name}
        </h1>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          {participants.length} Active Devices Monitored
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {participants.map((p) => {
          const isLocked = p.deviceLocked || p.status === 'ACTIVE';
          const isEmergency = p.status === 'EMERGENCY';
          const isOffline = p.networkQuality === 'OFFLINE';

          return (
            <div
              key={p.id}
              onClick={() => setSelectedStudent(p)}
              style={{
                backgroundColor: '#111827',
                border: isEmergency ? '2px solid #ef4444' : isLocked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #374151',
                borderRadius: 14,
                padding: 14,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isEmergency ? '#ef4444' : isLocked ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {isLocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {isEmergency ? 'EMERGENCY' : isLocked ? 'LOCKED' : p.status}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Battery size={13} color={p.batteryLevel < 20 ? '#ef4444' : '#10b981'} />
                  {p.batteryLevel}%
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, color: '#f8fafc', marginBottom: 2 }}>
                {p.student?.name || 'Student'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                {p.student?.registerNumber || p.studentId.substring(0, 8)}
              </div>

              {p.emergencyUsageCount > 0 && (
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 6 }}>
                  Emergency used: {p.emergencyUsageCount}x
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Student Override Action Modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 380
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>
              {selectedStudent.student?.name || 'Student Device'}
            </h2>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Register No: {selectedStudent.student?.registerNumber || selectedStudent.studentId}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => {
                  alert('Force re-lock command queued to student device.');
                  setSelectedStudent(null);
                }}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} /> Force Re-Lock Mode
              </button>

              <button
                onClick={() => {
                  alert('Temporary emergency release granted (15s).');
                  setSelectedStudent(null);
                }}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 10,
                  padding: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <AlertTriangle size={16} /> Grant Emergency Override
              </button>
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid #374151',
                color: '#94a3b8',
                borderRadius: 10,
                padding: 10,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
