import React from 'react';
import { X, Smartphone, Apple, ShieldCheck, AlertTriangle, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { getStatusBadgeConfig } from '@lockwatch/design-system';
import { StudentStatus, PlatformType } from '@lockwatch/shared-models';

interface StudentDetailModalProps {
  participant: any | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ participant, onClose }) => {
  if (!participant) return null;

  const badge = getStatusBadgeConfig(participant.status as StudentStatus);
  const isAndroid = participant.platform === PlatformType.ANDROID;

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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              {participant.studentName}
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8' }}>
              Register No: {participant.registerNumber} • Class: B.Tech AI-A
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: badge.bg,
              border: `1px solid ${badge.border}`,
              color: badge.color,
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {badge.label}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Device Details & Security Telemetry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Device Profile */}
          <div style={{ backgroundColor: '#131929', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isAndroid ? <Smartphone size={15} /> : <Apple size={15} />}
              DEVICE PROFILE
            </div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#94a3b8' }}>
              <div><strong style={{ color: '#f8fafc' }}>Model:</strong> {participant.deviceModel}</div>
              <div><strong style={{ color: '#f8fafc' }}>Operating System:</strong> {participant.osVersion}</div>
              <div><strong style={{ color: '#f8fafc' }}>App Version:</strong> 1.0.0 (Production)</div>
              <div>
                <strong style={{ color: '#f8fafc' }}>Management: </strong>
                <span style={{ color: participant.isDeviceOwner || participant.hasAacEntitlement ? '#10b981' : '#f59e0b' }}>
                  {participant.isDeviceOwner ? 'Android Device Owner' : participant.hasAacEntitlement ? 'Apple AAC Entitled' : 'BYOD / Unmanaged'}
                </span>
              </div>
            </div>
          </div>

          {/* Realtime Security Telemetry */}
          <div style={{ backgroundColor: '#131929', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} />
              SECURITY ENFORCEMENT
            </div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#94a3b8' }}>
              <div>
                <strong style={{ color: '#f8fafc' }}>Hardware Lock: </strong>
                <span style={{ color: participant.lockVerified ? '#10b981' : '#ef4444' }}>
                  {participant.lockVerified ? 'VERIFIED ACTIVE' : participant.lockFailureReason || 'UNLOCKED'}
                </span>
              </div>
              <div><strong style={{ color: '#f8fafc' }}>Interruptions:</strong> {participant.interruptionCount || 0} times</div>
              <div><strong style={{ color: '#f8fafc' }}>Emergency Requests:</strong> {participant.emergencyUsageCount || 0}</div>
              <div><strong style={{ color: '#f8fafc' }}>Offline Accumulation:</strong> {participant.offlineDurationSeconds || 0} seconds</div>
            </div>
          </div>
        </div>

        {/* Authoritative Event Timeline */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="#6366f1" />
            AUTHORITATIVE SESSION TIMELINE
          </div>
          <div style={{
            backgroundColor: '#0a0d14',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                {new Date(participant.joinedAt).toLocaleTimeString()}
              </span>
              <span style={{ color: '#f8fafc', fontWeight: 500 }}>
                Joined session and registered cryptographic device UUID
              </span>
            </div>

            {participant.startedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                  {new Date(participant.startedAt).toLocaleTimeString()}
                </span>
                <span style={{ color: '#f8fafc', fontWeight: 500 }}>
                  Session started. OS lockdown verified and engaged.
                </span>
              </div>
            )}

            {participant.interruptionCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ fontFamily: 'monospace', color: '#ef4444' }}>ALERT</span>
                <span style={{ color: '#f8fafc' }}>
                  Supervision interrupted ({participant.interruptionCount} occurrence recorded)
                </span>
              </div>
            )}

            {participant.emergencyUsageCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                <span style={{ fontFamily: 'monospace', color: '#f43f5e' }}>EMERGENCY</span>
                <span style={{ color: '#f8fafc' }}>
                  Temporary emergency access utilized ({participant.emergencyUsageCount} times)
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }} />
              <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                {new Date(participant.lastHeartbeatAt).toLocaleTimeString()}
              </span>
              <span style={{ color: '#94a3b8' }}>
                Last telemetry heartbeat received • Battery: {participant.batteryLevel}% • Screen: {participant.screenOn ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
