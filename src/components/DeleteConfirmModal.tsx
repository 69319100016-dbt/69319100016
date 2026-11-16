import { AlertCircle } from 'lucide-react';
import { formatCurrencyTHB, formatThaiDate, type Transaction } from '../types/finance';

interface DeleteConfirmModalProps {
  transaction: Transaction | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  transaction,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 id="delete-modal-title" className="font-display text-base font-semibold text-slate-900 dark:text-white">
              ยืนยันการลบรายการ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              คุณต้องการลบรายการนี้ถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-1 text-sm">
          <div className="font-semibold text-slate-900 dark:text-white">{transaction.title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono-num">
            <span>{formatThaiDate(transaction.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{transaction.category}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                transaction.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-rose-600 dark:text-rose-400 font-semibold'
              }
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrencyTHB(transaction.amount, true)} ฿
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
          >
            {isDeleting ? 'กำลังลบ...' : 'ลบรายการ'}
          </button>
        </div>
      </div>
    </div>
  );
}
