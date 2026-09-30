import React from 'react';
import { DashboardSummaryMetrics } from '@lockwatch/shared-models';
import { Users, Wifi, ShieldCheck, AlertTriangle, UserX, WifiOff, CheckCircle2, Lock } from 'lucide-react';

interface SummaryCardsProps {
  metrics: DashboardSummaryMetrics;
  onFilterChange?: (status: string) => void;
  activeFilter?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  metrics,
  onFilterChange,
  activeFilter = 'ALL'
}) => {
  const cards = [
    { id: 'ALL', label: 'TOTAL STUDENTS', count: metrics.totalStudents, icon: Users, color: '#f8fafc', bg: 'rgba(255,255,255,0.05)' },
    { id: 'CONNECTED', label: 'CONNECTED', count: metrics.connected, icon: Wifi, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    { id: 'ACTIVE', label: 'ACTIVE', count: metrics.active, icon: ShieldCheck, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    { id: 'EMERGENCY', label: 'EMERGENCY', count: metrics.emergency, icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
    { id: 'LEFT_SUPERVISION', label: 'LEFT SUPERVISION', count: metrics.leftSupervision, icon: UserX, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    { id: 'OFFLINE', label: 'OFFLINE', count: metrics.offline, icon: WifiOff, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
    { id: 'LOCK_FAILED', label: 'LOCK ERRORS', count: metrics.lockErrors, icon: Lock, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.2)' },
    { id: 'COMPLETED', label: 'COMPLETED', count: metrics.completed, icon: CheckCircle2, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '12px',
      marginBottom: '24px'
    }}>
      {cards.map(card => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterChange?.(card.id)}
            style={{
              backgroundColor: '#131929',
              border: `1px solid ${isSelected ? card.color : '#1e293b'}`,
              borderRadius: '8px',
              padding: '14px',
              cursor: 'pointer',
              transition: 'transform 0.1s ease, border-color 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                {card.label}
              </span>
              <div style={{
                background: card.bg,
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={14} color={card.color} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: card.color,
              marginTop: '10px',
              letterSpacing: '-0.03em'
            }}>
              {card.count}
            </div>
          </div>
        );
      })}
    </div>
  );
};
