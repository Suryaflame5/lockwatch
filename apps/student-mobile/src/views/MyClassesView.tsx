import React, { useState } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { BookOpen, ShieldCheck, QrCode, Plus, LogOut, PlayCircle, Key } from 'lucide-react';

interface MyClassesViewProps {
  onEnterSession: (session: any) => void;
}

export const MyClassesView: React.FC<MyClassesViewProps> = ({ onEnterSession }) => {
  const { student, enrolledClasses, logout, joinClassByCode, joinClassByQr } = useStudentAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTab, setJoinTab] = useState<'CODE' | 'QR'>('CODE');
  const [inputCode, setInputCode] = useState('');
  const [inputQrToken, setInputQrToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await joinClassByCode(inputCode.trim().toUpperCase());
      setInputCode('');
      setShowJoinModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to join class');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQrToken.trim()) return;
    setError(null);
    setLoading(true);
    try {
      // Support raw token or JSON QR payload
      let token = inputQrToken.trim();
      try {
        const parsed = JSON.parse(token);
        if (parsed.token) token = parsed.token;
      } catch {
        // Raw token
      }
      await joinClassByQr(token);
      setInputQrToken('');
      setShowJoinModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to join class by QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0d14', color: '#f8fafc', padding: '24px 16px' }}>
      {/* Top Header */}
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            LockWatch Student
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0 0' }}>
            {student?.name || 'Student'}
          </h1>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            Reg: {student?.registerNumber} • {student?.department}
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Device Security Verified Banner */}
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20
        }}>
          <ShieldCheck size={24} color="#10b981" />
          <div>
            <div style={{ fontWeight: 600, color: '#10b981', fontSize: 14 }}>
              Native Assessment Protection Active
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Device Owner Lock Task & Apple Assessment APIs armed. Exiting locked session preserves class enrollment.
            </div>
          </div>
        </div>

        {/* Classes Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="#38bdf8" /> My Enrolled Classes ({enrolledClasses.length})
          </h2>
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Join Class
          </button>
        </div>

        {/* List of Enrolled Classes */}
        {enrolledClasses.length === 0 ? (
          <div style={{
            backgroundColor: '#111827',
            border: '1px dashed #374151',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center'
          }}>
            <BookOpen size={36} color="#4b5563" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>No Enrolled Classes</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
              Join your class using the 6-character code (e.g. AIML-E-8K42) or QR code provided by faculty.
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Join Class Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enrolledClasses.map(({ class: cls, activeSession }) => (
              <div
                key={cls.id}
                style={{
                  backgroundColor: '#111827',
                  border: activeSession ? '1px solid #38bdf8' : '1px solid #1f2937',
                  borderRadius: 12,
                  padding: 16,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{
                      backgroundColor: '#1e293b',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}>
                      {cls.classCode}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 2px' }}>
                      {cls.name}
                    </h3>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      {cls.subject} • Sec {cls.section}
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12
                  }}>
                    ENROLLED
                  </span>
                </div>

                {/* Active Session Notification within Class */}
                {activeSession && (
                  <div style={{
                    marginTop: 12,
                    backgroundColor: 'rgba(2, 132, 199, 0.15)',
                    border: '1px solid #0284c7',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        LIVE SUPERVISED SESSION
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                        {activeSession.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        Lockdown required • Ends in {activeSession.durationMinutes} mins
                      </div>
                    </div>
                    <button
                      onClick={() => onEnterSession(activeSession)}
                      style={{
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <PlayCircle size={16} /> Enter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
            maxWidth: 420
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
              Join a Class
            </h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setJoinTab('CODE')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: joinTab === 'CODE' ? '#0284c7' : '#1f2937',
                  color: joinTab === 'CODE' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Key size={15} /> Class Code
              </button>
              <button
                type="button"
                onClick={() => setJoinTab('QR')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: joinTab === 'QR' ? '#0284c7' : '#1f2937',
                  color: joinTab === 'QR' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <QrCode size={15} /> Scan / Enter QR
              </button>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            {joinTab === 'CODE' ? (
              <form onSubmit={handleJoinByCode}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                  Class Code (e.g. AIML-E-8K42)
                </label>
                <input
                  type="text"
                  placeholder="AIML-E-8K42"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: 8,
                    fontSize: 16,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    boxSizing: 'border-box',
                    marginBottom: 20
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: '1px solid #374151',
                      color: '#94a3b8',
                      borderRadius: 8,
                      padding: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'Joining...' : 'Join Class'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleJoinByQr}>
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                  Paste QR Token / Camera Scan
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste QR JSON payload or token string..."
                  value={inputQrToken}
                  onChange={(e) => setInputQrToken(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    marginBottom: 20
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: '1px solid #374151',
                      color: '#94a3b8',
                      borderRadius: 8,
                      padding: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'Joining...' : 'Join Class'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
