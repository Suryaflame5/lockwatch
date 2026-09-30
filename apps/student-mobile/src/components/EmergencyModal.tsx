import React, { useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert, X } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
  isEmergencyActive: boolean;
  secondsRemaining: number;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
  isEmergencyActive,
  secondsRemaining
}) => {
  const [reason, setReason] = useState('Urgent personal emergency');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000,
      padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #000000',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '380px',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: '24px',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
        color: '#111111'
      }}>
        {isEmergencyActive ? (
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '16px',
              borderRadius: '50%',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={32} color="#FFFFFF" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#000000', margin: '0 0 6px 0' }}>
              EMERGENCY ACCESS ACTIVE
            </h3>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '20px' }}>
              Invigilator alerted. Temporary device interaction granted.
            </div>

            <div style={{
              fontSize: '48px',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: '#000000',
              marginBottom: '16px'
            }}>
              {secondsRemaining}s
            </div>

            <p style={{ fontSize: '11px', color: '#666666', lineHeight: '1.4' }}>
              Device lockdown will automatically re-engage when this authoritative timer expires.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#000000',
                color: '#FFFFFF'
              }}>
                <ShieldAlert size={20} color="#FFFFFF" />
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

            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#000000', margin: '0 0 8px 0', textAlign: 'left' }}>
              Request Emergency Access
            </h3>

            <p style={{ fontSize: '12px', color: '#555555', lineHeight: '1.5', margin: '0 0 16px 0', textAlign: 'left' }}>
              Emergency access permits temporary device interaction for up to <strong>15 seconds</strong> under our 15-second policy. This event is logged with immutable timestamps and alerted immediately to faculty.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#333333', marginBottom: '6px' }}>
                REASON (RECORDED ON AUDIT LOG)
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  minHeight: '48px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9D9D9',
                  borderRadius: '6px',
                  padding: '0 12px',
                  color: '#111111',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: '48px',
                  minHeight: '48px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9D9D9',
                  color: '#111111',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  await onConfirm(reason);
                  setSubmitting(false);
                }}
                disabled={submitting}
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
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Requesting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
