import React, { useState } from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import { BookOpen, Plus, Users, ChevronRight, Clock, Hash } from 'lucide-react';

interface ClassesScreenProps {
  onSelectClass: (cls: any) => void;
}

export const ClassesScreen: React.FC<ClassesScreenProps> = ({ onSelectClass }) => {
  const { classes, createClass } = useFacultyAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('2026-2027');
  const [semester, setSemester] = useState('Semester 6');
  const [section, setSection] = useState('A');
  const [classCode, setClassCode] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createClass({
        name,
        subject,
        department,
        year,
        semester,
        section,
        classCode: classCode.trim() || undefined,
        startTime,
        endTime
      });
      setShowModal(false);
      setName('');
      setSubject('');
      setClassCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            Persistent Classes
          </h1>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Academic containers & student rosters
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div style={{
          backgroundColor: '#111827',
          border: '1px dashed #374151',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center'
        }}>
          <BookOpen size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No Classes Yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            Create your first persistent class to manage rosters and run exams.
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Create Class
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() => onSelectClass(cls)}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(56, 189, 248, 0.2)'
                  }}>
                    {cls.classCode}
                  </span>
                  <span style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    {cls.status}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>
                  {cls.name}
                </h3>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  {cls.subject} • Sec {cls.section}
                </div>
                {cls.startTime && cls.endTime && (
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Clock size={12} /> {cls.startTime} - {cls.endTime}
                  </div>
                )}
              </div>
              <ChevronRight size={20} color="#64748b" />
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 440,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
              Create New Class
            </h2>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  CLASS NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI & Machine Learning Section E"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    padding: 10,
                    color: '#ffffff',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  SUBJECT
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS804 - Artificial Intelligence"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    padding: 10,
                    color: '#ffffff',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    SECTION
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    CUSTOM CODE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    START TIME
                  </label>
                  <input
                    type="text"
                    placeholder="09:00"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    END TIME
                  </label>
                  <input
                    type="text"
                    placeholder="10:30"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8,
                      padding: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: '1px solid #374151',
                    color: '#94a3b8',
                    borderRadius: 8,
                    padding: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
