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
  FileBarChart,
  ArrowRight
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigateTab: (tab: 'CLASSES' | 'MONITOR' | 'REPORTS') => void;
  onOpenClassDetail: (cls: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateTab, onOpenClassDetail }) => {
  const { faculty, institution, classes, activeClass, activeSession, startSession, pauseSession, resumeSession, endSession } = useFacultyAuth();

  const totalStudents = classes.reduce((sum, c) => sum + ((c as any).studentCount ?? 60), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = faculty?.name || 'Professor';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', color: '#111111' }}>
      {/* Top Banner with dynamic greeting */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#666666', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {institution?.name || 'Apex Institute of Technology'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 2px', color: '#000000' }}>
          {getGreeting()}
        </h1>
        <div style={{ fontSize: 13, color: '#666666' }}>
          {faculty?.designation || 'Faculty Member'} • {faculty?.department || 'Department of Computer Science'}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>{classes.length}</div>
          <div style={{ fontSize: 10, color: '#666666', fontWeight: 700, marginTop: 2, letterSpacing: '0.04em' }}>TOTAL CLASSES</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>
            {activeSession ? '1' : '0'}
          </div>
          <div style={{ fontSize: 10, color: '#666666', fontWeight: 700, marginTop: 2, letterSpacing: '0.04em' }}>ACTIVE SESSION</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>{totalStudents}</div>
          <div style={{ fontSize: 10, color: '#666666', fontWeight: 700, marginTop: 2, letterSpacing: '0.04em' }}>ENROLLED STUDENTS</div>
        </div>
      </div>

      {/* Active Session Section */}
      {activeSession ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #000000',
          borderRadius: 10,
          padding: 18,
          marginBottom: 20,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 4,
              letterSpacing: '0.04em'
            }}>
              ● {activeSession.status}
            </span>
            <span style={{ fontSize: 12, color: '#666666', fontFamily: 'monospace' }}>
              Session Code: <strong>{activeSession.joinCode}</strong>
            </span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: '#000000' }}>
            {activeSession.name}
          </h2>
          <div style={{ fontSize: 13, color: '#666666', marginBottom: 16 }}>
            {activeSession.subject} • {activeSession.durationMinutes || 90} Minutes Duration
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {activeSession.status === 'READY' && (
              <button
                onClick={() => startSession(activeSession.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <PlayCircle size={16} /> Start Session Lockdown
              </button>
            )}

            {activeSession.status === 'ACTIVE' && (
              <>
                <button
                  onClick={() => pauseSession(activeSession.id)}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #111111',
                    color: '#111111',
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <PauseCircle size={16} /> Pause
                </button>
                <button
                  onClick={() => endSession(activeSession.id)}
                  style={{
                    flex: 1,
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <StopCircle size={16} /> End Session
                </button>
              </>
            )}

            {activeSession.status === 'PAUSED' && (
              <>
                <button
                  onClick={() => resumeSession(activeSession.id)}
                  style={{
                    flex: 1,
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <PlayCircle size={16} /> Resume
                </button>
                <button
                  onClick={() => endSession(activeSession.id)}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #111111',
                    color: '#111111',
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <StopCircle size={16} /> End Session
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('MONITOR')}
            style={{
              width: '100%',
              backgroundColor: '#FAFAFA',
              border: '1px solid #D9D9D9',
              borderRadius: 6,
              padding: '10px',
              fontSize: 12,
              fontWeight: 600,
              color: '#000000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Radio size={14} /> View Real-time Live Roster & Device Telemetry
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px dashed #D9D9D9',
          borderRadius: 10,
          padding: '24px 16px',
          textAlign: 'center',
          marginBottom: 20
        }}>
          <ShieldCheck size={28} color="#888888" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>No Session Currently Active</div>
          <div style={{ fontSize: 12, color: '#666666', marginTop: 4, marginBottom: 16 }}>
            Select a class below to schedule or start a supervised examination session.
          </div>
          <button
            onClick={() => onNavigateTab('CLASSES')}
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View Classes
          </button>
        </div>
      )}

      {/* Persistent Classes List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#000000' }}>
          Managed Classes ({classes.length})
        </h2>
        <button
          onClick={() => onNavigateTab('CLASSES')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            color: '#000000',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Manage All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {classes.map((cls) => {
          const count = (cls as any).studentCount ?? 60;
          return (
            <div
              key={cls.id}
              onClick={() => onOpenClassDetail(cls)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D9D9',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    backgroundColor: '#F0F0F0',
                    color: '#111111',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    {cls.classCode || (cls as any).code}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#000000' }}>
                    {cls.name}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#666666' }}>
                  {cls.department} • {count} Students Enrolled
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#888888' }}>View Roster</span>
                <ArrowRight size={14} color="#888888" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
