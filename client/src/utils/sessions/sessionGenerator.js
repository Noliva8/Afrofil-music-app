
import { v4 as uuidv4 } from 'uuid';

class SessionManager {
  constructor() {
    this.sessionId = null;
    this.lastActivity = null;
    this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes
    this.timeoutId = null;
    this.onSessionEnd = null; // Optional callback when session ends
  }

  /**
   * Get or create the current session ID
   * @returns {string} sessionId
   */
  getCurrentSession() {
    const storedSessionId = sessionStorage.getItem('userSessionId');
    const storedLastActivity = parseInt(sessionStorage.getItem('sessionLastActivity'), 10) || 0;
    const now = Date.now();

    const isSessionValid = storedSessionId && (now - storedLastActivity < this.inactivityTimeout);

    if (isSessionValid) {
      this.sessionId = storedSessionId;
      this.lastActivity = storedLastActivity;
      this.resetInactivityTimer();
      return this.sessionId;
    }

    return this.startNewSession();
  }

  /**
   * Start a new session
   * @returns {string} new sessionId
   */
  startNewSession() {
    this.sessionId = uuidv4();
    this.lastActivity = Date.now();

    sessionStorage.setItem('userSessionId', this.sessionId);
    sessionStorage.setItem('sessionLastActivity', this.lastActivity.toString());

    this.resetInactivityTimer();
    console.log('🎯 New session started:', this.sessionId);
    return this.sessionId;
  }

  /**
   * Update session activity and reset the timeout
   */
  updateActivity() {
    if (!this.sessionId) {
      this.getCurrentSession(); // ensure session exists
    }

    this.lastActivity = Date.now();
    sessionStorage.setItem('sessionLastActivity', this.lastActivity.toString());
    this.resetInactivityTimer();
  }

  /**
   * Set/Reset the inactivity timer
   */
  resetInactivityTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      console.log('🛑 Session ended due to inactivity:', this.sessionId);
      this.endSession();
    }, this.inactivityTimeout);
  }

  /**
   * End the session manually (e.g. logout, close app)
   */
  endSession() {
    sessionStorage.removeItem('userSessionId');
    sessionStorage.removeItem('sessionLastActivity');

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (typeof this.onSessionEnd === 'function') {
      this.onSessionEnd(this.sessionId);
    }

    this.sessionId = null;
    this.lastActivity = null;
    this.timeoutId = null;
  }

  /**
   * Optional: Hook a callback when the session ends
   */
  setOnSessionEnd(callback) {
    if (typeof callback === 'function') {
      this.onSessionEnd = callback;
    }
  }
}

// Export a singleton
export const sessionManager = new SessionManager();




// /** Keep a 48h session id in localStorage */
export const ensureSessionId = () => {
  const KEY = 'afrofeel_session_v1';
  const TTL = 'afrofeel_session_v1_ttl';
  const now = Date.now();
  const ttl = Number(localStorage.getItem(TTL) || 0);
  let sid = localStorage.getItem(KEY);
  if (!sid || now > ttl) {
    sid = (crypto.randomUUID?.() ?? base64url(16));
    localStorage.setItem(KEY, sid);
    localStorage.setItem(TTL, String(now + 48 * 3600 * 1000));
  }
  return sid;
};
