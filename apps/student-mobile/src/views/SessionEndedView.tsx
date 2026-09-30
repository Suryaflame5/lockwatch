import React from 'react';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';

interface SessionEndedViewProps {
  session: any;
  onReturnToClasses: () => void;
}

export const SessionEndedView: React.FC<SessionEndedViewProps> = ({ session, onReturnToClasses }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F8F7',
      color: '#111111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        margin: 'auto',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D9D9D9',
        borderRadius: 12,
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        boxSizing: 'border-box'
      }}>
        {/* Success Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#000000',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <CheckCircle2 size={32} color="#FFFFFF" />
        </div>

        <div style={{ fontSize: 11, color: '#666666', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          EXAMINATION CONCLUDED
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 10px', color: '#000000' }}>
          Normal Device Operation Restored
        </h1>

        <p style={{ fontSize: 13, color: '#555555', lineHeight: 1.5, marginBottom: 24 }}>
          Supervised examination session has ended. Full device features, notifications, and application switching are restored.
        </p>

        {/* Persistent Enrollment Guarantee Box */}
        <div style={{
          backgroundColor: '#FAFAFA',
          border: '1px solid #E5E5E5',
          borderRadius: 8,
          padding: 16,
          textAlign: 'left',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#000000', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            <Shield size={16} /> Persistent Class Enrollment Intact
          </div>
          <div style={{ fontSize: 12, color: '#444444' }}>
            Session: <strong>{session?.name || session?.subject || 'Class Examination'}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#777777', marginTop: 4 }}>
            You remain enrolled in this class roster. Future supervised sessions will appear on your home screen automatically.
          </div>
        </div>

        <button
          onClick={onReturnToClasses}
          style={{
            width: '100%',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          Return to My Classes <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
