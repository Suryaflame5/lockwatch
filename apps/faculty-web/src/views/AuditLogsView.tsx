import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export const AuditLogsView: React.FC<{ activeSessionId: string }> = ({ activeSessionId }) => {
  const { client } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await client.getSessionAuditLogs(activeSessionId);
        setLogs(data);
      } catch (e) {
        console.error('Failed to load audit logs', e);
      } finally {
        setLoading(false);
      }
    };
    if (activeSessionId) fetchLogs();
  }, [activeSessionId]);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={22} color="#6366f1" />
          IMMUTABLE FACULTY & SESSION AUDIT TRAIL
        </h2>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          Cryptographically recorded actions and institutional supervision events (Section 49)
        </div>
      </div>

      <div style={{ backgroundColor: '#131929', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#101522', borderBottom: '1px solid #1e293b', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>Timestamp</th>
              <th style={{ padding: '12px' }}>Action</th>
              <th style={{ padding: '12px' }}>Session / Entity</th>
              <th style={{ padding: '12px' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No audit log records found for this session yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1a2234' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#f8fafc' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {log.sessionId || 'Global Institution'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: log.result === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: log.result === 'SUCCESS' ? '#10b981' : '#ef4444'
                    }}>
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
