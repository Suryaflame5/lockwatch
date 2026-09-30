import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, KeyRound, Building, ArrowRight, AlertCircle } from 'lucide-react';

export const FacultyLoginView: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('faculty@apextech.edu');
  const [password, setPassword] = useState('FacultyPassword123!');
  const [pin, setPin] = useState('123456');
  const [usePinAuth, setUsePinAuth] = useState(false);
  const [institutionCode, setInstitutionCode] = useState('TECH-UNI');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (usePinAuth) {
        await login(identifier, undefined, pin, institutionCode);
      } else {
        await login(identifier, password, undefined, institutionCode);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#101522',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <Shield size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px 0', color: '#f8fafc' }}>
            LOCKWATCH
          </h1>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em' }}>
            FACULTY SUPERVISION CONSOLE
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f87171',
            fontSize: '12px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              INSTITUTION CODE
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={institutionCode}
                onChange={e => setInstitutionCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0a0d14',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '10px 14px 10px 36px',
                  color: '#f8fafc',
                  fontSize: '13px'
                }}
              />
              <Building size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              FACULTY ID / EMAIL
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. faculty@apextech.edu or FAC-CS-084"
              required
              style={{
                width: '100%',
                backgroundColor: '#0a0d14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#f8fafc',
                fontSize: '13px'
              }}
            />
          </div>

          {usePinAuth ? (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                FACULTY PIN (6–8 DIGITS)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  maxLength={8}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter 6–8 digit secure PIN"
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0d14',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '10px 14px 10px 36px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    letterSpacing: '0.2em'
                  }}
                />
                <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0d14',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '10px 14px 10px 36px',
                    color: '#f8fafc',
                    fontSize: '13px'
                  }}
                />
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>
          )}

          {/* Toggle between Password and PIN login (Section 9) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setUsePinAuth(!usePinAuth)}
              style={{ background: 'transparent', border: 'none', color: '#6366f1', padding: 0, textDecoration: 'underline' }}
            >
              {usePinAuth ? 'Use Password' : 'Use Quick Faculty PIN'}
            </button>
            <span style={{ color: '#64748b' }}>Enterprise SSO Ready</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 700,
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Console'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
