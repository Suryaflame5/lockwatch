import { Logger } from '../logger.js';
import { PostgresService } from './postgres.js';
import type { DataStore } from './database.js';
import {
  Institution,
  User,
  Faculty,
  Student,
  Device,
  Class,
  ClassMembership,
  Session,
  UserRole,
  PlatformType,
  ClassStatus,
  ClassMembershipStatus,
  ClassJoinMethod,
  SessionStatus
} from '@lockwatch/shared-models';

export class PostgresSync {
  private static instance: PostgresSync;
  private pg = PostgresService.getInstance();
  private isInitialized = false;

  public static getInstance(): PostgresSync {
    if (!PostgresSync.instance) {
      PostgresSync.instance = new PostgresSync();
    }
    return PostgresSync.instance;
  }

  /**
   * Initializes PostgreSQL synchronization:
   * 1. Verifies connectivity to PostgreSQL.
   * 2. If DB has rows, hydrates in-memory DataStore directly from PostgreSQL.
   * 3. If DB is empty, seeds all initial default users, faculty, students, and classes into PostgreSQL.
   */
  public async init(store: DataStore): Promise<void> {
    if (this.isInitialized) return;

    try {
      const conn = await this.pg.testConnection();
      if (!conn.connected) {
        Logger.warn('PostgreSQL not connected, using in-memory store fallback', { error: conn.error });
        return;
      }

      Logger.info('PostgreSQL connected. Synchronizing persistent records with database...', { database: conn.database });

      // Check if institutions exist in DB
      const instCheck = await this.pg.query('SELECT count(*) FROM institutions;');
      const instCount = parseInt(instCheck.rows[0]?.count || '0', 10);

      if (instCount === 0) {
        Logger.info('PostgreSQL database is empty. Seeding initial institutions, users, and classes into PostgreSQL...');
        await this.seedAllToPostgres(store);
      } else {
        Logger.info('PostgreSQL database contains records. Hydrating store from PostgreSQL...');
        await this.hydrateStoreFromPostgres(store);
      }

      this.isInitialized = true;
      Logger.info('PostgreSQL synchronization initialized successfully.');
    } catch (err: any) {
      Logger.error('Failed to initialize PostgreSQL sync, proceeding with memory cache', { error: err.message });
    }
  }

  private async seedAllToPostgres(store: DataStore): Promise<void> {
    // 1. Institutions
    for (const inst of store.institutions.values()) {
      await this.saveInstitution(inst);
    }
    // 2. Users
    for (const u of store.users.values()) {
      await this.saveUser(u);
    }
    // 3. Faculty
    for (const f of store.faculty.values()) {
      await this.saveFaculty(f);
    }
    // 4. Students
    for (const s of store.students.values()) {
      await this.saveStudent(s);
    }
    // 5. Devices
    for (const d of store.devices.values()) {
      await this.saveDevice(d);
    }
    // 6. Classes
    for (const c of store.classes.values()) {
      await this.saveClass(c);
    }
    // 7. Class memberships
    for (const m of store.classMemberships.values()) {
      await this.saveClassMembership(m);
    }
    // 8. Sessions
    for (const s of store.sessions.values()) {
      await this.saveSession(s);
    }
  }

  public async hydrateStoreFromPostgres(store: DataStore): Promise<void> {
    try {
      // 1. Institutions
      const instRows = await this.pg.query('SELECT * FROM institutions;');
      for (const r of instRows.rows) {
        const inst: Institution = {
          id: r.id,
          code: r.code,
          name: r.name,
          domain: r.domain,
          retentionDays: r.retention_days,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
        store.institutions.set(inst.id, inst);
      }

      // 2. Users
      const userRows = await this.pg.query('SELECT * FROM users;');
      for (const r of userRows.rows) {
        const u: User = {
          id: r.id,
          institutionId: r.institution_id,
          role: r.role as UserRole,
          email: r.email,
          passwordHash: r.password_hash,
          pinHash: r.pin_hash || undefined,
          name: r.name,
          isActive: r.is_active,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
        store.users.set(u.id, u);
        store.userEmailIndex.set(`${u.institutionId}:${u.email.toLowerCase()}`, u.id);
      }

      // 3. Faculty
      const facRows = await this.pg.query('SELECT * FROM faculty;');
      for (const r of facRows.rows) {
        const f: Faculty = {
          id: r.id,
          userId: r.user_id,
          institutionId: r.institution_id,
          facultyIdNumber: r.faculty_id_number,
          department: r.department,
          designation: r.designation,
          name: store.users.get(r.user_id)?.name || 'Faculty',
          email: store.users.get(r.user_id)?.email || '',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
        store.faculty.set(f.id, f);
      }

      // 4. Students
      const stuRows = await this.pg.query('SELECT * FROM students;');
      for (const r of stuRows.rows) {
        const s: Student = {
          id: r.id,
          userId: r.user_id,
          institutionId: r.institution_id,
          registerNumber: r.register_number,
          department: r.department,
          className: r.class_name,
          phoneNumber: r.phone_number || undefined,
          phoneVerifiedAt: r.phone_verified_at ? new Date(r.phone_verified_at).toISOString() : undefined,
          name: store.users.get(r.user_id)?.name || 'Student',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
        store.students.set(s.id, s);
        store.studentRegIndex.set(`${s.institutionId}:${s.registerNumber.toUpperCase()}`, s.id);
        if (s.phoneNumber) {
          store.studentPhoneIndex.set(s.phoneNumber, s.id);
        }
      }

      // 5. Devices
      const devRows = await this.pg.query('SELECT * FROM devices;');
      for (const r of devRows.rows) {
        const d: Device = {
          id: r.id,
          studentId: r.student_id,
          institutionId: r.institution_id,
          platform: r.platform as PlatformType,
          manufacturer: r.manufacturer,
          model: r.model,
          osVersion: r.os_version,
          appVersion: r.app_version,
          enrollmentStatus: r.enrollment_status,
          isDeviceOwner: r.is_device_owner,
          hasAacEntitlement: r.has_aac_entitlement,
          publicKey: r.public_key,
          lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : new Date().toISOString(),
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
        store.devices.set(d.id, d);
      }

      // 6. Classes
      const classRows = await this.pg.query('SELECT * FROM classes WHERE status != \'ARCHIVED\';');
      for (const r of classRows.rows) {
        const c: Class = {
          id: r.id,
          institutionId: r.institution_id,
          createdBy: r.created_by,
          name: r.name,
          subject: r.subject,
          department: r.department,
          year: r.year,
          semester: r.semester,
          section: r.section,
          description: r.description,
          classCode: r.class_code,
          status: r.status as ClassStatus,
          startTime: r.start_time,
          endTime: r.end_time,
          activeSessionId: null,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
        store.classes.set(c.id, c);
        store.indexClassCode(c.classCode, c.id);
      }

      // 7. Class memberships
      const memRows = await this.pg.query('SELECT * FROM class_memberships WHERE status = \'ENROLLED\';');
      for (const r of memRows.rows) {
        const student = store.students.get(r.student_id);
        const m: ClassMembership = {
          id: r.id,
          classId: r.class_id,
          studentId: r.student_id,
          displayName: student?.name || 'Student',
          registerNumber: student?.registerNumber || 'REG',
          joinMethod: ClassJoinMethod.CODE,
          status: r.status as ClassMembershipStatus,
          joinedAt: r.joined_at ? new Date(r.joined_at).toISOString() : new Date().toISOString(),
          removedAt: r.removed_at ? new Date(r.removed_at).toISOString() : undefined
        };
        store.addClassMembership(m);
      }

      Logger.info(`Hydrated from PostgreSQL: ${store.users.size} users, ${store.students.size} students, ${store.classes.size} classes, ${store.classMemberships.size} memberships.`);
    } catch (err: any) {
      Logger.error('Error during PostgreSQL store hydration', { error: err.message });
    }
  }

  // --- Realtime persistence helpers ---

  public async saveInstitution(inst: Institution): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO institutions (id, code, name, domain, retention_days, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name = EXCLUDED.name,
           domain = EXCLUDED.domain,
           retention_days = EXCLUDED.retention_days,
           updated_at = EXCLUDED.updated_at;`,
        [inst.id, inst.code, inst.name, inst.domain, inst.retentionDays, inst.createdAt, inst.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save institution to PostgreSQL', { error: err.message, id: inst.id });
    }
  }

  public async saveUser(user: User): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO users (id, institution_id, role, email, password_hash, pin_hash, name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           pin_hash = EXCLUDED.pin_hash,
           name = EXCLUDED.name,
           is_active = EXCLUDED.is_active,
           updated_at = EXCLUDED.updated_at;`,
        [user.id, user.institutionId, user.role, user.email, user.passwordHash, user.pinHash || null, user.name, user.isActive, user.createdAt, user.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save user to PostgreSQL', { error: err.message, id: user.id });
    }
  }

  public async saveFaculty(faculty: Faculty): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO faculty (id, user_id, institution_id, faculty_id_number, department, designation, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           faculty_id_number = EXCLUDED.faculty_id_number,
           department = EXCLUDED.department,
           designation = EXCLUDED.designation,
           updated_at = EXCLUDED.updated_at;`,
        [faculty.id, faculty.userId, faculty.institutionId, faculty.facultyIdNumber, faculty.department || 'General', faculty.designation || 'Faculty', faculty.createdAt, faculty.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save faculty to PostgreSQL', { error: err.message, id: faculty.id });
    }
  }

  public async saveStudent(student: Student): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO students (id, user_id, institution_id, register_number, department, class_name, phone_number, phone_verified_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           register_number = EXCLUDED.register_number,
           department = EXCLUDED.department,
           class_name = EXCLUDED.class_name,
           phone_number = EXCLUDED.phone_number,
           phone_verified_at = EXCLUDED.phone_verified_at,
           updated_at = EXCLUDED.updated_at;`,
        [student.id, student.userId, student.institutionId, student.registerNumber, student.department, student.className, student.phoneNumber || null, student.phoneVerifiedAt || null, student.createdAt, student.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save student to PostgreSQL', { error: err.message, id: student.id });
    }
  }

  public async saveDevice(device: Device): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO devices (id, student_id, institution_id, platform, manufacturer, model, os_version, app_version, enrollment_status, is_device_owner, has_aac_entitlement, public_key, last_seen_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
           enrollment_status = EXCLUDED.enrollment_status,
           last_seen_at = EXCLUDED.last_seen_at,
           updated_at = EXCLUDED.updated_at;`,
        [device.id, device.studentId, device.institutionId, device.platform, device.manufacturer, device.model, device.osVersion, device.appVersion, device.enrollmentStatus, device.isDeviceOwner, device.hasAacEntitlement, device.publicKey, device.lastSeenAt, device.createdAt, device.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save device to PostgreSQL', { error: err.message, id: device.id });
    }
  }

  public async saveClass(cls: Class): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO classes (id, institution_id, created_by, name, subject, department, year, semester, section, description, class_code, status, start_time, end_time, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           subject = EXCLUDED.subject,
           department = EXCLUDED.department,
           status = EXCLUDED.status,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           updated_at = EXCLUDED.updated_at;`,
        [cls.id, cls.institutionId, cls.createdBy, cls.name, cls.subject, cls.department, cls.year, cls.semester, cls.section, cls.description || null, cls.classCode, cls.status, cls.startTime || null, cls.endTime || null, cls.createdAt, cls.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save class to PostgreSQL', { error: err.message, id: cls.id });
    }
  }

  public async saveClassMembership(mem: ClassMembership): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO class_memberships (id, class_id, student_id, status, joined_at, removed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           removed_at = EXCLUDED.removed_at;`,
        [mem.id, mem.classId, mem.studentId, mem.status, mem.joinedAt, mem.removedAt || null]
      );
    } catch (err: any) {
      Logger.error('Failed to save class membership to PostgreSQL', { error: err.message, id: mem.id });
    }
  }

  public async saveSession(session: Session): Promise<void> {
    try {
      await this.pg.query(
        `INSERT INTO sessions (id, institution_id, faculty_id, name, subject, department, class_name, join_code, join_token_secret, status, scheduled_start_time, duration_minutes, emergency_duration_seconds, join_window_minutes, rules, class_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at;`,
        [session.id, session.institutionId, session.facultyId, session.name, session.subject, session.department, session.className, session.joinCode, session.joinTokenSecret, session.status, session.scheduledStartTime, session.durationMinutes, session.emergencyDurationSeconds, session.joinWindowMinutes, JSON.stringify(session.rules), session.classId || null, session.createdAt, session.updatedAt]
      );
    } catch (err: any) {
      Logger.error('Failed to save session to PostgreSQL', { error: err.message, id: session.id });
    }
  }
}
