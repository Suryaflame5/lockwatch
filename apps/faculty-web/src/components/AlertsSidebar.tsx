import React from 'react';
import { AlertCircle, CheckCircle, Bell, Clock } from 'lucide-react';
import { getAlertSeverityConfig } from '@lockwatch/design-system';
import { AlertSeverity } from '@lockwatch/shared-models';

interface AlertsSidebarProps {
  alerts: any[];
  onAcknowledge: (alertId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const AlertsSidebar: React.FC<AlertsSidebarProps> = ({
  alerts,
  onAcknowledge,
  onSelectStudent
}) => {
  return (
    <div style={{
      width: '320px',
      backgroundColor: '#101522',
      borderLeft: '1px solid #1e293b',
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: '64px'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: '#f8fafc' }}>
          <Bell size={16} color="#f43f5e" />
          LIVE ALERTS ({alerts.filter(a => !a.acknowledged).length})
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
            <CheckCircle size={28} color="#10b981" style={{ marginBottom: '8px' }} />
            <div>No active security alerts</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Session is operating within expected parameters</div>
          </div>
        ) : (
          alerts.map(alert => {
            const config = getAlertSeverityConfig(alert.severity as AlertSeverity);
            return (
              <div
                key={alert.id}
                style={{
                  backgroundColor: alert.acknowledged ? '#0a0d14' : '#131929',
                  border: `1px solid ${alert.acknowledged ? '#1e293b' : config.border}`,
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: alert.acknowledged ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    backgroundColor: config.bg,
                    color: config.color,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {alert.severity}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                    <Clock size={11} />
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div
                  onClick={() => alert.studentId && onSelectStudent(alert.studentId)}
                  style={{
                    fontSize: '12px',
                    color: '#f8fafc',
                    lineHeight: '1.4',
                    cursor: alert.studentId ? 'pointer' : 'default'
                  }}
                >
                  {alert.message}
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    style={{
                      alignSelf: 'flex-end',
                      background: 'transparent',
                      border: '1px solid #1e293b',
                      color: '#94a3b8',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
