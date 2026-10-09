// Helper - 2026-10-09T17:42:59
// Helper: Formatting currency IDR
const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
