import { useMemo, useState } from 'react';
import {
  formatCurrencyTHB,
  getCategoryColor,
  THAI_MONTHS_FULL,
  THAI_MONTHS_SHORT,
  type Transaction,
} from '../types/finance';
import {
  AnnualComposedChart,
  PaymentBreakdownChart,
  type AnnualMonthRow,
} from './MonthlyCharts';

interface AnalyticsViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
  onJumpToMonth: (monthKey: string) => void;
}

export function AnalyticsView({
  transactions,
  selectedMonthKey,
  onJumpToMonth,
}: AnalyticsViewProps) {
  const initialYear = Number(selectedMonthKey.slice(0, 4)) || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  const availableYears = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear(), initialYear]);
    transactions.forEach((tx) => {
      const y = Number(tx.monthKey.slice(0, 4));
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, initialYear]);

  const yearTransactions = useMemo(
    () => transactions.filter((t) => t.monthKey.startsWith(`${selectedYear}-`)),
    [transactions, selectedYear]
  );

  const annualData = useMemo(() => {
    const rows: AnnualMonthRow[] = [];
    let yearIncome = 0;
    let yearExpense = 0;

    for (let m = 1; m <= 12; m++) {
      const mk = `${selectedYear}-${String(m).padStart(2, '0')}`;
      let income = 0;
      let expense = 0;
      let count = 0;
      const catTotals = new Map<string, number>();

      yearTransactions.forEach((tx) => {
        if (tx.monthKey !== mk) return;
        count++;
        if (tx.type === 'income') {
          income += tx.amount;
        } else {
          expense += tx.amount;
          catTotals.set(tx.category, (catTotals.get(tx.category) ?? 0) + tx.amount);
        }
      });

      yearIncome += income;
      yearExpense += expense;
      const net = income - expense;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;

      let topCat = '-';
      let topVal = 0;
      catTotals.forEach((val, cat) => {
        if (val > topVal) {
          topVal = val;
          topCat = cat;
        }
      });

      rows.push({
        monthIndex: m,
        monthKey: mk,
        label: THAI_MONTHS_SHORT[m - 1],
        income,
        expense,
        net,
        savingsRate,
        count,
        topExpenseCategory: topCat,
      });
    }

    return {
      rows,
      yearIncome,
      yearExpense,
      yearNet: yearIncome - yearExpense,
    };
  }, [yearTransactions, selectedYear]);

  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    yearTransactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      total += tx.amount;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [yearTransactions]);

  return (
    <div className="space-y-6">
      {/* Year Selector & Annual Summary Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              วิเคราะห์รายรับ-รายจ่ายประจำปี พ.ศ. {selectedYear + 543} ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เปรียบเทียบข้อมูลทั้ง 12 เดือน คลิกที่แท่งกราฟหรือชื่อเดือนในตารางเพื่อดูรายละเอียดเดือนนั้น
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              เลือกปี:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 text-sm font-mono-num font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  พ.ศ. {y + 543} ({y})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">รายรับรวมทั้งปี</div>
            <div className="text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrencyTHB(annualData.yearIncome, true)} ฿
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">รายจ่ายรวมทั้งปี</div>
            <div className="text-xl font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrencyTHB(annualData.yearExpense, true)} ฿
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">กระแสเงินสดสุทธิทั้งปี</div>
            <div
              className={`text-xl font-bold font-mono-num mt-1 ${
                annualData.yearNet >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {annualData.yearNet >= 0 ? '+' : ''}
              {formatCurrencyTHB(annualData.yearNet, true)} ฿
            </div>
          </div>
        </div>

        <AnnualComposedChart
          rows={annualData.rows}
          onSelectMonth={(mk) => onJumpToMonth(mk)}
        />

        <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />
            <span>รายรับ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" aria-hidden="true" />
            <span>รายจ่าย</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-blue-600" aria-hidden="true" />
            <span>ยอดคงเหลือสุทธิ</span>
          </div>
        </div>
      </div>

      {/* Category & Payment Method Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              อันดับหมวดหมู่รายจ่ายสูงสุดตลอดปี
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เรียงลำดับตามมูลค่าการใช้จ่ายรวมในปี {selectedYear + 543}
            </p>
          </div>
          {topCategories.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
              ยังไม่มีข้อมูลรายจ่ายในปี {selectedYear + 543}
            </div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {topCategories.map((cat, idx) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono-num text-slate-400 w-4">{idx + 1}.</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="font-mono-num shrink-0">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrencyTHB(cat.amount, true)} ฿
                      </span>
                      <span className="text-slate-400 ml-2">({cat.percent.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(cat.percent, 2)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              ช่องทางการชำระเงินที่ใช้จ่าย
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              สัดส่วนรายจ่ายแยกตามวิธีชำระเงินในปี {selectedYear + 543}
            </p>
          </div>
          <PaymentBreakdownChart transactions={yearTransactions} />
        </div>
      </div>

      {/* 12-Month Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            ตารางสรุปผลรายเดือน ประจำปี {selectedYear + 543}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-2.5 px-6">เดือน</th>
                <th className="py-2.5 px-4 text-right">รายรับ</th>
                <th className="py-2.5 px-4 text-right">รายจ่าย</th>
                <th className="py-2.5 px-4 text-right">คงเหลือสุทธิ</th>
                <th className="py-2.5 px-4 text-right">อัตราการออม</th>
                <th className="py-2.5 px-4">หมวดหมู่ที่จ่ายสูงสุด</th>
                <th className="py-2.5 px-6 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {annualData.rows.map((row) => {
                const isSelected = row.monthKey === selectedMonthKey;
                return (
                  <tr
                    key={row.monthKey}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-6 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onJumpToMonth(row.monthKey)}
                        className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      >
                        {THAI_MONTHS_FULL[row.monthIndex - 1]}
                      </button>
                      <span className="ml-2 text-xs text-slate-400 font-mono-num">
                        ({row.count})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrencyTHB(row.income, true)} ฿
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatCurrencyTHB(row.expense, true)} ฿
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono-num font-semibold whitespace-nowrap ${
                        row.net >= 0
                          ? 'text-slate-900 dark:text-white'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {row.net >= 0 ? '+' : ''}
                      {formatCurrencyTHB(row.net, true)} ฿
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {row.income > 0 ? `${row.savingsRate.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {row.topExpenseCategory}
                    </td>
                    <td className="py-3 px-6 text-right text-xs whitespace-nowrap">
                      {row.count === 0 ? (
                        <span className="text-slate-400">ไม่มีรายการ</span>
                      ) : row.net >= 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          เกินดุล
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          เกินรายรับ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
