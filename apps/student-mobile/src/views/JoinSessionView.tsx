import React, { useState } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { User, Smartphone, QrCode, ArrowRight, LogOut, AlertCircle } from 'lucide-react';

interface JoinSessionViewProps {
  onSessionJoined: () => void;
}

export const JoinSessionView: React.FC<JoinSessionViewProps> = ({ onSessionJoined }) => {
  const { student, device, joinSession, logout } = useStudentAuth();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsJoining(true);
    try {
      await joinSession(joinCode.trim().toUpperCase());
      onSessionJoined();
    } catch (err: any) {
      setError(err.message || 'Failed to join session. Verify join code.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Top Profile Summary */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              {student?.name}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#10b981' }}>
              {student?.registerNumber}
            </div>
          </div>
          <button
            onClick={logout}
            style={{ background: '#171e31', border: '1px solid #1e293b', color: '#94a3b8', padding: '8px', borderRadius: '6px' }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Device Information Card */}
        <div style={{
          backgroundColor: '#101522',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Smartphone size={24} color="#06b6d4" />
          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: 600, color: '#f8fafc' }}>
              {device?.model || 'Enrolled Device'}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              {device?.osVersion || 'Android / iOS'} • Hardware Identity Registered
            </div>
          </div>
        </div>

        {/* Join Session Box */}
        <div style={{
          backgroundColor: '#101522',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '24px 18px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            Join Supervised Session
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
            Enter the 6-character session code provided by your invigilator:
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f87171',
              fontSize: '12px'
            }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. LW-AI-804"
              required
              style={{
                width: '100%',
                backgroundColor: '#0a0d14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '12px',
                color: '#38bdf8',
                fontSize: '18px',
                fontFamily: 'monospace',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '0.1em'
              }}
            />

            <button
              type="submit"
              disabled={isJoining}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isJoining ? 'Joining Session...' : 'Join Session'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '20px' }}>
        LockWatch Production Client • Strict OS Security Enforcement
      </div>
    </div>
  );
};
