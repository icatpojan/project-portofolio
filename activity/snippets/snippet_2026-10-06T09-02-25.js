// Helper - 2026-10-06T09:02:25
// Helper: Chunk array into smaller sizes
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));
