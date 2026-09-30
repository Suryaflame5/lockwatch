import { StudentStatus, AlertSeverity } from '@lockwatch/shared-models';

/**
 * LockWatch Design System - Obsidian Dark Theme Tokens
 * High information density, accessible contrast, 8px grid system.
 */

export const colors = {
  // Obsidian backgrounds
  bgBase: '#0a0d14',
  bgSurface: '#101522',
  bgElevated: '#171e31',
  bgCard: '#131929',
  bgSubtle: '#1d263b',

  // Borders
  borderLight: '#1e293b',
  borderFocus: '#6366f1',
  borderSubtle: '#192238',

  // Primary brand / accents
  primary: '#6366f1', // Indigo / subtle purple accent
  primaryHover: '#4f46e5',
  primaryMuted: 'rgba(99, 102, 241, 0.15)',
  accentCyan: '#06b6d4',

  // State colors (Semantic)
  statusActive: '#10b981',       // Emerald Green
  statusWarning: '#f59e0b',      // Amber
  statusCritical: '#ef4444',     // Red
  statusOffline: '#64748b',      // Slate Gray
  statusEmergency: '#f43f5e',    // Rose Accent
  statusReady: '#3b82f6',        // Blue

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDisabled: '#475569'
};

export const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

export const getStatusBadgeConfig = (status: StudentStatus) => {
  switch (status) {
    case StudentStatus.ACTIVE:
      return {
        label: 'ACTIVE',
        color: colors.statusActive,
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)'
      };
    case StudentStatus.READY:
      return {
        label: 'READY',
        color: colors.statusReady,
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.3)'
      };
    case StudentStatus.EMERGENCY:
      return {
        label: 'EMERGENCY',
        color: colors.statusEmergency,
        bg: 'rgba(244, 63, 94, 0.15)',
        border: 'rgba(244, 63, 94, 0.4)'
      };
    case StudentStatus.LEFT_SUPERVISION:
      return {
        label: 'LEFT SUPERVISION',
        color: colors.statusCritical,
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)'
      };
    case StudentStatus.LOCK_FAILED:
      return {
        label: 'LOCK FAILED',
        color: colors.statusCritical,
        bg: 'rgba(239, 68, 68, 0.2)',
        border: 'rgba(239, 68, 68, 0.5)'
      };
    case StudentStatus.OFFLINE:
      return {
        label: 'OFFLINE',
        color: colors.statusOffline,
        bg: 'rgba(100, 116, 139, 0.15)',
        border: 'rgba(100, 116, 139, 0.3)'
      };
    case StudentStatus.RECONNECTED:
      return {
        label: 'RECONNECTED',
        color: colors.accentCyan,
        bg: 'rgba(6, 182, 212, 0.15)',
        border: 'rgba(6, 182, 212, 0.3)'
      };
    case StudentStatus.COMPLETED:
      return {
        label: 'COMPLETED',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: 'rgba(168, 85, 247, 0.3)'
      };
    default:
      return {
        label: status,
        color: colors.textMuted,
        bg: 'rgba(100, 116, 139, 0.1)',
        border: 'rgba(100, 116, 139, 0.2)'
      };
  }
};

export const getAlertSeverityConfig = (severity: AlertSeverity) => {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return {
        label: 'CRITICAL',
        color: colors.statusCritical,
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)'
      };
    case AlertSeverity.WARNING:
      return {
        label: 'WARNING',
        color: colors.statusWarning,
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)'
      };
    case AlertSeverity.NORMAL:
      return {
        label: 'NORMAL',
        color: colors.statusActive,
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)'
      };
    default:
      return {
        label: 'INFO',
        color: colors.accentCyan,
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.3)'
      };
  }
};
