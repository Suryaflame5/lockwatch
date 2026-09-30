import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { EmergencyModal } from '../components/EmergencyModal';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export const ActiveSessionView: React.FC<{ onSessionFinished: () => void }> = ({ onSessionFinished }) => {
  const { activeSession, student, device, securityBridge, client } = useStudentAuth();
  const [secondsRemaining, setSecondsRemaining] = useState(
    (activeSession?.durationMinutes || 90) * 60
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(15);

  // Authoritative countdown timer
  useEffect(() => {
    if (isPaused || isFinished) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          securityBridge.stopLock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isFinished]);

  // Session state polling
  useEffect(() => {
    if (!activeSession?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await client.getStudentSessionStatus(activeSession.id);
        if (res.session?.status === 'PAUSED') {
          setIsPaused(true);
        } else if (res.session?.status === 'ACTIVE') {
          setIsPaused(false);
        } else if (res.session?.status === 'ENDED') {
          setIsFinished(true);
          await securityBridge.stopLock();
        }
      } catch (e) {
        // Handled silently
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeSession?.id]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartEmergency = async (reason: string) => {
    try {
      await client.requestEmergency({
        sessionId: activeSession.id,
        studentId: student.id,
        deviceId: device.id,
        reason,
        clientTimestamp: new Date().toISOString()
      });

      setIsEmergencyActive(true);
      setEmergencyCountdown(activeSession?.emergencyDurationSeconds || 15);

      // Controlled temporary release
      await securityBridge.enterEmergency(15);

      const countdownInterval = setInterval(() => {
        setEmergencyCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsEmergencyActive(false);
            setIsEmergencyModalOpen(false);
            // Re-engage native lock
            securityBridge.startLock();
            client.exitEmergency({
              sessionId: activeSession.id,
              studentId: student.id,
              deviceId: device.id,
              clientTimestamp: new Date().toISOString()
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('Emergency request failed', e);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      color: '#111111',
      display: 'flex',
      flexDirection: 'column',
      padding: 'max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        boxSizing: 'border-box'
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E5E5E5',
          paddingBottom: '14px'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#000000',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <ShieldCheck size={16} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', color: '#000000' }}>
            LOCKWATCH
          </span>
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#111111',
          backgroundColor: '#F0F0F0',
          border: '1px solid #D9D9D9',
          padding: '4px 10px',
          borderRadius: '4px',
          letterSpacing: '0.04em'
        }}>
          {isFinished ? 'SESSION CONCLUDED' : isPaused ? 'PAUSED BY FACULTY' : '● SUPERVISED ACTIVE'}
        </div>
      </div>

      {/* Center Examination Status & Authoritative Timer */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#666666', marginBottom: '6px', letterSpacing: '0.04em' }}>
          EXAMINATION IN PROGRESS
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#000000', margin: '0 0 16px 0', lineHeight: '1.3' }}>
          {activeSession?.name || activeSession?.subject || 'Class Examination'}
        </h2>

        {/* Security Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#F8F8F7',
          border: '1px solid #D9D9D9',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '36px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#000000' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#111111', letterSpacing: '0.04em' }}>
            SUPERVISION ACTIVE • INTEGRITY VERIFIED
          </span>
        </div>

        {/* Big Authoritative Countdown */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#888888', letterSpacing: '0.08em', marginBottom: '8px' }}>
            TIME REMAINING
          </div>
          <div style={{
            fontSize: '56px',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: '#000000',
            letterSpacing: '0.04em'
          }}>
            {formatTimer(secondsRemaining)}
          </div>
        </div>

        {isFinished && (
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#000000', fontWeight: 700, fontSize: '14px' }}>
              <CheckCircle2 size={18} />
              Session Ended by Faculty
            </div>
            <div style={{ marginTop: '14px' }}>
              <button
                onClick={onSessionFinished}
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Emergency Button */}
      {!isFinished && (
        <div>
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #111111',
              color: '#111111',
              borderRadius: '6px',
              padding: '14px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <AlertCircle size={16} />
            REQUEST EMERGENCY ACCESS
          </button>
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#777777', marginTop: '8px' }}>
            15-second emergency policy. Dispatched live to invigilator.
          </div>
        </div>
      )}

      {/* Controlled Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onConfirm={handleStartEmergency}
        onClose={() => setIsEmergencyModalOpen(false)}
        isEmergencyActive={isEmergencyActive}
        secondsRemaining={emergencyCountdown}
      />
      </div>
    </div>
  );
};
