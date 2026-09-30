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
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', color: '#111111' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: '#000000' }}>
          Class Analytics & Reports
        </h1>
        <div style={{ fontSize: 13, color: '#666666' }}>
          Attendance verification and examination history
        </div>
      </div>

      {/* Class Selector Dropdown */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 6 }}>
          SELECT CLASS
        </label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9D9D9',
            borderRadius: 6,
            padding: '10px 12px',
            color: '#111111',
            fontSize: 13,
            fontWeight: 600,
            boxSizing: 'border-box'
          }}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.classCode || (c as any).code})
            </option>
          ))}
        </select>
      </div>

      {report && (
        <>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>{report.totalStudents}</div>
              <div style={{ fontSize: 11, color: '#666666', marginTop: 2, fontWeight: 600 }}>Enrolled Students</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>{report.sessionsConducted}</div>
              <div style={{ fontSize: 11, color: '#666666', marginTop: 2, fontWeight: 600 }}>Sessions Conducted</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>{report.averageAttendance}</div>
              <div style={{ fontSize: 11, color: '#666666', marginTop: 2, fontWeight: 600 }}>Avg Attendance</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#000000' }}>
                {report.emergencyEvents}
              </div>
              <div style={{ fontSize: 11, color: '#666666', marginTop: 2, fontWeight: 600 }}>Emergency Overrides</div>
            </div>
          </div>
        </>
      )}

      {/* Session History */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#000000' }}>
        Session History
      </h2>

      {history.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px dashed #D9D9D9',
          borderRadius: 8,
          padding: 24,
          textAlign: 'center',
          color: '#666666'
        }}>
          No past sessions recorded for this class.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map((item) => (
            <div
              key={item.sessionId}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: '#000000' }}>{item.sessionName}</strong>
                <div style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>
                  {new Date(item.startsAt || item.date).toLocaleDateString()} • {item.status}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  backgroundColor: '#F0F0F0',
                  color: '#000000',
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  {item.studentCount} Attended
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
