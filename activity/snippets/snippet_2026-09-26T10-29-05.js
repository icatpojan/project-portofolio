// Helper - 2026-09-26T10:29:05
// Helper: Chunk array into smaller sizes
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));
