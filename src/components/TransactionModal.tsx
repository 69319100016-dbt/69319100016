import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  getTodayDateString,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  type PaymentMethod,
  type Transaction,
  type TransactionInput,
  type TransactionType,
} from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  defaultMonthKey: string;
  onClose: () => void;
  onSubmit: (input: TransactionInput, editingId?: string) => Promise<void>;
}

export function TransactionModal({
  isOpen,
  editingTransaction,
  defaultMonthKey,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].name);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(String(editingTransaction.amount));
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNote(editingTransaction.note);
    } else {
      const today = getTodayDateString();
      const initialDate = today.startsWith(defaultMonthKey)
        ? today
        : `${defaultMonthKey}-01`;
      setType('expense');
      setAmountStr('');
      setTitle('');
      setCategory(EXPENSE_CATEGORIES[0].name);
      setDate(initialDate);
      setPaymentMethod('promptpay');
      setNote('');
    }
  }, [isOpen, editingTransaction, defaultMonthKey]);

  if (!isOpen) return null;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextList = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!nextList.some((c) => c.name === category)) {
      setCategory(nextList[0].name);
    }
  };

  const handleQuickAddAmount = (delta: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr(String(current + delta));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = parseFloat(amountStr);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเงินที่มากกว่า 0 บาท');
      return;
    }
    if (parsedAmount > 100_000_000) {
      setErrorMsg('จำนวนเงินต้องไม่เกิน 100,000,000 บาท');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('กรุณากรอกชื่อรายการ');
      return;
    }
    if (!date) {
      setErrorMsg('กรุณาเลือกวันที่ทำรายการ');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          type,
          amount: parsedAmount,
          category,
          title: title.trim(),
          note: note.trim(),
          date,
          paymentMethod,
        },
        editingTransaction?.id
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="tx-modal-title" className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {editingTransaction ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}

          {/* Segmented Type Selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายรับ (Income)
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label htmlFor="tx-amount" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              จำนวนเงิน (บาท)
            </label>
            <div className="relative">
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                max="100000000"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-14 text-2xl font-semibold font-mono-num bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                THB
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[50, 100, 500, 1000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAddAmount(preset)}
                  className="px-2.5 py-1 text-xs font-mono-num font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  +{preset.toLocaleString('th-TH')}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="tx-title" className="font-medium">
                ชื่อรายการ
              </label>
              <span className="font-mono-num">{title.length}/120</span>
            </div>
            <input
              id="tx-title"
              type="text"
              maxLength={120}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'expense'
                  ? 'เช่น ค่าอาหารกลางวัน, ค่าเดินทาง BTS'
                  : 'เช่น เงินเดือนประจำเดือน, รายได้งานฟรีแลนซ์'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              หมวดหมู่
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const active = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`px-3 py-2 text-xs font-medium text-left rounded-lg border transition-colors truncate cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tx-date" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                วันที่ทำรายการ
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tx-payment" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                ช่องทางชำระเงิน
              </label>
              <select
                id="tx-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="tx-note" className="font-medium">
                หมายเหตุเพิ่มเติม (ไม่บังคับ)
              </label>
              <span className="font-mono-num">{note.length}/500</span>
            </div>
            <textarea
              id="tx-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม เช่น ชื่อร้านค้า หรือเลขที่ใบเสร็จ"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              {isSubmitting
                ? 'กำลังบันทึก...'
                : editingTransaction
                  ? 'บันทึกการแก้ไข'
                  : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
