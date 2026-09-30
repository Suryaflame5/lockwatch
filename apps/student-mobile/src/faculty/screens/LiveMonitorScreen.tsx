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
  X
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
      <div style={{ padding: 40, textAlign: 'center', color: '#666666' }}>
        <Radio size={36} color="#888888" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 17, color: '#000000', marginBottom: 4, fontWeight: 700 }}>No Session Currently Active</h2>
        <p style={{ fontSize: 13, color: '#666666' }}>Start a session from the Dashboard or Classes tab to monitor student device participation in real-time.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', color: '#111111' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#000000', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Radio size={14} /> Real-Time Supervised Examination Telemetry
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 2px', color: '#000000' }}>
          {activeSession.name}
        </h1>
        <div style={{ fontSize: 13, color: '#666666' }}>
          {participants.length} Active Devices Monitored Live
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {participants.map((p) => {
          const isLocked = p.deviceLocked || p.status === 'ACTIVE';
          const isEmergency = p.status === 'EMERGENCY';
          const isOffline = p.networkQuality === 'OFFLINE' || p.status === 'OFFLINE';

          return (
            <div
              key={p.id}
              onClick={() => setSelectedStudent(p)}
              style={{
                backgroundColor: '#FFFFFF',
                border: isEmergency ? '2px solid #000000' : '1px solid #D9D9D9',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: isEmergency ? '#000000' : isOffline ? '#888888' : '#111111',
                  backgroundColor: isEmergency ? '#F0F0F0' : '#FAFAFA',
                  border: '1px solid #E5E5E5',
                  padding: '2px 5px',
                  borderRadius: 4
                }}>
                  {isEmergency ? '▲ EMERGENCY' : isLocked ? '● ACTIVE' : isOffline ? '✕ OFFLINE' : '○ READY'}
                </span>
                <span style={{ fontSize: 11, color: '#666666', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Battery size={13} color="#444444" />
                  {p.batteryLevel}%
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13, color: '#000000', marginBottom: 2 }}>
                {p.studentName || p.student?.name || 'Student'}
              </div>
              <div style={{ fontSize: 11, color: '#666666', fontFamily: 'monospace' }}>
                {p.registerNumber || p.student?.registerNumber || p.studentId.substring(0, 8)}
              </div>

              {p.emergencyUsageCount > 0 && (
                <div style={{ fontSize: 10, color: '#000000', fontWeight: 700, marginTop: 6, backgroundColor: '#F4F4F4', padding: '2px 4px', borderRadius: 3, display: 'inline-block' }}>
                  Emergency: {p.emergencyUsageCount}x
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
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #000000',
            borderRadius: 12,
            padding: 24,
            maxWidth: 380,
            width: '100%',
            color: '#111111'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#000000' }}>
                Student Device Controls
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16, fontSize: 13 }}>
              <div>Student: <strong>{selectedStudent.studentName || selectedStudent.student?.name}</strong></div>
              <div>Register No: <strong>{selectedStudent.registerNumber || selectedStudent.student?.registerNumber}</strong></div>
              <div style={{ marginTop: 4, color: '#666666' }}>
                Status: {selectedStudent.status} • Battery: {selectedStudent.batteryLevel}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
