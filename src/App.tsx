/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetView } from './components/BudgetView';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LedgerView } from './components/LedgerView';
import { LoginScreen } from './components/LoginScreen';
import { OverviewView } from './components/OverviewView';
import { TransactionModal } from './components/TransactionModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FIREBASE_PROJECT_ID, PRIMARY_COLLECTION } from './lib/firebase';
import {
  createTransaction,
  deleteTransaction,
  subscribeToBudgets,
  subscribeToTransactions,
  updateTransaction,
  upsertMonthlyBudget,
} from './services/ledgerService';
import {
  formatThaiMonthKey,
  getCurrentMonthKey,
  getNextMonthKey,
  getPreviousMonthKey,
  type MonthlyBudget,
  type Transaction,
  type TransactionInput,
} from './types/finance';

type ActiveTab = 'overview' | 'analytics' | 'ledger' | 'budget';

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'ภาพรวมรายเดือน', icon: LayoutDashboard },
  { id: 'analytics', label: 'กราฟวิเคราะห์รายปี', icon: BarChart3 },
  { id: 'ledger', label: 'รายการทั้งหมด', icon: ListOrdered },
  { id: 'budget', label: 'ตั้งงบประมาณ', icon: PiggyBank },
];

function DashboardWorkspace() {
  const { user, authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, MonthlyBudget>>({});
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [avatarFailed, setAvatarFailed] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ledger_theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('ledger_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ledger_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.photoURL]);

  useEffect(() => {
    if (authLoading || !user) {
      setTransactions([]);
      setBudgets({});
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setDataError(null);

    const unsubTx = subscribeToTransactions(
      user.uid,
      (items) => {
        setTransactions(items);
        setDataLoading(false);
      },
      (err) => {
        setDataError(err.message);
        setDataLoading(false);
      }
    );

    const unsubBudgets = subscribeToBudgets(
      user.uid,
      (map) => {
        setBudgets(map);
      },
      (err) => {
        setDataError(err.message);
      }
    );

    return () => {
      unsubTx();
      unsubBudgets();
    };
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm">
        กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleSaveTransaction = async (input: TransactionInput, editingId?: string) => {
    if (editingId) {
      await updateTransaction(editingId, input);
    } else {
      await createTransaction(user.uid, input);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTx.id);
      setDeletingTx(null);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'ไม่สามารถลบรายการได้');
      setDeletingTx(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveBudget = async (monthKey: string, limitAmount: number) => {
    await upsertMonthlyBudget(user.uid, monthKey, limitAmount);
  };

  const handleJumpToMonth = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    setActiveTab('overview');
  };

  const activeNavTitle = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'ภาพรวมรายเดือน';
  const userInitial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-2 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
              สมุดบัญชีรายรับรายจ่าย
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="ปิดเมนู"
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1" aria-label="เมนูหลัก">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quiet Database Metadata */}
        <div className="px-3 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-1 font-mono-num">
          <div>Project: {FIREBASE_PROJECT_ID}</div>
          <div>Collection: {PRIMARY_COLLECTION}</div>
        </div>
      </div>

      {/* User Profile & Sign Out */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          {user.photoURL && !avatarFailed ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'รูปโปรไฟล์'}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
              {userInitial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {user.displayName || 'ผู้ใช้งาน Google'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:block w-[260px] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-[270px] max-w-[85vw] bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract (3 zones) */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Zone 1: Context Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="เปิดเมนูนำทาง"
                className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="font-display font-semibold text-slate-900 dark:text-white truncate">
                  {activeNavTitle}
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
                  /
                </span>
                <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {formatThaiMonthKey(selectedMonthKey)}
                </span>
              </div>
            </div>

            {/* Zone 2: Month Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMonthKey(getPreviousMonthKey(selectedMonthKey))}
                aria-label="เดือนก่อนหน้า"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonthKey}
                onChange={(e) => {
                  if (e.target.value) setSelectedMonthKey(e.target.value);
                }}
                aria-label="เลือกเดือนและปี"
                className="bg-transparent px-2 py-1 text-xs font-mono-num font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setSelectedMonthKey(getNextMonthKey(selectedMonthKey))}
                aria-label="เดือนถัดไป"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zone 3: Theme Toggle + Primary CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกรายการ</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {dataError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4"
              >
                <span className="break-words">{dataError}</span>
                <button
                  type="button"
                  onClick={() => setDataError(null)}
                  className="font-semibold shrink-0 hover:underline cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            )}

            {activeTab === 'overview' && (
              <OverviewView
                transactions={transactions}
                selectedMonthKey={selectedMonthKey}
                budgets={budgets}
                loading={dataLoading}
                onAddNew={handleOpenAddModal}
                onEdit={handleOpenEditModal}
                onDelete={(tx) => setDeletingTx(tx)}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                transactions={transactions}
                selectedMonthKey={selectedMonthKey}
                onJumpToMonth={handleJumpToMonth}
              />
            )}

            {activeTab === 'ledger' && (
              <LedgerView
                transactions={transactions}
                selectedMonthKey={selectedMonthKey}
                onAddNew={handleOpenAddModal}
                onEdit={handleOpenEditModal}
                onDelete={(tx) => setDeletingTx(tx)}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetView
                transactions={transactions}
                selectedMonthKey={selectedMonthKey}
                budgets={budgets}
                onSaveBudget={handleSaveBudget}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        editingTransaction={editingTx}
        defaultMonthKey={selectedMonthKey}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveTransaction}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        transaction={deletingTx}
        isDeleting={isDeleting}
        onCancel={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DashboardWorkspace />
      </AuthProvider>
    </ErrorBoundary>
  );
}
