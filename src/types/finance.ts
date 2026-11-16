export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'promptpay'
  | 'credit_card'
  | 'e_wallet';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  note: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  paymentMethod: PaymentMethod;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  monthKey: string;
  limitAmount: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface CategoryMeta {
  name: string;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { name: 'อาหารและเครื่องดื่ม', color: '#2563EB' },
  { name: 'เดินทางและขนส่ง', color: '#0EA5E9' },
  { name: 'ที่พักและค่าเช่า', color: '#7C3AED' },
  { name: 'บิลและสาธารณูปโภค', color: '#D97706' },
  { name: 'ช้อปปิ้งและของใช้', color: '#EC4899' },
  { name: 'สุขภาพและการแพทย์', color: '#10B981' },
  { name: 'การศึกษาและหนังสือ', color: '#6366F1' },
  { name: 'ความบันเทิง', color: '#F97316' },
  { name: 'รายจ่ายอื่นๆ', color: '#64748B' },
];

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { name: 'เงินเดือน', color: '#059669' },
  { name: 'รายได้เสริม / ฟรีแลนซ์', color: '#0D9488' },
  { name: 'โบนัสและเบี้ยขยัน', color: '#2563EB' },
  { name: 'ดอกเบี้ยและการลงทุน', color: '#7C3AED' },
  { name: 'เงินโอนจากครอบครัว', color: '#0EA5E9' },
  { name: 'รายรับอื่นๆ', color: '#64748B' },
];

export const ALL_CATEGORIES: CategoryMeta[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'promptpay', label: 'พร้อมเพย์ (PromptPay)' },
  { value: 'bank_transfer', label: 'โอนผ่านธนาคาร' },
  { value: 'cash', label: 'เงินสด' },
  { value: 'credit_card', label: 'บัตรเครดิต / เดบิต' },
  { value: 'e_wallet', label: 'e-Wallet' },
];

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? 'อื่นๆ';
}

export function getCategoryColor(category: string): string {
  return ALL_CATEGORIES.find((c) => c.name === category)?.color ?? '#64748B';
}

export const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatThaiMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return monthKey;
  const buddhistYear = y + 543;
  return `${THAI_MONTHS_FULL[m - 1]} ${buddhistYear} (${y})`;
}

export function formatThaiMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return monthKey;
  const shortBE = String(y + 543).slice(-2);
  return `${THAI_MONTHS_SHORT[m - 1]} ${shortBE}`;
}

export function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return dateStr;
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`;
}

export function formatCurrencyTHB(value: number, showDecimals = false): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
}

export function getPreviousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (m === 1) {
    return `${y - 1}-12`;
  }
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

export function getNextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (m === 12) {
    return `${y + 1}-01`;
  }
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
