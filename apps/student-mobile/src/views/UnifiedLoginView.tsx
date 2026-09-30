import React, { useState } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useFacultyAuth } from '../faculty/context/FacultyAuthContext';
import { StudentSignupModal, StudentForgotPasswordModal } from './StudentAuthFlows';
import { Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export const UnifiedLoginView: React.FC = () => {
  const { login: studentLogin } = useStudentAuth();
  const { login: facultyLogin } = useFacultyAuth();

  const [portalType, setPortalType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  // Student Fields
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // Faculty Fields
  const [facultyId, setFacultyId] = useState('');
  const [facultyPin, setFacultyPin] = useState('');
  const [facultyPass, setFacultyPass] = useState('');
  const [useFacultyPin, setUseFacultyPin] = useState(true);
  const [facultyInst, setFacultyInst] = useState('TECH-UNI');

  // Modals & States
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdentifier.trim() || !studentPass.trim()) {
      setError('Please enter your mobile phone number (or register number) and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await studentLogin(studentIdentifier.trim(), studentPass);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId.trim()) {
      setError('Please enter your Faculty ID or Email.');
      return;
    }
    if (useFacultyPin && !facultyPin.trim()) {
      setError('Please enter your 6-digit Faculty PIN.');
      return;
    }
    if (!useFacultyPin && !facultyPass.trim()) {
      setError('Please enter your faculty password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await facultyLogin(
        facultyId.trim(),
        useFacultyPin ? undefined : facultyPass,
        useFacultyPin ? facultyPin.trim() : undefined,
        facultyInst.trim().toUpperCase()
      );
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#F8F8F7',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: 'calc(20px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 16px)) calc(32px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 16px))',
      boxSizing: 'border-box',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      color: '#111111',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        margin: 'auto 0',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: '14px',
        padding: '28px 22px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            marginBottom: '10px'
          }}>
            <Shield size={24} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#000000' }}>
            LOCKWATCH
          </h1>
          <div style={{ fontSize: '13px', color: '#666666' }}>
            Supervised Classroom Examination Platform
          </div>
        </div>

        {/* Role Segmented Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F0F0F0',
          borderRadius: '8px',
          padding: '3px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setPortalType('STUDENT'); setError(null); setSuccessBanner(null); }}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '10px 0',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: portalType === 'STUDENT' ? '#000000' : 'transparent',
              color: portalType === 'STUDENT' ? '#FFFFFF' : '#555555',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => { setPortalType('FACULTY'); setError(null); setSuccessBanner(null); }}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '10px 0',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: portalType === 'FACULTY' ? '#000000' : 'transparent',
              color: portalType === 'FACULTY' ? '#FFFFFF' : '#555555',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Faculty
          </button>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div style={{
            backgroundColor: '#F4F4F4',
            border: '1px solid #000000',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#000000',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#F8F8F8',
            border: '1px solid #111111',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#111111',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Student Login Form */}
        {portalType === 'STUDENT' ? (
          <form onSubmit={handleStudentSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px', letterSpacing: '0.04em' }}>
                MOBILE NUMBER OR REGISTER NUMBER
              </label>
              <input
                type="text"
                placeholder="Enter mobile or register number"
                value={studentIdentifier}
                onChange={e => setStudentIdentifier(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '48px',
                  minHeight: '48px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #D9D9D9',
                  fontSize: '16px',
                  backgroundColor: '#FFFFFF',
                  color: '#111111',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#333333', letterSpacing: '0.04em' }}>
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '12px',
                    color: '#555555',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '4px 0'
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showStudentPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={studentPass}
                  onChange={e => setStudentPass(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: '48px',
                    minHeight: '48px',
                    padding: '0 48px 0 14px',
                    borderRadius: '8px',
                    border: '1px solid #D9D9D9',
                    fontSize: '16px',
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowStudentPass(!showStudentPass)}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '0',
                    bottom: '0',
                    margin: 'auto 0',
                    height: '44px',
                    width: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#777777',
                    padding: 0
                  }}
                >
                  {showStudentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '16px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '48px',
                  minHeight: '48px',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In as Student'}
              </button>
            </div>

            {/* Create Account link */}
            <div style={{ textAlign: 'center', paddingTop: '14px', borderTop: '1px solid #EFEFEF' }}>
              <span style={{ fontSize: '13px', color: '#666666' }}>New student? </span>
              <button
                type="button"
                onClick={() => setIsSignupOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#000000',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px 0'
                }}
              >
                Create Account with Mobile
              </button>
            </div>
          </form>
        ) : (
          /* Faculty Login Form */
          <form onSubmit={handleFacultySubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px', letterSpacing: '0.04em' }}>
                FACULTY ID OR EMAIL
              </label>
              <input
                type="text"
                placeholder="Enter Faculty ID or Email"
                value={facultyId}
                onChange={e => setFacultyId(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '48px',
                  minHeight: '48px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #D9D9D9',
                  fontSize: '16px',
                  backgroundColor: '#FFFFFF',
                  color: '#111111',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            {/* PIN vs Password toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#333333', letterSpacing: '0.04em' }}>
                {useFacultyPin ? '6-DIGIT SECURE PIN' : 'ACCOUNT PASSWORD'}
              </label>
              <button
                type="button"
                onClick={() => setUseFacultyPin(!useFacultyPin)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  color: '#555555',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px 0'
                }}
              >
                {useFacultyPin ? 'Use Password' : 'Use PIN'}
              </button>
            </div>

            {useFacultyPin ? (
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter 6-digit PIN"
                  value={facultyPin}
                  onChange={e => setFacultyPin(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    height: '48px',
                    minHeight: '48px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #D9D9D9',
                    fontSize: '18px',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    fontWeight: 700,
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="password"
                  placeholder="Enter faculty password"
                  value={facultyPass}
                  onChange={e => setFacultyPass(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: '48px',
                    minHeight: '48px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #D9D9D9',
                    fontSize: '16px',
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '48px',
                  minHeight: '48px',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In as Faculty'}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Signup Modal */}
      <StudentSignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={() => {
          setIsSignupOpen(false);
          setSuccessBanner('Account created successfully! You are now logged in.');
        }}
      />

      {/* Forgot Password Modal */}
      <StudentForgotPasswordModal
        isOpen={isForgotPassOpen}
        onClose={() => setIsForgotPassOpen(false)}
        onSuccess={() => {
          setIsForgotPassOpen(false);
          setSuccessBanner('Password reset successfully. Please sign in with your new password.');
        }}
      />
    </div>
  );
};
