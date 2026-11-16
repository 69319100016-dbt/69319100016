import { BarChart3, CalendarRange, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FIREBASE_PROJECT_ID, PRIMARY_COLLECTION } from '../lib/firebase';

export function LoginScreen() {
  const { signInWithGoogle, isSigningIn, authError, clearAuthError } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-display text-lg font-semibold tracking-tight">
            สมุดบัญชีรายรับรายจ่าย
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-num">
          <span>Project {FIREBASE_PROJECT_ID}</span>
          <span aria-hidden="true">·</span>
          <span>{PRIMARY_COLLECTION}</span>
        </div>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isSigningIn}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isSigningIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>ระบบบริหารการเงินส่วนบุคคล</span>
              <span aria-hidden="true">·</span>
              <span>Cloud Firestore Sync</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
              จัดการรายรับรายจ่ายและวิเคราะห์กระแสเงินสดรายเดือนอย่างเป็นระบบ
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              บันทึกรายการรับ-จ่ายประจำวัน สรุปยอดคงเหลือรายเดือน พร้อมกราฟวิเคราะห์แนวโน้มและสัดส่วนตามหมวดหมู่ ข้อมูลทั้งหมดถูกจัดเก็บอย่างปลอดภัยแยกตามบัญชี Gmail ของคุณ
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>สรุปผลรายเดือน</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  เปรียบเทียบรายรับ รายจ่าย และอัตราการออมกับเดือนก่อนหน้าแบบเรียลไทม์
                </p>
              </div>

              <div className="space-y-1.5 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>กราฟวิเคราะห์ข้อมูล</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  ดูแนวโน้มรายวัน กราฟแท่ง 12 เดือน และสัดส่วนค่าใช้จ่ายแต่ละหมวดหมู่
                </p>
              </div>

              <div className="space-y-1.5 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>ยืนยันตัวตนด้วย Gmail</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  เข้าถึงข้อมูลเฉพาะเจ้าของบัญชีบนฐานข้อมูล {PRIMARY_COLLECTION}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ใช้บัญชี Google (Gmail) เพื่อซิงค์ข้อมูลรายรับรายจ่ายข้ามอุปกรณ์
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start justify-between gap-3"
                >
                  <span>{authError}</span>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="text-rose-500 hover:text-rose-700 font-medium shrink-0 cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isSigningIn}
                className="w-full min-h-[48px] flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-sm font-semibold text-slate-800 dark:text-white transition-colors disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>
                  {isSigningIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google (Gmail)'}
                </span>
              </button>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Firebase Project ID</span>
                  <span className="font-mono-num text-slate-700 dark:text-slate-300">
                    {FIREBASE_PROJECT_ID}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Collection ฐานข้อมูลหลัก</span>
                  <span className="font-mono-num text-slate-700 dark:text-slate-300">
                    {PRIMARY_COLLECTION}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <span>สมุดบัญชีรายรับรายจ่าย · ข้อมูลส่วนบุคคลถูกแยกสิทธิ์การเข้าถึงตามบัญชีผู้ใช้งาน</span>
        <span>เชื่อมต่อฐานข้อมูล Cloud Firestore</span>
      </footer>
    </div>
  );
}
