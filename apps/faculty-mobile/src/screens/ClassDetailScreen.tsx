import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

interface ClassDetailScreenProps {
  cls: any;
  onBack: () => void;
  onStartSession: (session: any) => void;
}

export const ClassDetailScreen: React.FC<ClassDetailScreenProps> = ({ cls, onBack, onStartSession }) => {
  const { roster, generateClassQr, addStudentToClass, bulkAddStudents, removeStudentFromClass, createClassSession } = useFacultyAuth();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<{ token: string; qrPayload: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [singleReg, setSingleReg] = useState('');
  const [bulkRegs, setBulkRegs] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionName, setSessionName] = useState(`${cls.subject} Assessment`);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    navigator.clipboard.writeText(cls.classCode);
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
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto' }}>
      {/* Top Navigation */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#38bdf8',
          fontSize: 14,
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
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                {cls.classCode}
              </span>
              <button
                onClick={handleCopyCode}
                title="Copy Class Code"
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#10b981' : '#94a3b8',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '10px 0 2px' }}>
              {cls.name}
            </h1>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {cls.subject} • Section {cls.section} • {cls.department}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={handleGenerateQr}
            style={{
              flex: 1,
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              color: '#f8fafc',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <QrCode size={16} color="#38bdf8" /> Join QR Code
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              flex: 1,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
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

      {/* Roster Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="#38bdf8" /> Enrolled Students ({roster.length})
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700,
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
          backgroundColor: '#111827',
          border: '1px dashed #374151',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          No students currently enrolled. Add students by register number or share the class code.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roster.map((student) => (
            <div
              key={student.studentId}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    {student.registerNumber}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {student.name}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  {student.deviceModel || 'Unregistered device'} • {student.platform || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {student.enrollmentStatus === 'SECURE_READY' ? (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#10b981',
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '4px 8px',
                    borderRadius: 6
                  }}>
                    <ShieldCheck size={13} /> READY
                  </span>
                ) : (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#f59e0b',
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    padding: '4px 8px',
                    borderRadius: 6
                  }}>
                    <AlertTriangle size={13} /> PENDING
                  </span>
                )}
                <button
                  onClick={() => removeStudentFromClass(cls.id, student.studentId)}
                  title="Remove from roster"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && qrData && (
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
            maxWidth: 380,
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>
              Class Join Code & QR
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>
              Display this in the classroom for students to join with LockWatch Student app.
            </p>

            <div style={{
              backgroundColor: '#1e293b',
              border: '2px solid #38bdf8',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>
                DIRECT CLASS CODE
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '0.15em',
                fontFamily: 'monospace',
                color: '#38bdf8',
                margin: '8px 0'
              }}>
                {cls.classCode}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Expires in 2 hours
              </div>
            </div>

            <div style={{
              backgroundColor: '#0a0d14',
              borderRadius: 8,
              padding: 12,
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#94a3b8',
              wordBreak: 'break-all',
              marginBottom: 20
            }}>
              Signed Token: {qrData.token}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
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
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
              Add Student to Roster
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setIsBulk(false)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: !isBulk ? '#0284c7' : '#1f2937',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Single Student
              </button>
              <button
                type="button"
                onClick={() => setIsBulk(true)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: isBulk ? '#0284c7' : '#1f2937',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Bulk Import
              </button>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 14
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddStudent}>
              {!isBulk ? (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    REGISTER NUMBER (e.g. 23AIML104)
                  </label>
                  <input
                    type="text"
                    placeholder="23AIML104"
                    value={singleReg}
                    onChange={(e) => setSingleReg(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    REGISTER NUMBERS (ONE PER LINE OR COMMA-SEPARATED)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="23AIML104&#10;23AIML118&#10;23AIML122"
                    value={bulkRegs}
                    onChange={(e) => setBulkRegs(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: 10,
                      color: '#ffffff',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: '1px solid #374151',
                    color: '#94a3b8',
                    borderRadius: 8,
                    padding: 10,
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
                    padding: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Adding...' : 'Add to Roster'}
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
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>
              Schedule Class Session
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>
              Pre-populates all {roster.length} enrolled students into this supervised session.
            </p>

            <form onSubmit={handleScheduleSession}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  SESSION TITLE
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    padding: 10,
                    color: '#ffffff',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  DURATION (MINUTES)
                </label>
                <input
                  type="number"
                  min={5}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    padding: 10,
                    color: '#ffffff',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
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
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Scheduling...' : 'Start Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
