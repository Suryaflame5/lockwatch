import React, { useState } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const StudentLoginView: React.FC = () => {
  const { login } = useStudentAuth();
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [institutionCode, setInstitutionCode] = useState('TECH-UNI');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerNumber.trim() || !password.trim()) {
      setError('Please provide your Register Number and Password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(registerNumber.trim().toUpperCase(), password, institutionCode.trim().toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Incorrect login details. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '380px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#101522',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '36px 24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '14px',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)'
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            LOCKWATCH
          </h1>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            STUDENT PORTAL
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Welcome back. Please sign in to continue.
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f87171',
            fontSize: '12px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
              REGISTER NUMBER
            </label>
            <input
              type="text"
              value={registerNumber}
              onChange={e => setRegisterNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 23AIML104"
              required
              autoCapitalize="characters"
              style={{
                width: '100%',
                backgroundColor: '#0a0d14',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#f8fafc',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                backgroundColor: '#0a0d14',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#f8fafc',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
              INSTITUTION CODE
            </label>
            <input
              type="text"
              value={institutionCode}
              onChange={e => setInstitutionCode(e.target.value.toUpperCase())}
              placeholder="e.g. TECH-UNI"
              required
              autoCapitalize="characters"
              style={{
                width: '100%',
                backgroundColor: '#0a0d14',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#f8fafc',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#64748b',
          lineHeight: '1.4'
        }}>
          Secure supervised classroom platform
        </div>
      </div>
    </div>
  );
};
