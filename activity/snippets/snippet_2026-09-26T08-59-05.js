// Helper - 2026-09-26T08:59:05
// Helper: Formatting currency IDR
const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
