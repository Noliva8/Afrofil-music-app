// plabackUtls/presistancePointer.js
const PTR_KEY = 'af_ctx_ptr_v1';

export function writeCtxPointer({ userId, sessionId }) {
  try {
    const owner =
      userId ? `user:${userId}` :
      sessionId ? `sess:${sessionId}` :
      null;
    if (!owner) return;

    const prev = readCtxPointer() || {};
    const next = {
      owner,
      userId: userId || prev.userId || null,
      sessionId: sessionId || prev.sessionId || null,
      ts: Date.now(),
    };
    localStorage.setItem(PTR_KEY, JSON.stringify(next));
  } catch {}
}

export function readCtxPointer() {
  try {
    const raw = localStorage.getItem(PTR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
