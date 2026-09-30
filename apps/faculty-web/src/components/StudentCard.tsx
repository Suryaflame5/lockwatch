import React from 'react';
import { getStatusBadgeConfig } from '@lockwatch/design-system';
import { StudentStatus, PlatformType } from '@lockwatch/shared-models';
import { Battery, BatteryCharging, Wifi, WifiOff, Smartphone, Apple, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

interface StudentCardProps {
  participant: any;
  onClick: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ participant, onClick }) => {
  const badge = getStatusBadgeConfig(participant.status as StudentStatus);
  const isAndroid = participant.platform === PlatformType.ANDROID;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#131929',
        border: `1px solid ${participant.status === StudentStatus.EMERGENCY || participant.status === StudentStatus.LEFT_SUPERVISION ? badge.border : '#1e293b'}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.15s ease, background 0.15s ease'
      }}
    >
      {/* Top Header: Student Identity & Status Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
            {participant.studentName}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>
            {participant.registerNumber}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: badge.bg,
          border: `1px solid ${badge.border}`,
          padding: '3px 8px',
          borderRadius: '4px'
        }}>
          {participant.status === StudentStatus.ACTIVE && <ShieldCheck size={12} color={badge.color} />}
          {participant.status === StudentStatus.EMERGENCY && <AlertTriangle size={12} color={badge.color} />}
          {participant.status === StudentStatus.LOCK_FAILED && <Lock size={12} color={badge.color} />}
          <span style={{ fontSize: '10px', fontWeight: 700, color: badge.color, letterSpacing: '0.04em' }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Device Metadata */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#94a3b8',
        background: '#0a0d14',
        padding: '6px 10px',
        borderRadius: '6px'
      }}>
        {isAndroid ? <Smartphone size={13} color="#10b981" /> : <Apple size={13} color="#f8fafc" />}
        <span style={{ fontWeight: 600, color: isAndroid ? '#10b981' : '#f8fafc' }}>
          {participant.platform}
        </span>
        <span>•</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {participant.deviceModel}
        </span>
      </div>

      {/* Telemetry Row: Battery, Network, Events */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#64748b',
        borderTop: '1px solid #1a2234',
        paddingTop: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {participant.isCharging ? <BatteryCharging size={13} color="#10b981" /> : <Battery size={13} color="#94a3b8" />}
          <span>{participant.batteryLevel}%</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {participant.networkQuality === 'ONLINE' ? (
            <Wifi size={13} color="#06b6d4" />
          ) : (
            <WifiOff size={13} color="#64748b" />
          )}
          <span style={{ color: participant.networkQuality === 'ONLINE' ? '#06b6d4' : '#64748b' }}>
            {participant.networkQuality}
          </span>
        </div>

        {participant.emergencyUsageCount > 0 && (
          <div style={{ color: '#f43f5e', fontWeight: 600 }}>
            Emg: {participant.emergencyUsageCount}
          </div>
        )}
      </div>
    </div>
  );
};
