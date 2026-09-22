// Helper - 2026-09-22T09:41:46
// Helper: Formatting currency IDR
const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
