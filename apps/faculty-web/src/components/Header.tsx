import React from 'react';
import { Shield, Radio, Clock, User, LogOut, FileText, Activity, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeSession: any;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeSession,
  isConnected
}) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      backgroundColor: '#101522',
      borderBottom: '1px solid #1e293b',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Active Session Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onSelectTab('dashboard')}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#f8fafc' }}>
              LOCKWATCH
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>
              FACULTY CONSOLE
            </div>
          </div>
        </div>

        {activeSession && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#171e31',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid #1e293b'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Session:</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              {activeSession.subject}
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              background: '#1e293b',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#38bdf8'
            }}>
              {activeSession.joinCode}
            </div>
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Layers },
          { id: 'monitor', label: 'Live Monitor', icon: Activity },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'audit', label: 'Audit Logs', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#f8fafc' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right status & profile controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Realtime Socket Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '4px 10px',
          borderRadius: '20px',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          <Radio size={12} color={isConnected ? '#10b981' : '#ef4444'} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: isConnected ? '#10b981' : '#ef4444' }}>
            {isConnected ? 'REALTIME CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              {user?.faculty?.name || user?.user?.name || 'Dr. Rajesh Raman'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {user?.faculty?.department || 'Computer Science'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: '#171e31',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
