import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  formatCurrencyTHB,
  formatThaiMonthKey,
  getCategoryColor,
  type MonthlyBudget,
  type Transaction,
} from '../types/finance';

interface BudgetViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
  budgets: Record<string, MonthlyBudget>;
  onSaveBudget: (monthKey: string, limitAmount: number) => Promise<void>;
}

export function BudgetView({
  transactions,
  selectedMonthKey,
  budgets,
  onSaveBudget,
}: BudgetViewProps) {
  const existingLimit = budgets[selectedMonthKey]?.limitAmount ?? 0;
  const [limitStr, setLimitStr] = useState<string>(existingLimit > 0 ? String(existingLimit) : '');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLimitStr(existingLimit > 0 ? String(existingLimit) : '');
    setSavedNotice(false);
    setErrorMsg(null);
  }, [selectedMonthKey, existingLimit]);

  const monthMetrics = useMemo(() => {
    let expense = 0;
    let income = 0;
    const byCategory = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.monthKey !== selectedMonthKey) return;
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
        byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount);
      }
    });

    const categories = Array.from(byCategory.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        shareOfExpense: expense > 0 ? (amount / expense) * 100 : 0,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.amount - a.amount);

    const [y, m] = selectedMonthKey.split('-').map(Number);
    const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 30;
    const now = new Date();
    const isCurrentMonth =
      now.getFullYear() === y && now.getMonth() + 1 === m;
    const remainingDays = isCurrentMonth
      ? Math.max(daysInMonth - now.getDate() + 1, 1)
      : daysInMonth;

    return { expense, income, categories, remainingDays };
  }, [transactions, selectedMonthKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedNotice(false);
    const parsed = parseFloat(limitStr || '0');
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100_000_000) {
      setErrorMsg('กรุณาระบุวงเงินงบประมาณระหว่าง 0 ถึง 100,000,000 บาท');
      return;
    }
    setSaving(true);
    try {
      await onSaveBudget(selectedMonthKey, parsed);
      setSavedNotice(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึกงบประมาณได้');
    } finally {
      setSaving(false);
    }
  };

  const activeLimit = existingLimit;
  const remaining = activeLimit - monthMetrics.expense;
  const usedPct = activeLimit > 0 ? (monthMetrics.expense / activeLimit) * 100 : 0;
  const dailySafe = remaining > 0 ? remaining / monthMetrics.remainingDays : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            ตั้งงบประมาณรายเดือน
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            กำหนดเพดานรายจ่ายสำหรับเดือน {formatThaiMonthKey(selectedMonthKey)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="budget-limit" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              วงเงินรายจ่ายเป้าหมาย (บาท)
            </label>
            <input
              id="budget-limit"
              type="number"
              min="0"
              max="100000000"
              step="100"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              placeholder="เช่น 15000"
              className="w-full px-4 py-3 text-xl font-semibold font-mono-num bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[5000, 10000, 15000, 20000, 30000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLimitStr(String(preset))}
                className="px-2.5 py-1 text-xs font-mono-num font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {formatCurrencyTHB(preset)} ฿
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกงบประมาณแล้ว</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            สถานะการใช้งบประมาณ · {formatThaiMonthKey(selectedMonthKey)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            คำนวณจากยอดรายจ่ายจริงในฐานข้อมูลเทียบกับเป้าหมายรายเดือน
          </p>
        </div>

        {activeLimit > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-xs text-slate-500 dark:text-slate-400">ใช้ไปแล้ว</div>
                <div className="text-lg font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrencyTHB(monthMetrics.expense, true)} ฿
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {remaining >= 0 ? 'งบคงเหลือ' : 'เกินงบประมาณ'}
                </div>
                <div
                  className={`text-lg font-bold font-mono-num mt-1 ${
                    remaining >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrencyTHB(Math.abs(remaining), true)} ฿
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  ใช้ได้เฉลี่ย/วัน ({monthMetrics.remainingDays} วัน)
                </div>
                <div className="text-lg font-bold font-mono-num text-slate-900 dark:text-white mt-1">
                  {formatCurrencyTHB(dailySafe, true)} ฿
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-num">
                <span className="text-slate-600 dark:text-slate-300">
                  ใช้ไป {usedPct.toFixed(1)}% ของงบประมาณ
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrencyTHB(monthMetrics.expense)} / {formatCurrencyTHB(activeLimit)} ฿
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usedPct > 100
                      ? 'bg-rose-600'
                      : usedPct > 85
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(usedPct, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
            ยังไม่ได้กำหนดงบประมาณสำหรับเดือนนี้ กรุณากรอกวงเงินเป้าหมายทางด้านซ้ายเพื่อเปิดการแจ้งเตือนสัดส่วนการใช้งบ
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            สัดส่วนรายจ่ายแยกตามหมวดหมู่ในเดือนนี้
          </h4>
          {monthMetrics.categories.length === 0 ? (
            <p className="text-xs text-slate-400">ยังไม่มีรายจ่ายในเดือนนี้</p>
          ) : (
            <div className="space-y-2.5">
              {monthMetrics.categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden="true"
                    />
                    <span className="text-slate-700 dark:text-slate-200 truncate">{cat.name}</span>
                  </div>
                  <div className="font-mono-num shrink-0">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatCurrencyTHB(cat.amount, true)} ฿
                    </span>
                    <span className="text-slate-400 ml-2 w-12 inline-block text-right">
                      {cat.shareOfExpense.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
