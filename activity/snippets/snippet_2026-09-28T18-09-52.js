// Helper - 2026-09-28T18:09:52
// Helper: Chunk array into smaller sizes
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));
