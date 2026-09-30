import React, { useState } from 'react';
import { useFacultyAuth } from '../context/FacultyAuthContext';
import { BookOpen, Plus, Users, ChevronRight, Clock, Hash, X } from 'lucide-react';

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
    if (!name.trim()) {
      setError('Please provide a class name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createClass({
        name,
        subject: subject || name,
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
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', color: '#111111' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#000000' }}>
            Academic Classes
          </h1>
          <div style={{ fontSize: 13, color: '#666666' }}>
            Manage persistent courses & student rosters
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '9px 14px',
            fontSize: 12,
            fontWeight: 600,
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
          backgroundColor: '#FFFFFF',
          border: '1px dashed #D9D9D9',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center'
        }}>
          <BookOpen size={32} color="#888888" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#000000' }}>No Classes Created</div>
          <div style={{ fontSize: 13, color: '#666666', marginBottom: 16 }}>
            Create your first class to generate join codes and manage student rosters.
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Class
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classes.map((cls) => {
            const studentCount = (cls as any).studentCount ?? 60;
            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9D9D9',
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      backgroundColor: '#F0F0F0',
                      color: '#000000',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {cls.classCode || (cls as any).code}
                    </span>
                    <strong style={{ fontSize: 14, color: '#000000' }}>
                      {cls.name}
                    </strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#666666' }}>
                    {cls.subject} • Sec {cls.section} • {cls.department}
                  </div>
                  <div style={{ fontSize: 11, color: '#888888', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={12} />
                    <span>{studentCount} Enrolled Students</span>
                  </div>
                </div>

                <ChevronRight size={18} color="#888888" />
              </div>
            );
          })}
        </div>
      )}

      {/* Create Class Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9D9D9',
            borderRadius: 12,
            padding: 24,
            maxWidth: 420,
            width: '100%',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
            color: '#111111'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#000000' }}>
                Create New Academic Class
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#F8F8F8',
                border: '1px solid #000000',
                borderRadius: 6,
                padding: 10,
                fontSize: 12,
                color: '#000000',
                marginBottom: 12
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                  CLASS NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Operating Systems"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    minHeight: 48,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #D9D9D9',
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                    SUBJECT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS401"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      minHeight: 48,
                      padding: '0 12px',
                      borderRadius: 6,
                      border: '1px solid #D9D9D9',
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                    SECTION
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      minHeight: 48,
                      padding: '0 12px',
                      borderRadius: 6,
                      border: '1px solid #D9D9D9',
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                  CUSTOM CODE (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank (e.g. CS401A)"
                  value={classCode}
                  onChange={e => setClassCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    height: 48,
                    minHeight: 48,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #D9D9D9',
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    minHeight: 48,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9D9D9',
                    borderRadius: 6,
                    fontSize: 13,
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
                    height: 48,
                    minHeight: 48,
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
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
