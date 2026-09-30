import React, { useState } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import {
  Home,
  BookOpen,
  PlusCircle,
  User,
  ShieldCheck,
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Radio,
  Clock,
  KeyRound
} from 'lucide-react';

interface StudentHomeViewProps {
  onEnterSession: (session: any) => void;
}

export const StudentHomeView: React.FC<StudentHomeViewProps> = ({ onEnterSession }) => {
  const { student, user, enrolledClasses, logout, joinClassByCode, joinClassByQr } = useStudentAuth();

  const [activeTab, setActiveTab] = useState<'HOME' | 'CLASSES' | 'JOIN' | 'PROFILE'>('HOME');

  // Join Class State
  const [joinMethod, setJoinMethod] = useState<'CODE' | 'QR'>('CODE');
  const [classCodeInput, setClassCodeInput] = useState('');
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [confirmName, setConfirmName] = useState(student?.name || user?.name || '');
  const [confirmRegNo, setConfirmRegNo] = useState(student?.registerNumber || '');
  const [joinStep, setJoinStep] = useState<'INPUT' | 'CONFIRM'>('INPUT');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Compute Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = student?.name ? student.name.split(' ')[0] : 'Student';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  // Find if any class has a live session
  const activeClassWithSession = enrolledClasses.find(
    c => c.activeSession && (c.activeSession.status === 'ACTIVE' || c.activeSession.status === 'READY')
  );

  const handleStartJoinConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (joinMethod === 'CODE' && !classCodeInput.trim()) {
      setJoinError('Please enter a class code.');
      return;
    }
    if (joinMethod === 'QR' && !qrTokenInput.trim()) {
      setJoinError('Please enter a QR token.');
      return;
    }
    setConfirmName(student?.name || user?.name || '');
    setConfirmRegNo(student?.registerNumber || '');
    setJoinStep('CONFIRM');
  };

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmName.trim() || !confirmRegNo.trim()) {
      setJoinError('Please confirm your Full Name and Register Number.');
      return;
    }
    setJoinError(null);
    setJoinLoading(true);
    try {
      let resMessage = '';
      if (joinMethod === 'CODE') {
        const res = await joinClassByCode(classCodeInput.trim().toUpperCase(), {
          displayName: confirmName.trim(),
          registerNumber: confirmRegNo.trim().toUpperCase()
        });
        resMessage = res.message || 'Successfully joined class!';
      } else {
        let token = qrTokenInput.trim();
        try {
          const parsed = JSON.parse(token);
          if (parsed.token) token = parsed.token;
        } catch {
          // raw token
        }
        const res = await joinClassByQr(token, {
          displayName: confirmName.trim(),
          registerNumber: confirmRegNo.trim().toUpperCase()
        });
        resMessage = res.message || 'Successfully joined class!';
      }

      setJoinSuccess(resMessage);
      setClassCodeInput('');
      setQrTokenInput('');
      setJoinStep('INPUT');
      setTimeout(() => {
        setJoinSuccess(null);
        setActiveTab('CLASSES');
      }, 1500);
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join class. Please verify the code or check if register number is already taken.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F8F7',
      color: '#111111',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Scrollable Main Area */}
      <div style={{
        flex: 1,
        padding: 'max(16px, env(safe-area-inset-top)) 16px 100px',
        maxWidth: '440px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid #E5E5E5'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#666666', textTransform: 'uppercase' }}>
              LOCKWATCH
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0 0 0', color: '#000000' }}>
              {getGreeting()}
            </h1>
            <div style={{ fontSize: '12px', color: '#666666', marginTop: '2px' }}>
              {student?.registerNumber || 'Student'} • {student?.department || 'Apex University'}
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9D9D9',
            padding: '6px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600
          }}>
            <ShieldCheck size={14} color="#000000" />
            <span>Supervised</span>
          </div>
        </div>

        {/* TAB 1: HOME */}
        {activeTab === 'HOME' && (
          <div>
            {/* Live Supervised Session Banner */}
            {activeClassWithSession ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #000000',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    ● SESSION ACTIVE
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#555555' }}>
                    Code: {activeClassWithSession.activeSession.joinCode}
                  </span>
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '6px 0 2px 0', color: '#000000' }}>
                  {activeClassWithSession.activeSession.name}
                </h2>
                <div style={{ fontSize: '12px', color: '#555555', marginBottom: '14px' }}>
                  {activeClassWithSession.class.name} • {activeClassWithSession.activeSession.durationMinutes || 90} Minutes
                </div>

                <button
                  onClick={() => onEnterSession(activeClassWithSession.activeSession)}
                  style={{
                    width: '100%',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Enter Supervised Session</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <Clock size={20} color="#666666" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111111' }}>
                    No Active Examination Session
                  </div>
                  <div style={{ fontSize: '12px', color: '#666666', marginTop: '3px', lineHeight: '1.4' }}>
                    Your faculty will launch the session during scheduled exam hours. When started, it will appear here immediately.
                  </div>
                </div>
              </div>
            )}

            {/* Quick Classes List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>
                Enrolled Classes ({enrolledClasses.length})
              </div>
              <button
                onClick={() => { setActiveTab('JOIN'); setJoinStep('INPUT'); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#000000',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                + Join Class
              </button>
            </div>

            {enrolledClasses.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px dashed #CCCCCC',
                borderRadius: '8px',
                padding: '28px 16px',
                textAlign: 'center'
              }}>
                <BookOpen size={24} color="#888888" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
                  No Classes Enrolled Yet
                </div>
                <div style={{ fontSize: '12px', color: '#666666', marginTop: '4px', marginBottom: '16px' }}>
                  Ask your professor for a 6-character class code or scan their QR code to enroll.
                </div>
                <button
                  onClick={() => { setActiveTab('JOIN'); setJoinStep('INPUT'); }}
                  style={{
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Join Your First Class
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {enrolledClasses.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111111' }}>
                        {item.class.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                        Code: {item.class.code} • {item.class.facultyName || 'Faculty'}
                      </div>
                    </div>
                    {item.activeSession ? (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#000000',
                        color: '#FFFFFF',
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        LIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#888888' }}>
                        Enrolled
                      </span>
                    )}
                  </div>
                ))}

                {enrolledClasses.length > 3 && (
                  <button
                    onClick={() => setActiveTab('CLASSES')}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9D9D9',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#111111',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    View All {enrolledClasses.length} Classes
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLASSES */}
        {activeTab === 'CLASSES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#000000' }}>
                My Classes ({enrolledClasses.length})
              </h2>
              <button
                onClick={() => { setActiveTab('JOIN'); setJoinStep('INPUT'); }}
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Join Class
              </button>
            </div>

            {enrolledClasses.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px dashed #D9D9D9',
                borderRadius: '8px',
                padding: '32px 16px',
                textAlign: 'center'
              }}>
                <BookOpen size={24} color="#888888" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
                  No Enrolled Classes
                </div>
                <div style={{ fontSize: '12px', color: '#666666', marginTop: '4px', marginBottom: '16px' }}>
                  Join using the code provided by your instructor.
                </div>
                <button
                  onClick={() => { setActiveTab('JOIN'); setJoinStep('INPUT'); }}
                  style={{
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Join Class
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {enrolledClasses.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9D9D9',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#F0F0F0',
                        color: '#111111',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {item.class.code}
                      </span>
                      {item.activeSession && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#000000',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          ● SESSION ACTIVE
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '6px 0 2px 0', color: '#000000' }}>
                      {item.class.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#666666', marginBottom: '10px' }}>
                      Instructor: {item.class.facultyName || 'Faculty Member'}
                    </div>

                    {/* Academic Identity Details in Class */}
                    <div style={{
                      backgroundColor: '#F8F8F7',
                      border: '1px solid #E5E5E5',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      color: '#444444',
                      marginBottom: item.activeSession ? '12px' : 0
                    }}>
                      <div>Enrolled as: <strong>{item.membership.displayName || student?.name}</strong></div>
                      <div>Register No: <strong>{item.membership.registerNumber || student?.registerNumber}</strong></div>
                    </div>

                    {item.activeSession && (
                      <button
                        onClick={() => onEnterSession(item.activeSession)}
                        style={{
                          width: '100%',
                          backgroundColor: '#000000',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Enter Supervised Session
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOIN CLASS */}
        {activeTab === 'JOIN' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: '#000000' }}>
              Join a Class
            </h2>

            {joinSuccess && (
              <div style={{
                backgroundColor: '#F4F4F4',
                border: '1px solid #000000',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{joinSuccess}</span>
              </div>
            )}

            {joinError && (
              <div style={{
                backgroundColor: '#F8F8F8',
                border: '1px solid #111111',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                color: '#111111',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{joinError}</span>
              </div>
            )}

            {joinStep === 'INPUT' ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D9D9',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
              }}>
                {/* Method selector */}
                <div style={{
                  display: 'flex',
                  backgroundColor: '#F0F0F0',
                  borderRadius: '6px',
                  padding: '2px',
                  marginBottom: '18px'
                }}>
                  <button
                    type="button"
                    onClick={() => setJoinMethod('CODE')}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      border: 'none',
                      borderRadius: '5px',
                      backgroundColor: joinMethod === 'CODE' ? '#000000' : 'transparent',
                      color: joinMethod === 'CODE' ? '#FFFFFF' : '#555555',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Class Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinMethod('QR')}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      border: 'none',
                      borderRadius: '5px',
                      backgroundColor: joinMethod === 'QR' ? '#000000' : 'transparent',
                      color: joinMethod === 'QR' ? '#FFFFFF' : '#555555',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    QR Code Token
                  </button>
                </div>

                <form onSubmit={handleStartJoinConfirmation}>
                  {joinMethod === 'CODE' ? (
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px' }}>
                        6-CHARACTER CLASS CODE
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. CS401A"
                        value={classCodeInput}
                        onChange={e => setClassCodeInput(e.target.value.toUpperCase())}
                        style={{
                          width: '100%',
                          height: '48px',
                          minHeight: '48px',
                          padding: '0 14px',
                          borderRadius: '6px',
                          border: '1px solid #D9D9D9',
                          fontSize: '16px',
                          fontWeight: 700,
                          letterSpacing: '0.15em',
                          textAlign: 'center',
                          backgroundColor: '#FFFFFF',
                          color: '#111111',
                          boxSizing: 'border-box'
                        }}
                        autoFocus
                      />
                      <div style={{ fontSize: '11px', color: '#777777', marginTop: '6px' }}>
                        Obtain the 6-character code from your class instructor or whiteboard.
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px' }}>
                        QR PAYLOAD / TOKEN
                      </label>
                      <input
                        type="text"
                        placeholder="Paste QR payload or token"
                        value={qrTokenInput}
                        onChange={e => setQrTokenInput(e.target.value)}
                        style={{
                          width: '100%',
                          height: '48px',
                          minHeight: '48px',
                          padding: '0 14px',
                          borderRadius: '6px',
                          border: '1px solid #D9D9D9',
                          fontSize: '16px',
                          backgroundColor: '#FFFFFF',
                          color: '#111111',
                          boxSizing: 'border-box'
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: '48px',
                      minHeight: '48px',
                      backgroundColor: '#000000',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Continue to Confirm Identity
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Confirm Academic Identity */
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D9D9',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginBottom: '4px' }}>
                  Confirm Your Academic Identity
                </div>
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '16px' }}>
                  Joining class: <strong>{classCodeInput || 'QR Target'}</strong>. Please verify your exact name and register number for this class roster.
                </div>

                <form onSubmit={handleConfirmJoin}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px' }}>
                      STUDENT FULL NAME
                    </label>
                    <input
                      type="text"
                      value={confirmName}
                      onChange={e => setConfirmName(e.target.value)}
                      style={{
                        width: '100%',
                        height: '48px',
                        minHeight: '48px',
                        padding: '0 14px',
                        borderRadius: '6px',
                        border: '1px solid #D9D9D9',
                        fontSize: '16px',
                        backgroundColor: '#FFFFFF',
                        color: '#111111',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px' }}>
                      REGISTER / ROLL NUMBER (MUST BE UNIQUE IN CLASS)
                    </label>
                    <input
                      type="text"
                      value={confirmRegNo}
                      onChange={e => setConfirmRegNo(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        height: '48px',
                        minHeight: '48px',
                        padding: '0 14px',
                        borderRadius: '6px',
                        border: '1px solid #D9D9D9',
                        fontSize: '16px',
                        backgroundColor: '#FFFFFF',
                        color: '#111111',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setJoinStep('INPUT')}
                      disabled={joinLoading}
                      style={{
                        flex: 1,
                        height: '48px',
                        minHeight: '48px',
                        backgroundColor: '#FFFFFF',
                        color: '#111111',
                        border: '1px solid #D9D9D9',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={joinLoading}
                      style={{
                        flex: 2,
                        height: '48px',
                        minHeight: '48px',
                        backgroundColor: '#000000',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: joinLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {joinLoading ? 'Enrolling...' : 'Confirm & Enroll'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'PROFILE' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: '#000000' }}>
              Student Profile
            </h2>

            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9D9D9',
              borderRadius: '10px',
              padding: '18px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#666666', letterSpacing: '0.04em' }}>
                ACADEMIC RECORD
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '4px 0 2px 0', color: '#000000' }}>
                {student?.name || user?.name || 'Student'}
              </h3>
              <div style={{ fontSize: '13px', color: '#555555', marginBottom: '14px' }}>
                Register No: {student?.registerNumber || '23AIML104'}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid #EFEFEF',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: '#888888', display: 'block' }}>Department</span>
                  <strong>{student?.department || 'Computer Science'}</strong>
                </div>
                <div>
                  <span style={{ color: '#888888', display: 'block' }}>Mobile Number</span>
                  <strong>{student?.phoneNumber || '+91 98765 43210'}</strong>
                </div>
              </div>
            </div>

            {/* Device Supervision Status */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9D9D9',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ShieldCheck size={24} color="#000000" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>
                  Supervised Device Ready
                </div>
                <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                  Hardware security bridge enabled. Supervised exam lock will engage automatically upon session start.
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                color: '#111111',
                border: '1px solid #000000',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E5E5',
        zIndex: 50,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 0',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setActiveTab('HOME')}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minHeight: '48px',
              minWidth: '64px',
              color: activeTab === 'HOME' ? '#000000' : '#888888',
              fontSize: '11px',
              fontWeight: activeTab === 'HOME' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <Home size={20} color={activeTab === 'HOME' ? '#000000' : '#888888'} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('CLASSES')}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minHeight: '48px',
              minWidth: '64px',
              color: activeTab === 'CLASSES' ? '#000000' : '#888888',
              fontSize: '11px',
              fontWeight: activeTab === 'CLASSES' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <BookOpen size={20} color={activeTab === 'CLASSES' ? '#000000' : '#888888'} />
            <span>Classes</span>
          </button>

          <button
            onClick={() => { setActiveTab('JOIN'); setJoinStep('INPUT'); }}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minHeight: '48px',
              minWidth: '64px',
              color: activeTab === 'JOIN' ? '#000000' : '#888888',
              fontSize: '11px',
              fontWeight: activeTab === 'JOIN' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <PlusCircle size={20} color={activeTab === 'JOIN' ? '#000000' : '#888888'} />
            <span>Join</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minHeight: '48px',
              minWidth: '64px',
              color: activeTab === 'PROFILE' ? '#000000' : '#888888',
              fontSize: '11px',
              fontWeight: activeTab === 'PROFILE' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <User size={20} color={activeTab === 'PROFILE' ? '#000000' : '#888888'} />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
