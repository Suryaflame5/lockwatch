import React, { useState, useEffect } from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import {
  ArrowLeft,
  QrCode,
  PlayCircle,
  UserPlus,
  Users,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Copy,
  Check,
  Radio,
  Clock
} from 'lucide-react';

interface ClassDetailScreenProps {
  cls: any;
  onBack: () => void;
  onStartSession: (session: any) => void;
}

export const ClassDetailScreen: React.FC<ClassDetailScreenProps> = ({ cls, onBack, onStartSession }) => {
  const { roster, client, generateClassQr, addStudentToClass, bulkAddStudents, removeStudentFromClass, createClassSession } = useFacultyAuth();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<{ token: string; qrPayload: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [singleReg, setSingleReg] = useState('');
  const [bulkRegs, setBulkRegs] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionName, setSessionName] = useState(`${cls.subject || cls.name} Exam`);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session participation metrics
  const [sessionMetrics, setSessionMetrics] = useState<{
    totalEnrolled: number;
    joined: number;
    ready: number;
    active: number;
    emergency: number;
    interrupted: number;
    offline: number;
    notJoined: number;
  }>({
    totalEnrolled: roster.length,
    joined: 0,
    ready: 0,
    active: 0,
    emergency: 0,
    interrupted: 0,
    offline: 0,
    notJoined: roster.length
  });

  const fetchSessionStatus = async () => {
    try {
      const res = await client.getClassSessionStatus(cls.id);
      if (res && res.metrics) {
        setSessionMetrics(res.metrics);
      }
    } catch {
      // Fallback calculation from local roster
      const total = roster.length;
      const joined = roster.filter((r: any) => r.isSessionJoined || r.sessionStatus === 'ACTIVE').length;
      setSessionMetrics({
        totalEnrolled: total,
        joined,
        ready: roster.filter((r: any) => r.sessionStatus === 'READY').length,
        active: roster.filter((r: any) => r.sessionStatus === 'ACTIVE').length,
        emergency: roster.filter((r: any) => r.sessionStatus === 'EMERGENCY').length,
        interrupted: roster.filter((r: any) => r.sessionStatus === 'INTERRUPTED').length,
        offline: roster.filter((r: any) => r.sessionStatus === 'OFFLINE').length,
        notJoined: total - joined
      });
    }
  };

  useEffect(() => {
    fetchSessionStatus();
    const interval = setInterval(fetchSessionStatus, 3000);
    return () => clearInterval(interval);
  }, [cls.id, roster.length]);

  const handleGenerateQr = async () => {
    try {
      const data = await generateClassQr(cls.id);
      setQrData(data);
      setShowQrModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to generate QR');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cls.classCode || cls.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isBulk) {
        const regs = bulkRegs.split(/[\n,]+/).map(r => r.trim()).filter(Boolean);
        await bulkAddStudents(cls.id, regs);
        setBulkRegs('');
      } else {
        await addStudentToClass(cls.id, singleReg.trim().toUpperCase());
        setSingleReg('');
      }
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sess = await createClassSession(cls.id, {
        name: sessionName,
        durationMinutes: Number(durationMinutes)
      });
      setShowScheduleModal(false);
      onStartSession(sess);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', color: '#111111' }}>
      {/* Top Navigation */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#111111',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16
        }}
      >
        <ArrowLeft size={16} /> Back to Classes
      </button>

      {/* Class Header Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D9D9D9',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                backgroundColor: '#000000',
                color: '#FFFFFF',
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4
              }}>
                {cls.classCode || cls.code}
              </span>
              <button
                onClick={handleCopyCode}
                title="Copy Class Code"
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#000000' : '#888888',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 2px', color: '#000000' }}>
              {cls.name}
            </h1>
            <div style={{ fontSize: 13, color: '#666666' }}>
              {cls.subject || 'Core Curriculum'} • Section {cls.section || 'A'} • {cls.department || 'Computer Science'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={handleGenerateQr}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9D9D9',
              color: '#111111',
              borderRadius: 6,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <QrCode size={16} color="#000000" /> Class QR Code
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              flex: 1,
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <PlayCircle size={16} /> Schedule Session
          </button>
        </div>
      </div>

      {/* Participation Separation Dashboard Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D9D9D9',
        borderRadius: 10,
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#666666', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          SESSION PARTICIPATION METRICS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div style={{ backgroundColor: '#F8F8F7', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #E5E5E5' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#000000' }}>{sessionMetrics.totalEnrolled}</div>
            <div style={{ fontSize: '11px', color: '#666666', fontWeight: 600, marginTop: '2px' }}>TOTAL ENROLLED</div>
          </div>
          <div style={{ backgroundColor: '#F8F8F7', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #E5E5E5' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#000000' }}>{sessionMetrics.joined}</div>
            <div style={{ fontSize: '11px', color: '#666666', fontWeight: 600, marginTop: '2px' }}>SESSION JOINED</div>
          </div>
        </div>

        {/* Detailed Breakdowns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          textAlign: 'center',
          fontSize: '11px',
          paddingTop: '8px',
          borderTop: '1px solid #EFEFEF'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#000000' }}>{sessionMetrics.active}</div>
            <div style={{ color: '#666666', fontSize: '10px' }}>● Active</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#000000' }}>{sessionMetrics.ready}</div>
            <div style={{ color: '#666666', fontSize: '10px' }}>○ Ready</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#000000' }}>{sessionMetrics.emergency}</div>
            <div style={{ color: '#666666', fontSize: '10px' }}>▲ Emergency</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#000000' }}>{sessionMetrics.offline}</div>
            <div style={{ color: '#666666', fontSize: '10px' }}>✕ Offline</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#000000' }}>{sessionMetrics.notJoined}</div>
            <div style={{ color: '#666666', fontSize: '10px' }}>- Not Joined</div>
          </div>
        </div>
      </div>

      {/* Roster Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#000000' }}>
          Class Roster ({roster.length} Students)
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <UserPlus size={14} /> Add Student
        </button>
      </div>

      {roster.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px dashed #D9D9D9',
          borderRadius: 8,
          padding: 24,
          textAlign: 'center',
          color: '#666666'
        }}>
          No students currently enrolled. Students can enroll with code <strong>{cls.classCode || cls.code}</strong>.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roster.map((student) => {
            const status = (student as any).sessionStatus || 'NOT_JOINED';
            return (
              <div
                key={student.studentId}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      backgroundColor: '#F0F0F0',
                      color: '#000000',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {(student as any).registerNumber || student.registerNumber}
                    </span>
                    <strong style={{ fontSize: 13, color: '#000000' }}>
                      {student.displayName || student.name || 'Student'}
                    </strong>
                  </div>
                  <div style={{ fontSize: 11, color: '#666666', marginTop: 3 }}>
                    Join Method: {(student as any).joinMethod || 'CODE'} • {(student as any).platform || 'Android'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: '1px solid #D9D9D9',
                    backgroundColor: status === 'ACTIVE' ? '#000000' : '#FAFAFA',
                    color: status === 'ACTIVE' ? '#FFFFFF' : '#444444'
                  }}>
                    {status === 'ACTIVE' ? '● ACTIVE' : status === 'READY' ? '○ READY' : status === 'EMERGENCY' ? '▲ EMERGENCY' : status === 'OFFLINE' ? '✕ OFFLINE' : '- NOT JOINED'}
                  </span>
                  <button
                    onClick={() => removeStudentFromClass(cls.id, student.studentId)}
                    title="Remove from Class"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888888',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && qrData && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
            maxWidth: 360,
            width: '100%',
            textAlign: 'center',
            color: '#111111'
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px 0', color: '#000000' }}>
              Class Enrollment QR Code
            </h3>
            <div style={{ fontSize: 12, color: '#666666', marginBottom: 16 }}>
              Display this on projector. Students scan to join {cls.name}.
            </div>

            <div style={{
              backgroundColor: '#F8F8F7',
              border: '1px solid #D9D9D9',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              fontFamily: 'monospace',
              fontSize: 11,
              wordBreak: 'break-all'
            }}>
              <div>QR Token:</div>
              <strong style={{ fontSize: 13, color: '#000000' }}>{qrData.token}</strong>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9D9D9',
            borderRadius: 12,
            padding: 24,
            maxWidth: 380,
            width: '100%',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
            color: '#111111'
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px 0', color: '#000000' }}>
              Add Student to Class
            </h3>
            <div style={{ fontSize: 12, color: '#666666', marginBottom: 16 }}>
              Enroll by student register / roll number.
            </div>

            {error && (
              <div style={{
                backgroundColor: '#F8F8F8',
                border: '1px solid #000000',
                borderRadius: 6,
                padding: 10,
                fontSize: 12,
                color: '#000000',
                marginBottom: 12
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddStudent}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                  REGISTER NUMBER
                </label>
                <input
                  type="text"
                  placeholder="e.g. 23AIML104"
                  value={singleReg}
                  onChange={e => setSingleReg(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    minHeight: 48,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #D9D9D9',
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9D9D9',
                    borderRadius: 6,
                    fontSize: 13,
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
                    height: 48,
                    minHeight: 48,
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Adding...' : 'Add to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9D9D9',
            borderRadius: 12,
            padding: 24,
            maxWidth: 380,
            width: '100%',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
            color: '#111111'
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px 0', color: '#000000' }}>
              Schedule Supervised Session
            </h3>
            <div style={{ fontSize: 12, color: '#666666', marginBottom: 16 }}>
              Configure examination parameters for {cls.name}.
            </div>

            <form onSubmit={handleScheduleSession}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                  SESSION / EXAM TITLE
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    minHeight: 48,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #D9D9D9',
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                  DURATION (MINUTES)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: 48,
                    minHeight: 48,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #D9D9D9',
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9D9D9',
                    borderRadius: 6,
                    fontSize: 13,
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
                    height: 48,
                    minHeight: 48,
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Creating...' : 'Create & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
