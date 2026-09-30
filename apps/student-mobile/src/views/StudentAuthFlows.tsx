import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { X, ArrowRight, Check, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface StudentSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentSignupModal: React.FC<StudentSignupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { requestSignupOtp, verifySignupOtp, createAccount } = useStudentAuth();

  // Multi-step state: 1: PHONE -> 2: OTP -> 3: PASSWORD -> 4: PROFILE
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [otp, setOtp] = useState('');
  const [expiresIn, setExpiresIn] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password & Profile
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [institutionCode, setInstitutionCode] = useState('TECH-UNI');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for OTP expiry and cooldown
  useEffect(() => {
    if (step !== 2) return;
    const timer = setInterval(() => {
      setExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleaned || cleaned === '+91' || cleaned.length < 10) {
      setError('Please enter a valid mobile phone number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await requestSignupOtp(cleaned);
      setChallengeId(res.challengeId);
      setMaskedPhone(res.phoneNumber);
      setExpiresIn(res.expiresInSeconds || 300);
      setResendCooldown(res.resendCooldownSeconds || 30);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check the mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await requestSignupOtp(phoneNumber.trim());
      setChallengeId(res.challengeId);
      setExpiresIn(res.expiresInSeconds || 300);
      setResendCooldown(res.resendCooldownSeconds || 30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifySignupOtp(challengeId, otp);
      setVerificationToken(res.verificationToken);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setStep(4);
  };

  const handleCompleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!registerNumber.trim()) {
      setError('Please enter your student register / roll number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createAccount({
        verificationToken,
        password,
        name: fullName.trim(),
        registerNumber: registerNumber.trim().toUpperCase(),
        institutionCode: institutionCode.trim().toUpperCase() || 'TECH-UNI'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Account creation failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(3px)',
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
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
        color: '#111111',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Create Student Account</h2>
            <div style={{ fontSize: '12px', color: '#666666', marginTop: '2px' }}>
              Step {step} of 4: {step === 1 ? 'Mobile Verification' : step === 2 ? 'Enter Code' : step === 3 ? 'Set Password' : 'Academic Profile'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666666',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '3px',
                backgroundColor: s <= step ? '#000000' : '#E5E5E5',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            backgroundColor: '#F8F8F8',
            border: '1px solid #000000',
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

        {/* Step 1: Mobile Phone Number */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                MOBILE NUMBER
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
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
              <div style={{ fontSize: '11px', color: '#777777', marginTop: '6px' }}>
                Enter with country code (e.g. +91). A 6-digit verification code will be sent.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
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
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Enter 6-digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                ENTER 6-DIGIT CODE
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="------"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  height: '52px',
                  minHeight: '52px',
                  padding: '0 14px',
                  borderRadius: '6px',
                  border: '1px solid #D9D9D9',
                  fontSize: '22px',
                  letterSpacing: '0.25em',
                  textAlign: 'center',
                  fontWeight: 700,
                  backgroundColor: '#FFFFFF',
                  color: '#111111',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777777', marginTop: '8px' }}>
                <span>Sent to {maskedPhone}</span>
                <span>Expires in {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                style={{
                  flex: 1,
                  height: '48px',
                  minHeight: '48px',
                  backgroundColor: '#FFFFFF',
                  color: resendCooldown > 0 ? '#999999' : '#111111',
                  border: '1px solid #D9D9D9',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer'
                }}
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
              </button>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  flex: 1,
                  height: '48px',
                  minHeight: '48px',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(null); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#666666',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '8px 0'
              }}
            >
              Change Mobile Number
            </button>
          </form>
        )}

        {/* Step 3: Set Password */}
        {step === 3 && (
          <form onSubmit={handleSetPassword}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                CREATE PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    minHeight: '48px',
                    padding: '0 48px 0 14px',
                    borderRadius: '6px',
                    border: '1px solid #D9D9D9',
                    fontSize: '16px',
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                    color: '#666666',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                CONFIRM PASSWORD
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              Continue to Academic Profile
            </button>
          </form>
        )}

        {/* Step 4: Academic Profile */}
        {step === 4 && (
          <form onSubmit={handleCompleteAccount}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                FULL NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Arun Kumar"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
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

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                STUDENT REGISTER / ROLL NUMBER
              </label>
              <input
                type="text"
                placeholder="e.g. 23AIML104"
                value={registerNumber}
                onChange={e => setRegisterNumber(e.target.value)}
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
              <div style={{ fontSize: '11px', color: '#777777', marginTop: '4px' }}>
                Used by faculty for official attendance and exam rosters.
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                INSTITUTION CODE
              </label>
              <input
                type="text"
                value={institutionCode}
                onChange={e => setInstitutionCode(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
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
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

interface StudentForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentForgotPasswordModal: React.FC<StudentForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { requestPasswordResetOtp, verifyPasswordResetOtp, resetPassword } = useStudentAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [otp, setOtp] = useState('');
  const [expiresIn, setExpiresIn] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 2) return;
    const timer = setInterval(() => {
      setExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleaned || cleaned.length < 10) {
      setError('Please enter your registered mobile number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(cleaned);
      setChallengeId(res.challengeId);
      setMaskedPhone(res.phoneNumber);
      setExpiresIn(res.expiresInSeconds || 300);
      setResendCooldown(res.resendCooldownSeconds || 30);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'No student account found with this mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(challengeId, otp);
      setVerificationToken(res.verificationToken);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(verificationToken, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(3px)',
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
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
        color: '#111111',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Reset Password</h2>
            <div style={{ fontSize: '12px', color: '#666666', marginTop: '2px' }}>
              Step {step} of 3: {step === 1 ? 'Registered Mobile' : step === 2 ? 'Verification Code' : 'New Password'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666666',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#F8F8F8',
            border: '1px solid #000000',
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

        {/* Step 1: Registered Phone */}
        {step === 1 && (
          <form onSubmit={handleSendResetOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                REGISTERED MOBILE NUMBER
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
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
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyResetOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                ENTER 6-DIGIT CODE
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="------"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  height: '52px',
                  minHeight: '52px',
                  padding: '0 14px',
                  borderRadius: '6px',
                  border: '1px solid #D9D9D9',
                  fontSize: '22px',
                  letterSpacing: '0.25em',
                  textAlign: 'center',
                  fontWeight: 700,
                  backgroundColor: '#FFFFFF',
                  color: '#111111',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777777', marginTop: '8px' }}>
                <span>Sent to {maskedPhone}</span>
                <span>Expires in {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
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
                cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                NEW PASSWORD
              </label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
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

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '6px' }}>
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
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
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
