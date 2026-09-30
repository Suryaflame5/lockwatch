import React, { useState } from 'react';
import { useFacultyAuth } from './context/FacultyAuthContext';
import { FacultyLoginScreen } from './screens/FacultyLoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ClassesScreen } from './screens/ClassesScreen';
import { ClassDetailScreen } from './screens/ClassDetailScreen';
import { LiveMonitorScreen } from './screens/LiveMonitorScreen';
import { ClassReportScreen } from './screens/ClassReportScreen';
import { LayoutDashboard, BookOpen, Radio, FileBarChart, LogOut } from 'lucide-react';

type Tab = 'DASHBOARD' | 'CLASSES' | 'MONITOR' | 'REPORTS';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, activeSession, selectClass, logout } = useFacultyAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('DASHBOARD');
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0a0d14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8'
      }}>
        Initializing LockWatch Faculty Mobile...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacultyLoginScreen />;
  }

  const renderContent = () => {
    if (selectedClass) {
      return (
        <ClassDetailScreen
          cls={selectedClass}
          onBack={() => setSelectedClass(null)}
          onStartSession={(session) => {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0d14', color: '#f8fafc', position: 'relative' }}>
      {/* Top Mobile Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14
          }}>
            LW
          </div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>LockWatch</span>
          <span style={{ fontSize: 11, backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
            FACULTY
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            color: '#f87171',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      {renderContent()}

      {/* Bottom Mobile Tab Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: '#0f172a',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}>
        <button
          onClick={() => {
            setSelectedClass(null);
            setCurrentTab('DASHBOARD');
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: currentTab === 'DASHBOARD' && !selectedClass ? '#38bdf8' : '#64748b',
            cursor: 'pointer'
          }}
        >
          <LayoutDashboard size={20} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Home</span>
        </button>

        <button
          onClick={() => {
            setSelectedClass(null);
            setCurrentTab('CLASSES');
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: currentTab === 'CLASSES' || selectedClass ? '#38bdf8' : '#64748b',
            cursor: 'pointer'
          }}
        >
          <BookOpen size={20} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Classes</span>
        </button>

        <button
          onClick={() => {
            setSelectedClass(null);
            setCurrentTab('MONITOR');
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: currentTab === 'MONITOR' && !selectedClass ? '#10b981' : '#64748b',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Radio size={20} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Live Room</span>
          {activeSession && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }} />
          )}
        </button>

        <button
          onClick={() => {
            setSelectedClass(null);
            setCurrentTab('REPORTS');
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: currentTab === 'REPORTS' && !selectedClass ? '#38bdf8' : '#64748b',
            cursor: 'pointer'
          }}
        >
          <FileBarChart size={20} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Analytics</span>
        </button>
      </div>
    </div>
  );
};
