import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  ALL_CATEGORIES,
  formatCurrencyTHB,
  formatThaiDate,
  formatThaiMonthKey,
  getPaymentMethodLabel,
  PAYMENT_METHODS,
  type Transaction,
} from '../types/finance';

interface LedgerViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function LedgerView({
  transactions,
  selectedMonthKey,
  onAddNew,
  onEdit,
  onDelete,
}: LedgerViewProps) {
  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return transactions
      .filter((tx) => {
        if (scope === 'month' && tx.monthKey !== selectedMonthKey) return false;
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
        if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;
        if (q) {
          const hay = `${tx.title} ${tx.category} ${tx.note}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        return a.amount - b.amount;
      });
  }, [transactions, scope, selectedMonthKey, typeFilter, categoryFilter, paymentFilter, searchQuery, sortBy]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleExportCSV = () => {
    const header = ['วันที่', 'ประเภท', 'ชื่อรายการ', 'หมวดหมู่', 'ช่องทางชำระเงิน', 'จำนวนเงิน (บาท)', 'หมายเหตุ'];
    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const lines = filtered.map((tx) =>
      [
        tx.date,
        tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        tx.title,
        tx.category,
        getPaymentMethodLabel(tx.paymentMethod),
        tx.amount.toFixed(2),
        tx.note,
      ]
        .map((c) => escapeCell(String(c)))
        .join(',')
    );

    const csvContent = '\uFEFF' + [header.map(escapeCell).join(','), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger_${scope === 'month' ? selectedMonthKey : 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Scope Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setScope('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scope === 'month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                เฉพาะเดือน {formatThaiMonthKey(selectedMonthKey)}
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scope === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ทุกเดือนทั้งหมด
              </button>
            </div>

            {/* Type Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                [
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'income', label: 'รายรับ' },
                  { id: 'expense', label: 'รายจ่าย' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTypeFilter(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    typeFilter === item.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อรายการ, หมายเหตุ..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="กรองตามหมวดหมู่"
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="กรองตามช่องทางชำระเงิน"
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกช่องทางชำระเงิน</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="เรียงลำดับ"
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date_desc">วันที่ล่าสุดก่อน</option>
            <option value="date_asc">วันที่เก่าสุดก่อน</option>
            <option value="amount_desc">จำนวนเงินมากที่สุด</option>
            <option value="amount_asc">จำนวนเงินน้อยที่สุด</option>
          </select>
        </div>

        {/* Filtered Totals Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-mono-num">
            พบทั้งหมด {filtered.length} รายการ
          </span>
          <div className="flex flex-wrap items-center gap-5 font-mono-num">
            <span className="text-emerald-600 dark:text-emerald-400">
              รายรับ: +{formatCurrencyTHB(summary.income, true)} ฿
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              รายจ่าย: -{formatCurrencyTHB(summary.expense, true)} ฿
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              สุทธิ: {summary.net >= 0 ? '+' : ''}
              {formatCurrencyTHB(summary.net, true)} ฿
            </span>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกรายการใหม่</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                  <th className="py-2.5 px-6">วันที่</th>
                  <th className="py-2.5 px-4">ประเภท</th>
                  <th className="py-2.5 px-4">รายการและหมวดหมู่</th>
                  <th className="py-2.5 px-4">ช่องทาง</th>
                  <th className="py-2.5 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-2.5 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono-num whitespace-nowrap">
                      {formatThaiDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{tx.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{tx.category}</span>
                        {tx.note && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[260px]">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {getPaymentMethodLabel(tx.paymentMethod)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono-num font-semibold whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrencyTHB(tx.amount, true)} ฿
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          aria-label={`แก้ไข ${tx.title}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(tx)}
                          aria-label={`ลบ ${tx.title}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
