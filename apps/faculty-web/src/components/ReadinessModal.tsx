import React from 'react';
import { X, Check, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { StudentReadinessResult } from '@lockwatch/shared-models';

interface ReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  readinessList: StudentReadinessResult[];
  onStartAnyway?: () => void;
}

export const ReadinessModal: React.FC<ReadinessModalProps> = ({
  isOpen,
  onClose,
  readinessList,
  onStartAnyway
}) => {
  if (!isOpen) return null;

  const total = readinessList.length;
  const readyCount = readinessList.filter(r => r.isReady).length;
  const notReadyCount = total - readyCount;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#101522',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              PRE-SESSION DEVICE READINESS AUDIT
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Hardware operating system lockdown capability verification (Section 26 & 75)
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Readiness Count Metric Bar */}
        <div style={{
          display: 'flex',
          gap: '16px',
          backgroundColor: '#131929',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>TOTAL PARTICIPANTS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>{total}</div>
          </div>
          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>SECURE READY</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{readyCount}</div>
          </div>
          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: notReadyCount > 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>NOT READY</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: notReadyCount > 0 ? '#ef4444' : '#64748b' }}>{notReadyCount}</div>
          </div>
        </div>

        {notReadyCount > 0 && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            color: '#f87171',
            fontSize: '12px'
          }}>
            <ShieldAlert size={18} />
            <span>
              <strong>Warning:</strong> {notReadyCount} device(s) lack required hardware security enrollment. In accordance with Section 21, the system will not downgrade silently to an insecure mode.
            </span>
          </div>
        )}

        {/* Readiness Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '10px' }}>Student</th>
              <th style={{ padding: '10px' }}>Platform</th>
              <th style={{ padding: '10px' }}>Device</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Account</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Network</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Security</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Problem / Diagnostic</th>
            </tr>
          </thead>
          <tbody>
            {readinessList.map((row) => (
              <tr key={row.studentId} style={{ borderBottom: '1px solid #171e31' }}>
                <td style={{ padding: '10px', fontWeight: 600, color: '#f8fafc' }}>
                  {row.studentName}
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{row.registerNumber}</div>
                </td>
                <td style={{ padding: '10px', color: '#94a3b8' }}>{row.platform}</td>
                <td style={{ padding: '10px', color: '#94a3b8' }}>{row.deviceModel}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {row.accountValid ? <Check size={14} color="#10b981" /> : <X size={14} color="#ef4444" />}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {row.networkReady ? <Check size={14} color="#10b981" /> : <X size={14} color="#ef4444" />}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {row.securityCapabilitySupported ? <Check size={14} color="#10b981" /> : <X size={14} color="#ef4444" />}
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: row.isReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: row.isReady ? '#10b981' : '#ef4444'
                  }}>
                    {row.isReady ? 'READY' : 'NOT READY'}
                  </span>
                </td>
                <td style={{ padding: '10px', color: row.isReady ? '#64748b' : '#f87171' }}>
                  {row.problem || 'Verified Secure'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
