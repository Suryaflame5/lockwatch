import React, { useState } from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import { Shield, Lock, User, Hash, AlertCircle } from 'lucide-react';

export const FacultyLoginScreen: React.FC = () => {
  const { login } = useFacultyAuth();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [usePin, setUsePin] = useState(true);
  const [institutionCode, setInstitutionCode] = useState('TECH-UNI');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(
        identifier.trim(),
        usePin ? undefined : password,
        usePin ? pin.trim() : undefined,
        institutionCode.trim()
      );
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 20,
        padding: 32,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)'
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Faculty & Invigilator Portal
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 0', color: '#f8fafc' }}>
            LockWatch Control
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            Supervised native classroom lockdown management
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#f87171',
            fontSize: 13,
            marginBottom: 20
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Institution Code */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              INSTITUTION CODE
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: 10,
                  padding: '12px 14px 12px 40px',
                  color: '#ffffff',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                required
              />
              <Hash size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: 14 }} />
            </div>
          </div>

          {/* Faculty Identifier */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              FACULTY EMAIL / IDENTIFIER
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter Faculty Email or ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                style={{
                  width: '100%',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: 10,
                  padding: '12px 14px 12px 40px',
                  color: '#ffffff',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                required
              />
              <User size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: 14 }} />
            </div>
          </div>

          {/* PIN vs Password Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
              {usePin ? 'FACULTY 6-DIGIT PIN' : 'PASSWORD'}
            </label>
            <button
              type="button"
              onClick={() => setUsePin(!usePin)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {usePin ? 'Use Password' : 'Use 6-Digit PIN'}
            </button>
          </div>

          <div style={{ marginBottom: 24, position: 'relative' }}>
            <input
              type="password"
              maxLength={usePin ? 6 : 50}
              placeholder={usePin ? 'Enter 6-digit PIN' : 'Enter password'}
              value={usePin ? pin : password}
              onChange={(e) => usePin ? setPin(e.target.value.replace(/\D/g, '')) : setPassword(e.target.value)}
              autoComplete="off"
              style={{
                width: '100%',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 10,
                padding: '12px 14px 12px 40px',
                color: '#ffffff',
                fontSize: 14,
                letterSpacing: usePin ? '0.2em' : 'normal',
                boxSizing: 'border-box'
              }}
              required
            />
            <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: 14 }} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Faculty'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#64748b' }}>
          Hardware Keystore Authentication • Multi-Tenant Enterprise Security
        </div>
      </div>
    </div>
  );
};
