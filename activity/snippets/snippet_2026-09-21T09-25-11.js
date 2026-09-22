// Helper - 2026-09-21T09:25:11
// Helper: Random string generator
const randomStr = (len = 8) => Math.random().toString(36).substring(2, 2 + len);
