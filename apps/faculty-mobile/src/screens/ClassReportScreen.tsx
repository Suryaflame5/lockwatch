import React, { useState, useEffect } from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import {
  FileBarChart,
  Users,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { ClassReportSummary, ClassHistoryItem } from '@lockwatch/shared-models';

export const ClassReportScreen: React.FC = () => {
  const { classes, activeClass, fetchClassReport, fetchClassHistory } = useFacultyAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClass?.id || (classes[0]?.id || ''));
  const [report, setReport] = useState<ClassReportSummary | null>(null);
  const [history, setHistory] = useState<ClassHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    Promise.all([
      fetchClassReport(selectedClassId),
      fetchClassHistory(selectedClassId)
    ])
      .then(([rep, hist]) => {
        setReport(rep);
        setHistory(hist);
      })
      .catch((err) => console.error('Failed to fetch class report', err))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
          Class Analytics & Reports
        </h1>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Attendance, security incidents, and session history
        </div>
      </div>

      {/* Class Selector Dropdown */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          SELECT CLASS
        </label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#f8fafc',
            fontSize: 14,
            fontWeight: 600,
            boxSizing: 'border-box'
          }}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.classCode})
            </option>
          ))}
        </select>
      </div>

      {report && (
        <>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>{report.totalStudents}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Enrolled Students</div>
            </div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{report.sessionsConducted}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Sessions Conducted</div>
            </div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{report.averageAttendance}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Avg Attendance</div>
            </div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: report.emergencyEvents > 0 ? '#ef4444' : '#10b981' }}>
                {report.emergencyEvents}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Emergency Overrides</div>
            </div>
          </div>
        </>
      )}

      {/* Session History List */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <History size={18} color="#38bdf8" /> Session Records ({history.length})
      </h2>

      {history.length === 0 ? (
        <div style={{ backgroundColor: '#111827', borderRadius: 12, padding: 20, textAlign: 'center', color: '#94a3b8' }}>
          No session history recorded for this class yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h) => (
            <div
              key={h.sessionId}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 12,
                padding: '14px 16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{h.sessionName}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: h.status === 'ENDED' ? '#10b981' : '#38bdf8',
                  backgroundColor: h.status === 'ENDED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  {h.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>Date: {h.date}</span>
                <span>Students: {h.studentCount}</span>
                <span>Emergencies: {h.emergencyCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
