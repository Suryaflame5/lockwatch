import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, FileText, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { SessionReportSummary } from '@lockwatch/shared-models';

export const ReportsView: React.FC<{ activeSessionId: string }> = ({ activeSessionId }) => {
  const { client } = useAuth();
  const [report, setReport] = useState<SessionReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await client.getSessionReport(activeSessionId);
        setReport(data);
      } catch (e) {
        console.error('Failed to load report', e);
      } finally {
        setLoading(false);
      }
    };
    if (activeSessionId) fetchReport();
  }, [activeSessionId]);

  const handleDownloadCsv = () => {
    window.open(`http://localhost:4000/sessions/${activeSessionId}/report.csv`, '_blank');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#94a3b8' }}>Compiling session report...</div>;
  }

  if (!report) {
    return <div style={{ padding: '40px', color: '#64748b' }}>No report available for this session.</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px 0' }}>
            SESSION SUPERVISION REPORT
          </h2>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            {report.session.subject} • Faculty: {report.session.facultyName} • Date: {report.session.date}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#171e31',
              border: '1px solid #1e293b',
              color: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={handlePrintPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        backgroundColor: '#131929',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>TOTAL STUDENTS</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>{report.metrics.totalStudents}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>ACTIVE PARTICIPANTS</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>{report.metrics.active}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>INTERRUPTIONS</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444' }}>{report.metrics.leftSupervision}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600 }}>EMERGENCY REQUESTS</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f43f5e' }}>{report.metrics.emergency}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>OFFLINE INCIDENTS</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#64748b' }}>{report.metrics.offline}</div>
        </div>
      </div>

      {/* Student Audit Roster Table */}
      <div style={{ backgroundColor: '#131929', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#101522', borderBottom: '1px solid #1e293b', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>Register No</th>
              <th style={{ padding: '12px' }}>Student Name</th>
              <th style={{ padding: '12px' }}>Platform</th>
              <th style={{ padding: '12px' }}>Device Model</th>
              <th style={{ padding: '12px' }}>Final Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Interruptions</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Emergency Count</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Offline Time</th>
            </tr>
          </thead>
          <tbody>
            {report.students.map((stu) => (
              <tr key={stu.registerNumber} style={{ borderBottom: '1px solid #1a2234' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{stu.registerNumber}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: '#f8fafc' }}>{stu.name}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{stu.platform}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{stu.deviceModel}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: stu.status === 'ACTIVE' || stu.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: stu.status === 'ACTIVE' || stu.status === 'COMPLETED' ? '#10b981' : '#ef4444'
                  }}>
                    {stu.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', color: stu.interruptions > 0 ? '#ef4444' : '#64748b' }}>
                  {stu.interruptions}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', color: stu.emergencyCount > 0 ? '#f43f5e' : '#64748b' }}>
                  {stu.emergencyCount}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                  {stu.offlineSeconds}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
