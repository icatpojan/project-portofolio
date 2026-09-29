// Helper - 2026-09-29T11:06:40
// Helper: Chunk array into smaller sizes
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));
