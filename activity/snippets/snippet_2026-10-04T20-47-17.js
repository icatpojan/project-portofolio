// Helper - 2026-10-04T20:47:17
// Helper: Random string generator
const randomStr = (len = 8) => Math.random().toString(36).substring(2, 2 + len);
