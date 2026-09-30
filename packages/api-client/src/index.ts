import {
  HeartbeatPayload,
  SessionEvent,
  CommandType,
  CommandStatus,
  StudentReadinessResult,
  SessionReportSummary,
  Class,
  ClassMembership,
  ClassRosterStudent,
  ClassHistoryItem,
  ClassReportSummary,
  Session
} from '@lockwatch/shared-models';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  storage?: StorageAdapter;
  onAuthExpired?: () => void;
  onNetworkStateChange?: (isOnline: boolean) => void;
}

export class LockWatchApiClient {
  private baseUrl: string;
  private storage: StorageAdapter;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isOnline: boolean = true;
  private eventQueueKey = 'lockwatch_event_queue';
  private onAuthExpired?: () => void;
  private onNetworkStateChange?: (isOnline: boolean) => void;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.storage = config.storage || new MemoryStorageAdapter();
    this.onAuthExpired = config.onAuthExpired;
    this.onNetworkStateChange = config.onNetworkStateChange;
    this.initTokens();
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async initTokens() {
    this.accessToken = await this.storage.getItem('lockwatch_access_token');
    this.refreshToken = await this.storage.getItem('lockwatch_refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.storage.setItem('lockwatch_access_token', access);
    this.storage.setItem('lockwatch_refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.storage.removeItem('lockwatch_access_token');
    this.storage.removeItem('lockwatch_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            const errData = await retryResponse.json().catch(() => ({}));
            throw new Error(errData.message || `Request failed with status ${retryResponse.status}`);
          }
          return retryResponse.json();
        } else {
          this.clearTokens();
          this.onAuthExpired?.();
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      this.setOnlineStatus(true);
      return response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        this.setOnlineStatus(false);
      }
      throw err;
    }
  }

  private setOnlineStatus(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.onNetworkStateChange?.(online);
      if (online) {
        // Attempt flushing offline events when back online
        this.flushEventQueue().catch(() => {});
      }
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve) => {
        this.refreshSubscribers.push((token) => {
          resolve(!!token);
        });
      });
    }

    this.isRefreshing = true;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!res.ok) {
        this.refreshSubscribers.forEach(cb => cb(''));
        this.refreshSubscribers = [];
        return false;
      }

      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      this.refreshSubscribers.forEach(cb => cb(data.accessToken));
      this.refreshSubscribers = [];
      return true;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- Offline Event Queue ---

  public async queueEvent(event: SessionEvent): Promise<void> {
    const raw = await this.storage.getItem(this.eventQueueKey);
    const queue: SessionEvent[] = raw ? JSON.parse(raw) : [];
    // Ensure no duplicate eventId
    if (!queue.find(e => e.id === event.id)) {
      queue.push(event);
      await this.storage.setItem(this.eventQueueKey, JSON.stringify(queue));
    }

    if (this.isOnline) {
      await this.flushEventQueue();
    }
  }

  public async flushEventQueue(): Promise<number> {
    const raw = await this.storage.getItem(this.eventQueueKey);
    if (!raw) return 0;
    const queue: SessionEvent[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    try {
      await this.request('/events/batch', {
        method: 'POST',
        body: JSON.stringify({ events: queue })
      });
      // Clear queue upon successful transmission
      await this.storage.removeItem(this.eventQueueKey);
      return queue.length;
    } catch (err) {
      // Keep in queue for next retry
      return 0;
    }
  }

  // --- Auth APIs ---

  public async facultyLogin(payload: { identifier: string; password?: string; pin?: string; institutionCode: string }) {
    const res = await this.request<any>('/auth/faculty/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  public async requestStudentSignupOtp(phoneNumber: string): Promise<{ challengeId: string; phoneNumber: string; expiresInSeconds: number; resendCooldownSeconds: number }> {
    return this.request('/auth/student/request-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  public async verifyStudentSignupOtp(challengeId: string, otp: string): Promise<{ success: boolean; verificationToken: string; phoneNumber: string; message: string }> {
    return this.request('/auth/student/verify-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp })
    });
  }

  public async createStudentAccount(payload: { verificationToken: string; password: string; name: string; registerNumber: string; institutionCode?: string }) {
    const res = await this.request<any>('/auth/student/create-account', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  public async requestStudentPasswordResetOtp(phoneNumber: string): Promise<{ challengeId: string; phoneNumber: string; expiresInSeconds: number; resendCooldownSeconds: number }> {
    return this.request('/auth/student/request-password-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  public async verifyStudentPasswordResetOtp(challengeId: string, otp: string): Promise<{ success: boolean; resetToken: string; phoneNumber: string; message: string }> {
    return this.request('/auth/student/verify-password-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp })
    });
  }

  public async resetStudentPassword(payload: { resetToken: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/student/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async studentLogin(payload: { phoneNumber?: string; registerNumber?: string; password: string; institutionCode?: string }) {
    const res = await this.request<any>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  public async getStudentMe(): Promise<any> {
    return this.request<any>('/students/me');
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  // --- Faculty Session APIs ---

  public async getFacultyMe() {
    return this.request<any>('/faculty/me');
  }

  public async getFacultySessions() {
    return this.request<any[]>('/faculty/sessions');
  }

  public async createSession(data: any) {
    return this.request<any>('/faculty/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async getSessionLiveState(sessionId: string) {
    return this.request<any>(`/faculty/sessions/${sessionId}/live`);
  }

  public async getSessionReadiness(sessionId: string): Promise<StudentReadinessResult[]> {
    return this.request<StudentReadinessResult[]>(`/faculty/sessions/${sessionId}/readiness`);
  }

  public async startSession(sessionId: string) {
    return this.request<any>(`/faculty/sessions/${sessionId}/start`, { method: 'POST' });
  }

  public async pauseSession(sessionId: string) {
    return this.request<any>(`/faculty/sessions/${sessionId}/pause`, { method: 'POST' });
  }

  public async resumeSession(sessionId: string) {
    return this.request<any>(`/faculty/sessions/${sessionId}/resume`, { method: 'POST' });
  }

  public async endSession(sessionId: string) {
    return this.request<any>(`/faculty/sessions/${sessionId}/end`, { method: 'POST' });
  }

  public async getSessionAlerts(sessionId: string) {
    return this.request<any[]>(`/sessions/${sessionId}/alerts`);
  }

  public async acknowledgeAlert(alertId: string) {
    return this.request<any>(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
  }

  public async getSessionReport(sessionId: string): Promise<SessionReportSummary> {
    return this.request<SessionReportSummary>(`/sessions/${sessionId}/report`);
  }

  public async getSessionAuditLogs(sessionId: string) {
    return this.request<any[]>(`/sessions/${sessionId}/audit-logs`);
  }

  // --- Student & Device APIs ---

  public async registerDevice(data: any) {
    return this.request<any>('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async joinSession(sessionIdOrCode: string, deviceId: string) {
    return this.request<any>(`/sessions/${sessionIdOrCode}/join`, {
      method: 'POST',
      body: JSON.stringify({ joinCode: sessionIdOrCode, deviceId })
    });
  }

  public async getStudentSessionStatus(sessionId: string) {
    return this.request<any>(`/sessions/${sessionId}/status`);
  }

  public async sendHeartbeat(payload: HeartbeatPayload) {
    return this.request<any>(`/devices/${payload.deviceId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async acknowledgeCommand(data: {
    commandId: string;
    sessionId: string;
    studentId: string;
    deviceId: string;
    status: CommandStatus;
    executedAt: string;
    error?: string;
  }) {
    return this.request<any>('/commands/acknowledge', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async requestEmergency(data: {
    sessionId: string;
    studentId: string;
    deviceId: string;
    reason?: string;
    clientTimestamp: string;
  }) {
    return this.request<any>('/emergency/request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async exitEmergency(data: {
    sessionId: string;
    studentId: string;
    deviceId: string;
    clientTimestamp: string;
  }) {
    return this.request<any>('/emergency/exit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Class Management APIs ---

  public async getFacultyClasses(): Promise<Class[]> {
    return this.request<Class[]>('/classes');
  }

  public async createClass(data: {
    name: string;
    subject: string;
    department: string;
    year: string;
    semester: string;
    section: string;
    description?: string;
    classCode?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<Class> {
    return this.request<Class>('/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async getClassDetails(classId: string): Promise<Class> {
    return this.request<Class>(`/classes/${classId}`);
  }

  public async updateClass(classId: string, data: Partial<Class>): Promise<Class> {
    return this.request<Class>(`/classes/${classId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async archiveClass(classId: string): Promise<void> {
    return this.request<void>(`/classes/${classId}/archive`, {
      method: 'POST'
    });
  }

  public async generateClassQr(classId: string): Promise<{ token: string; qrPayload: string; expiresAt: string }> {
    return this.request<{ token: string; qrPayload: string; expiresAt: string }>(`/classes/${classId}/qr`, {
      method: 'POST'
    });
  }

  public async getClassRoster(classId: string): Promise<ClassRosterStudent[]> {
    return this.request<ClassRosterStudent[]>(`/classes/${classId}/roster`);
  }

  public async addStudentToClass(classId: string, registerNumber: string): Promise<ClassRosterStudent> {
    return this.request<ClassRosterStudent>(`/classes/${classId}/roster`, {
      method: 'POST',
      body: JSON.stringify({ registerNumber })
    });
  }

  public async bulkAddStudents(classId: string, registerNumbers: string[]): Promise<{ added: number; failed: string[] }> {
    return this.request<{ added: number; failed: string[] }>(`/classes/${classId}/roster/bulk`, {
      method: 'POST',
      body: JSON.stringify({ registerNumbers })
    });
  }

  public async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    return this.request<void>(`/classes/${classId}/roster/${studentId}`, {
      method: 'DELETE'
    });
  }

  public async getClassHistory(classId: string): Promise<ClassHistoryItem[]> {
    return this.request<ClassHistoryItem[]>(`/classes/${classId}/history`);
  }

  public async getClassReport(classId: string): Promise<ClassReportSummary> {
    return this.request<ClassReportSummary>(`/classes/${classId}/report`);
  }

  public async createClassSession(classId: string, data: {
    name: string;
    scheduledStartTime?: string;
    durationMinutes?: number;
    emergencyDurationSeconds?: number;
    rules?: string[];
  }): Promise<Session> {
    return this.request<Session>(`/classes/${classId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async getClassSessionStatus(classId: string): Promise<{ classId: string; className: string; activeSession: Session | null; metrics: any }> {
    return this.request<any>(`/classes/${classId}/session-status`);
  }

  // --- Student Class APIs ---

  public async getStudentClasses(): Promise<Array<{ class: Class; membership: ClassMembership; activeSession: Session | null }>> {
    return this.request<Array<{ class: Class; membership: ClassMembership; activeSession: Session | null }>>('/students/classes');
  }

  public async joinClass(data: { classCode?: string; qrToken?: string; displayName: string; registerNumber: string; deviceId?: string }): Promise<{ class: Class; membership: ClassMembership; message?: string }> {
    return this.request<{ class: Class; membership: ClassMembership; message?: string }>('/students/classes/join', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async joinClassByCode(classCode: string, academicIdentity?: { displayName?: string; registerNumber?: string }, deviceId?: string): Promise<{ class: Class; membership: ClassMembership; message?: string }> {
    return this.request<{ class: Class; membership: ClassMembership; message?: string }>('/students/classes/join-code', {
      method: 'POST',
      body: JSON.stringify({ classCode, displayName: academicIdentity?.displayName, registerNumber: academicIdentity?.registerNumber, deviceId })
    });
  }

  public async joinClassByQr(qrToken: string, academicIdentity?: { displayName?: string; registerNumber?: string }, deviceId?: string): Promise<{ class: Class; membership: ClassMembership; message?: string }> {
    return this.request<{ class: Class; membership: ClassMembership; message?: string }>('/students/classes/join-qr', {
      method: 'POST',
      body: JSON.stringify({ qrToken, displayName: academicIdentity?.displayName, registerNumber: academicIdentity?.registerNumber, deviceId })
    });
  }
}

