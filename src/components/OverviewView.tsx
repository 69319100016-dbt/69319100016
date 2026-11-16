import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  formatCurrencyTHB,
  formatThaiDate,
  formatThaiMonthKey,
  getPaymentMethodLabel,
  getPreviousMonthKey,
  type MonthlyBudget,
  type Transaction,
  type TransactionType,
} from '../types/finance';
import {
  CategoryDonutChart,
  DailyCashflowChart,
  SixMonthTrendChart,
} from './MonthlyCharts';

interface OverviewViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
  budgets: Record<string, MonthlyBudget>;
  loading: boolean;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onNavigateTab: (tab: 'overview' | 'analytics' | 'ledger' | 'budget') => void;
}

export function OverviewView({
  transactions,
  selectedMonthKey,
  budgets,
  loading,
  onAddNew,
  onEdit,
  onDelete,
  onNavigateTab,
}: OverviewViewProps) {
  const [chartView, setChartView] = useState<'daily' | 'six_months'>('daily');
  const [donutType, setDonutType] = useState<TransactionType>('expense');

  const prevMonthKey = getPreviousMonthKey(selectedMonthKey);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let prevIncome = 0;
    let prevExpense = 0;
    const monthTxs: Transaction[] = [];

    transactions.forEach((tx) => {
      if (tx.monthKey === selectedMonthKey) {
        monthTxs.push(tx);
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      } else if (tx.monthKey === prevMonthKey) {
        if (tx.type === 'income') prevIncome += tx.amount;
        else prevExpense += tx.amount;
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const calcDelta = (curr: number, prev: number): number | null => {
      if (prev <= 0) return null;
      return ((curr - prev) / prev) * 100;
    };

    return {
      income,
      expense,
      net,
      savingsRate,
      incomeDelta: calcDelta(income, prevIncome),
      expenseDelta: calcDelta(expense, prevExpense),
      monthTxs,
    };
  }, [transactions, selectedMonthKey, prevMonthKey]);

  const currentBudget = budgets[selectedMonthKey]?.limitAmount ?? 0;
  const budgetUsedPct =
    currentBudget > 0 ? Math.min((stats.expense / currentBudget) * 100, 999) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-[380px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="lg:col-span-5 h-[380px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-column KPI Strip */}
      <section aria-label="สรุปยอดประจำเดือน" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Monthly Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>รายรับเดือนนี้</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
            +{formatCurrencyTHB(stats.income, true)} <span className="text-sm font-normal">฿</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            {stats.incomeDelta !== null ? (
              <span>
                {stats.incomeDelta >= 0 ? '+' : ''}
                {stats.incomeDelta.toFixed(1)}% เทียบเดือนก่อน
              </span>
            ) : (
              <span>{stats.monthTxs.filter((t) => t.type === 'income').length} รายการรับ</span>
            )}
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>รายจ่ายเดือนนี้</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-rose-600 dark:text-rose-400">
            -{formatCurrencyTHB(stats.expense, true)} <span className="text-sm font-normal">฿</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            {stats.expenseDelta !== null ? (
              <span>
                {stats.expenseDelta >= 0 ? '+' : ''}
                {stats.expenseDelta.toFixed(1)}% เทียบเดือนก่อน
              </span>
            ) : (
              <span>{stats.monthTxs.filter((t) => t.type === 'expense').length} รายการจ่าย</span>
            )}
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>ยอดคงเหลือสุทธิ</span>
            {stats.net >= 0 ? (
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div
            className={`text-2xl font-bold font-mono-num ${
              stats.net >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {stats.net >= 0 ? '+' : ''}
            {formatCurrencyTHB(stats.net, true)} <span className="text-sm font-normal">฿</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stats.net >= 0 ? 'สถานะการเงินเกินดุล' : 'รายจ่ายมากกว่ารายรับ'}
          </div>
        </div>

        {/* Savings & Budget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{currentBudget > 0 ? 'การใช้งบประมาณ' : 'อัตราการออมสุทธิ'}</span>
            <button
              type="button"
              onClick={() => onNavigateTab('budget')}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {currentBudget > 0 ? 'ปรับงบ' : 'ตั้งงบ'}
            </button>
          </div>
          {currentBudget > 0 ? (
            <>
              <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white">
                {budgetUsedPct.toFixed(1)}%
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      budgetUsedPct > 100
                        ? 'bg-rose-600'
                        : budgetUsedPct > 85
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                  จากงบ {formatCurrencyTHB(currentBudget)} ฿
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white">
                {stats.income > 0 ? `${stats.savingsRate.toFixed(1)}%` : '0.0%'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {stats.income > 0
                  ? stats.savingsRate >= 20
                    ? 'ออมได้มากกว่า 20% ของรายรับ'
                    : 'สัดส่วนเงินคงเหลือต่อรายรับ'
                  : 'ยังไม่มีข้อมูลรายรับเดือนนี้'}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily / 6-month Trend Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {chartView === 'daily'
                  ? `กระแสเงินสดรายวัน · ${formatThaiMonthKey(selectedMonthKey)}`
                  : 'แนวโน้มรายรับ-รายจ่าย 6 เดือนย้อนหลัง'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                เปรียบเทียบยอดเงินเข้าและเงินออกในแต่ละช่วงเวลา
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setChartView('daily')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  chartView === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                รายวันในเดือน
              </button>
              <button
                type="button"
                onClick={() => setChartView('six_months')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  chartView === 'six_months'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ย้อนหลัง 6 เดือน
              </button>
            </div>
          </div>

          {chartView === 'daily' ? (
            <DailyCashflowChart transactions={transactions} monthKey={selectedMonthKey} />
          ) : (
            <SixMonthTrendChart transactions={transactions} endMonthKey={selectedMonthKey} />
          )}

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />
              <span>รายรับ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" aria-hidden="true" />
              <span>รายจ่าย</span>
            </div>
            {chartView === 'six_months' && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-blue-600" aria-hidden="true" />
                <span>ยอดสุทธิ</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                สัดส่วนตามหมวดหมู่
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                จำแนกรายการในเดือนที่เลือก
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setDonutType('expense')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  donutType === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                รายจ่าย
              </button>
              <button
                type="button"
                onClick={() => setDonutType('income')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  donutType === 'income'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                รายรับ
              </button>
            </div>
          </div>

          <CategoryDonutChart transactions={stats.monthTxs} type={donutType} />
        </div>
      </section>

      {/* Recent Transactions Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              รายการล่าสุดในเดือนนี้
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-num">
              {stats.monthTxs.length} รายการ · {formatThaiMonthKey(selectedMonthKey)}
            </p>
          </div>
          {stats.monthTxs.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              ดูทั้งหมด
            </button>
          )}
        </div>

        {stats.monthTxs.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ยังไม่มีรายการรายรับหรือรายจ่ายในเดือน {formatThaiMonthKey(selectedMonthKey)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              เริ่มต้นบันทึกรายการแรกของคุณเพื่อดูสรุปยอดคงเหลือและกราฟวิเคราะห์ข้อมูลแบบเรียลไทม์
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกรายการแรก</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                  <th className="py-2.5 px-6">วันที่</th>
                  <th className="py-2.5 px-4">รายการและหมวดหมู่</th>
                  <th className="py-2.5 px-4">ช่องทาง</th>
                  <th className="py-2.5 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-2.5 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {stats.monthTxs.slice(0, 8).map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono-num whitespace-nowrap">
                      {formatThaiDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {tx.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{tx.category}</span>
                        {tx.note && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[240px]">{tx.note}</span>
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
      </section>
    </div>
  );
}
