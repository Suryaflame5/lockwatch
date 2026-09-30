import React, { useState } from 'react';
import { useFacultyAuth } from './context/FacultyAuthContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { ClassesScreen } from './screens/ClassesScreen';
import { ClassDetailScreen } from './screens/ClassDetailScreen';
import { LiveMonitorScreen } from './screens/LiveMonitorScreen';
import { ClassReportScreen } from './screens/ClassReportScreen';
import { LayoutDashboard, BookOpen, Radio, FileBarChart, LogOut, Shield } from 'lucide-react';

type Tab = 'DASHBOARD' | 'CLASSES' | 'MONITOR' | 'REPORTS';

export const FacultyWorkspaceView: React.FC = () => {
  const { faculty, institution, selectClass, logout } = useFacultyAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('DASHBOARD');
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  const renderContent = () => {
    if (selectedClass) {
      return (
        <ClassDetailScreen
          cls={selectedClass}
          onBack={() => setSelectedClass(null)}
          onStartSession={() => {
            setSelectedClass(null);
            setCurrentTab('MONITOR');
          }}
        />
      );
    }

    switch (currentTab) {
      case 'DASHBOARD':
        return (
          <DashboardScreen
            onNavigateTab={(tab) => {
              setSelectedClass(null);
              setCurrentTab(tab);
            }}
            onOpenClassDetail={(cls) => setSelectedClass(cls)}
          />
        );
      case 'CLASSES':
        return (
          <ClassesScreen
            onSelectClass={(cls) => {
              selectClass(cls);
              setSelectedClass(cls);
            }}
          />
        );
      case 'MONITOR':
        return <LiveMonitorScreen />;
      case 'REPORTS':
        return <ClassReportScreen />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F8F7',
      color: '#111111',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top App Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}>
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Shield size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em', color: '#000000' }}>LOCKWATCH</span>
                <span style={{
                  fontSize: 10,
                  backgroundColor: '#F0F0F0',
                  border: '1px solid #D9D9D9',
                  color: '#111111',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  FACULTY
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#666666' }}>
                {faculty?.name || 'Faculty Member'} • {institution?.name || 'Apex Institute'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9D9D9',
              color: '#111111',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: '80px', boxSizing: 'border-box' }}>
        {renderContent()}
      </div>

      {/* Bottom Navigation Tab Bar */}
      {/* Bottom Navigation Tab Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E5E5',
        zIndex: 50,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 0',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => {
              setSelectedClass(null);
              setCurrentTab('DASHBOARD');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: currentTab === 'DASHBOARD' && !selectedClass ? '#000000' : '#888888',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 48,
              minWidth: 64,
              fontSize: 11,
              fontWeight: currentTab === 'DASHBOARD' && !selectedClass ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <LayoutDashboard size={20} color={currentTab === 'DASHBOARD' && !selectedClass ? '#000000' : '#888888'} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setSelectedClass(null);
              setCurrentTab('CLASSES');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: currentTab === 'CLASSES' || selectedClass ? '#000000' : '#888888',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 48,
              minWidth: 64,
              fontSize: 11,
              fontWeight: currentTab === 'CLASSES' || selectedClass ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <BookOpen size={20} color={currentTab === 'CLASSES' || selectedClass ? '#000000' : '#888888'} />
            <span>Classes</span>
          </button>

          <button
            onClick={() => {
              setSelectedClass(null);
              setCurrentTab('MONITOR');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: currentTab === 'MONITOR' ? '#000000' : '#888888',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 48,
              minWidth: 64,
              fontSize: 11,
              fontWeight: currentTab === 'MONITOR' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <Radio size={20} color={currentTab === 'MONITOR' ? '#000000' : '#888888'} />
            <span>Monitor</span>
          </button>

          <button
            onClick={() => {
              setSelectedClass(null);
              setCurrentTab('REPORTS');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: currentTab === 'REPORTS' ? '#000000' : '#888888',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 48,
              minWidth: 64,
              fontSize: 11,
              fontWeight: currentTab === 'REPORTS' ? 700 : 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <FileBarChart size={20} color={currentTab === 'REPORTS' ? '#000000' : '#888888'} />
            <span>Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};
