import React from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import {
  ShieldCheck,
  BookOpen,
  Users,
  PlayCircle,
  PauseCircle,
  StopCircle,
  QrCode,
  Radio,
  FileBarChart
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigateTab: (tab: 'CLASSES' | 'MONITOR' | 'REPORTS') => void;
  onOpenClassDetail: (cls: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateTab, onOpenClassDetail }) => {
  const { faculty, institution, classes, activeClass, activeSession, startSession, pauseSession, resumeSession, endSession } = useFacultyAuth();

  const totalStudents = classes.reduce((sum, c) => sum + 5, 0); // approximate based on seed

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {institution?.name || 'LockWatch Faculty'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 2px' }}>
          {faculty?.name || 'Faculty Member'}
        </h1>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          {faculty?.designation || 'Professor'} • {faculty?.department}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8' }}>{classes.length}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>CLASSES</div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: activeSession ? '#10b981' : '#64748b' }}>
            {activeSession ? '1' : '0'}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>ACTIVE SESSION</div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{totalStudents}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>STUDENTS</div>
        </div>
      </div>

      {/* Active Session Section */}
      {activeSession ? (
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid #0284c7',
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{
              backgroundColor: activeSession.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(2, 132, 199, 0.2)',
              color: activeSession.status === 'ACTIVE' ? '#10b981' : '#38bdf8',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: '0.05em'
            }}>
              ● {activeSession.status}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
              Code: {activeSession.joinCode}
            </span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>
            {activeSession.name}
          </h2>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
            {activeSession.subject} • {activeSession.durationMinutes} Minutes Duration
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {activeSession.status === 'READY' && (
              <button
                onClick={() => startSession(activeSession.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <PlayCircle size={16} /> Broadcast Lock
              </button>
            )}
            {activeSession.status === 'ACTIVE' && (
              <button
                onClick={() => pauseSession(activeSession.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <PauseCircle size={16} /> Pause
              </button>
            )}
            {activeSession.status === 'PAUSED' && (
              <button
                onClick={() => resumeSession(activeSession.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <PlayCircle size={16} /> Resume
              </button>
            )}
            <button
              onClick={() => endSession(activeSession.id)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 8,
                padding: '10px 12px',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <StopCircle size={16} /> End & Unlock
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('MONITOR')}
            style={{
              width: '100%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 12px',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Radio size={16} /> Open Live Monitor
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#111827',
          border: '1px dashed #374151',
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
          marginBottom: 20
        }}>
          <Radio size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No Active Session</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
            Schedule or trigger a session from one of your persistent classes.
          </div>
          <button
            onClick={() => onNavigateTab('CLASSES')}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Go to Classes
          </button>
        </div>
      )}

      {/* Quick Action Grid */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>
        Quick Navigation
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button
          onClick={() => onNavigateTab('CLASSES')}
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 16,
            textAlign: 'left',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
        >
          <BookOpen size={22} color="#38bdf8" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Manage Classes</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Rosters & Join Codes</div>
        </button>

        <button
          onClick={() => onNavigateTab('MONITOR')}
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 16,
            textAlign: 'left',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
        >
          <Radio size={22} color="#10b981" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Live Room</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Realtime Device Lock</div>
        </button>

        <button
          onClick={() => {
            if (activeClass) onOpenClassDetail(activeClass);
            else onNavigateTab('CLASSES');
          }}
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 16,
            textAlign: 'left',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
        >
          <QrCode size={22} color="#f59e0b" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Class QR Code</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Instant Student Join</div>
        </button>

        <button
          onClick={() => onNavigateTab('REPORTS')}
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 16,
            textAlign: 'left',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
        >
          <FileBarChart size={22} color="#a855f7" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Analytics</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Attendance & Incidents</div>
        </button>
      </div>
    </div>
  );
};
