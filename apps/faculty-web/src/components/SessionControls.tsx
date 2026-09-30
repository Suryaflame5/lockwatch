import React, { useState } from 'react';
import { Play, Pause, Square, AlertOctagon, CheckSquare, Eye } from 'lucide-react';
import { SessionStatus } from '@lockwatch/shared-models';

interface SessionControlsProps {
  session: any;
  studentCount: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onViewReadiness: () => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  session,
  studentCount,
  onStart,
  onPause,
  onResume,
  onEnd,
  onViewReadiness
}) => {
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#101522',
      padding: '12px 20px',
      borderRadius: '8px',
      border: '1px solid #1e293b',
      marginBottom: '20px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>SESSION CONTROLS</span>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            State: <span style={{ color: session.status === 'ACTIVE' ? '#10b981' : session.status === 'PAUSED' ? '#f59e0b' : '#38bdf8' }}>{session.status}</span>
          </div>
        </div>

        <button
          onClick={onViewReadiness}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#171e31',
            border: '1px solid #1e293b',
            color: '#f8fafc',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <Eye size={14} color="#06b6d4" />
          VIEW READINESS
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {session.status === SessionStatus.READY && (
          <button
            onClick={() => setShowStartConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Play size={15} />
            START SESSION
          </button>
        )}

        {session.status === SessionStatus.ACTIVE && (
          <button
            onClick={onPause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Pause size={15} />
            PAUSE
          </button>
        )}

        {session.status === SessionStatus.PAUSED && (
          <button
            onClick={onResume}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Play size={15} />
            RESUME
          </button>
        )}

        {session.status !== SessionStatus.ENDED && (
          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Square size={15} />
            END SESSION
          </button>
        )}
      </div>

      {/* Start Session Double-Confirmation Modal (Section 67) */}
      {showStartConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{ backgroundColor: '#101522', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', maxWidth: '420px', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: 800, fontSize: '16px', marginBottom: '12px' }}>
              <CheckSquare size={20} />
              Confirm Session Launch
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Start supervised examination session for <strong>{studentCount}</strong> participating students? Native hardware lock commands will be dispatched immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowStartConfirm(false)} style={{ background: '#171e31', border: '1px solid #1e293b', color: '#f8fafc', padding: '8px 14px', borderRadius: '6px', fontSize: '12px' }}>
                Cancel
              </button>
              <button onClick={() => { setShowStartConfirm(false); onStart(); }} style={{ background: '#10b981', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Double-Confirmation Modal (Section 68) */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{ backgroundColor: '#101522', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', maxWidth: '420px', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: 800, fontSize: '16px', marginBottom: '12px' }}>
              <AlertOctagon size={20} />
              Confirm Session Termination
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              End this session for all participating students? Native platform security layers will exit and final auditable reports will be generated.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ background: '#171e31', border: '1px solid #1e293b', color: '#f8fafc', padding: '8px 14px', borderRadius: '6px', fontSize: '12px' }}>
                Cancel
              </button>
              <button onClick={() => { setShowEndConfirm(false); onEnd(); }} style={{ background: '#ef4444', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
