import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatCurrencyTHB,
  formatThaiMonthShort,
  getCategoryColor,
  getPaymentMethodLabel,
  THAI_MONTHS_SHORT,
  type Transaction,
  type TransactionType,
} from '../types/finance';

interface DailyPoint {
  day: string;
  label: string;
  income: number;
  expense: number;
}

export function DailyCashflowChart({
  transactions,
  monthKey,
}: {
  transactions: Transaction[];
  monthKey: string;
}) {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const daysInMonth = year && month ? new Date(year, month, 0).getDate() : 30;

  const dailyMap = new Map<number, { income: number; expense: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, { income: 0, expense: 0 });
  }

  transactions.forEach((tx) => {
    if (tx.monthKey !== monthKey) return;
    const day = Number(tx.date.slice(8, 10));
    const entry = dailyMap.get(day);
    if (!entry) return;
    if (tx.type === 'income') entry.income += tx.amount;
    else entry.expense += tx.amount;
  });

  const data: DailyPoint[] = Array.from(dailyMap.entries()).map(([day, vals]) => ({
    day: String(day).padStart(2, '0'),
    label: `วันที่ ${day}`,
    income: vals.income,
    expense: vals.expense,
  }));

  return (
    <div className="w-full h-[290px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.35} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0].payload as DailyPoint;
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs shadow-sm space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {row.label} {formatThaiMonthShort(monthKey)}
                  </div>
                  <div className="flex items-center justify-between gap-6 text-emerald-600 dark:text-emerald-400 font-mono-num">
                    <span>รายรับ</span>
                    <span>+{formatCurrencyTHB(row.income, true)} ฿</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 text-rose-600 dark:text-rose-400 font-mono-num">
                    <span>รายจ่าย</span>
                    <span>-{formatCurrencyTHB(row.expense, true)} ฿</span>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SixMonthTrendChart({
  transactions,
  endMonthKey,
}: {
  transactions: Transaction[];
  endMonthKey: string;
}) {
  const [endY, endM] = endMonthKey.split('-').map(Number);
  const months: string[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(endY, endM - 1 - offset, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const data = months.map((mk) => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.monthKey === mk) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });
    return {
      monthKey: mk,
      label: formatThaiMonthShort(mk),
      income,
      expense,
      net: income - expense,
    };
  });

  return (
    <div className="w-full h-[290px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.35} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0].payload as {
                label: string;
                income: number;
                expense: number;
                net: number;
              };
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs shadow-sm space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">{row.label}</div>
                  <div className="flex items-center justify-between gap-6 text-emerald-600 dark:text-emerald-400 font-mono-num">
                    <span>รายรับ</span>
                    <span>+{formatCurrencyTHB(row.income, true)} ฿</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 text-rose-600 dark:text-rose-400 font-mono-num">
                    <span>รายจ่าย</span>
                    <span>-{formatCurrencyTHB(row.expense, true)} ฿</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-6 font-semibold text-slate-900 dark:text-white font-mono-num">
                    <span>สุทธิ</span>
                    <span>{row.net >= 0 ? '+' : ''}{formatCurrencyTHB(row.net, true)} ฿</span>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Line
            type="monotone"
            dataKey="net"
            name="สุทธิ"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonutChart({
  transactions,
  type,
}: {
  transactions: Transaction[];
  type: TransactionType;
}) {
  const filtered = transactions.filter((t) => t.type === type);
  const totals = new Map<string, number>();
  let grandTotal = 0;

  filtered.forEach((t) => {
    grandTotal += t.amount;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  });

  const items = Array.from(totals.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
      color: getCategoryColor(name),
    }))
    .sort((a, b) => b.value - a.value);

  if (items.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
        ยังไม่มีข้อมูล{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}ในเดือนนี้
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {items.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0].payload as { name: string; value: number; percent: number };
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-sm">
                    <div className="font-semibold text-slate-900 dark:text-white">{row.name}</div>
                    <div className="font-mono-num text-slate-600 dark:text-slate-300 mt-0.5">
                      {formatCurrencyTHB(row.value, true)} ฿ ({row.percent.toFixed(1)}%)
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {type === 'expense' ? 'รายจ่ายรวม' : 'รายรับรวม'}
          </span>
          <span className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
            {formatCurrencyTHB(grandTotal)} ฿
          </span>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono-num">
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrencyTHB(item.value)} ฿
                </span>
                <span className="text-slate-400 w-11 text-right">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(item.percent, 2)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface AnnualMonthRow {
  monthIndex: number;
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  count: number;
  topExpenseCategory: string;
}

export function AnnualComposedChart({
  rows,
  onSelectMonth,
}: {
  rows: AnnualMonthRow[];
  onSelectMonth?: (monthKey: string) => void;
}) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
          barGap={4}
          onClick={(state) => {
            if (onSelectMonth && state && typeof state.activeLabel === 'string') {
              const idx = THAI_MONTHS_SHORT.indexOf(state.activeLabel);
              if (idx >= 0 && rows[idx]) {
                onSelectMonth(rows[idx].monthKey);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.35} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0].payload as AnnualMonthRow;
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs shadow-sm space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {formatThaiMonthShort(row.monthKey)} ({row.count} รายการ)
                  </div>
                  <div className="flex items-center justify-between gap-6 text-emerald-600 dark:text-emerald-400 font-mono-num">
                    <span>รายรับ</span>
                    <span>+{formatCurrencyTHB(row.income, true)} ฿</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 text-rose-600 dark:text-rose-400 font-mono-num">
                    <span>รายจ่าย</span>
                    <span>-{formatCurrencyTHB(row.expense, true)} ฿</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-6 font-semibold text-slate-900 dark:text-white font-mono-num">
                    <span>ยอดสุทธิ</span>
                    <span>{row.net >= 0 ? '+' : ''}{formatCurrencyTHB(row.net, true)} ฿</span>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line
            type="monotone"
            dataKey="net"
            name="ยอดสุทธิ"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#2563eb' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentBreakdownChart({ transactions }: { transactions: Transaction[] }) {
  const expenseOnly = transactions.filter((t) => t.type === 'expense');
  const map = new Map<string, number>();
  let total = 0;

  expenseOnly.forEach((tx) => {
    total += tx.amount;
    map.set(tx.paymentMethod, (map.get(tx.paymentMethod) ?? 0) + tx.amount);
  });

  const rows = Array.from(map.entries())
    .map(([method, amount]) => ({
      name: getPaymentMethodLabel(method as Transaction['paymentMethod']),
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
        ยังไม่มีข้อมูลช่องทางชำระเงินในปีนี้
      </div>
    );
  }

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" strokeOpacity={0.35} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 11, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0].payload as { name: string; amount: number; percent: number };
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-sm">
                  <div className="font-semibold text-slate-900 dark:text-white">{row.name}</div>
                  <div className="font-mono-num text-slate-600 dark:text-slate-300 mt-0.5">
                    {formatCurrencyTHB(row.amount, true)} ฿ ({row.percent.toFixed(1)}%)
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
