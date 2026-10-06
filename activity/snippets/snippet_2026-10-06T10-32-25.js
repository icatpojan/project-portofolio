// Helper - 2026-10-06T10:32:25
// Helper: Formatting currency IDR
const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
