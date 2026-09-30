import React, { useState, useEffect } from 'react';
import { X, QrCode, Plus, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('Artificial Intelligence Internal Assessment I');
  const [subject, setSubject] = useState('CS804 - Artificial Intelligence');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [className, setClassName] = useState('B.Tech AI-A');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [emergencyDurationSeconds, setEmergencyDurationSeconds] = useState(15);
  const [joinWindowMinutes, setJoinWindowMinutes] = useState(30);
  const [rules, setRules] = useState([
    'Strict native OS lockdown active',
    'Unauthorized task switching is strictly audited',
    'Controlled emergency access is limited to 15 seconds'
  ]);
  const [newRule, setNewRule] = useState('');
  const [createdSession, setCreatedSession] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (createdSession) {
      QRCode.toDataURL(
        JSON.stringify({
          sessionId: createdSession.id,
          joinCode: createdSession.joinCode,
          secret: createdSession.joinTokenSecret
        }),
        { width: 200, margin: 2, color: { dark: '#f8fafc', light: '#101522' } }
      ).then(setQrDataUrl);
    }
  }, [createdSession]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        name,
        subject,
        department,
        className,
        scheduledStartTime: new Date().toISOString(),
        durationMinutes: Number(durationMinutes),
        emergencyDurationSeconds: Number(emergencyDurationSeconds),
        joinWindowMinutes: Number(joinWindowMinutes),
        rules
      });
      setCreatedSession(res);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#101522',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
            {createdSession ? 'Session Ready for Students' : 'Create Supervised Session'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {createdSession ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Students can join using this QR code or Join Code:
            </div>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Session QR Code"
                style={{ borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '16px' }}
              />
            )}

            <div style={{
              fontSize: '28px',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              color: '#38bdf8',
              backgroundColor: '#0a0d14',
              padding: '12px 24px',
              borderRadius: '8px',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              {createdSession.joinCode}
            </div>

            <div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                Go to Live Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                SESSION NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ width: '100%', backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  SUBJECT
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  CLASS / BATCH
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  DURATION (MIN)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  min={5}
                  max={360}
                  required
                  style={{ width: '100%', backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  EMERGENCY (SEC)
                </label>
                <input
                  type="number"
                  value={emergencyDurationSeconds}
                  onChange={e => setEmergencyDurationSeconds(Number(e.target.value))}
                  min={10}
                  max={60}
                  required
                  style={{ width: '100%', backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  JOIN WINDOW (MIN)
                </label>
                <input
                  type="number"
                  value={joinWindowMinutes}
                  onChange={e => setJoinWindowMinutes(Number(e.target.value))}
                  min={5}
                  max={120}
                  required
                  style={{ width: '100%', backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                SESSION RULES
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Add custom examination rule..."
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#0a0d14', border: '1px solid #1e293b', borderRadius: '6px', padding: '6px 12px', color: '#f8fafc', fontSize: '12px' }}
                />
                <button
                  type="button"
                  onClick={addRule}
                  style={{ backgroundColor: '#1e293b', color: '#f8fafc', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#94a3b8' }}>
                {rules.map((r, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                ))}
              </ul>
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
                marginTop: '12px'
              }}
            >
              {isSubmitting ? 'Generating Session...' : 'Create & Generate QR'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
