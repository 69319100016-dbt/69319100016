import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  OperationType,
  PRIMARY_COLLECTION,
} from '../lib/firebase';
import type {
  MonthlyBudget,
  PaymentMethod,
  Transaction,
  TransactionInput,
  TransactionType,
} from '../types/finance';

const BUDGETS_COLLECTION = 'monthlyBudgets';

const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const MONTH_KEY_REGEX = /^[0-9]{4}-[0-9]{2}$/;
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'bank_transfer',
  'promptpay',
  'credit_card',
  'e_wallet',
];
const VALID_TYPES: TransactionType[] = ['income', 'expense'];

function sanitizeString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function validateAndSanitizeTransactionInput(input: TransactionInput): {
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  note: string;
  date: string;
  monthKey: string;
  paymentMethod: PaymentMethod;
} {
  if (!VALID_TYPES.includes(input.type)) {
    throw new Error('ประเภทรายการไม่ถูกต้อง');
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
    throw new Error('จำนวนเงินต้องมากกว่า 0 และไม่เกิน 100,000,000 บาท');
  }

  const title = sanitizeString(input.title, 120);
  if (title.length < 1) {
    throw new Error('กรุณาระบุชื่อรายการ');
  }

  const category = sanitizeString(input.category, 60);
  if (category.length < 1) {
    throw new Error('กรุณาเลือกหมวดหมู่');
  }

  const note = sanitizeString(input.note ?? '', 500);

  const date = input.date.trim();
  if (!DATE_REGEX.test(date)) {
    throw new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)');
  }

  const monthKey = date.slice(0, 7);
  if (!MONTH_KEY_REGEX.test(monthKey)) {
    throw new Error('รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)');
  }

  const paymentMethod = VALID_PAYMENT_METHODS.includes(input.paymentMethod)
    ? input.paymentMethod
    : 'promptpay';

  return {
    type: input.type,
    amount: Math.round(amount * 100) / 100,
    category,
    title,
    note,
    date,
    monthKey,
    paymentMethod,
  };
}

function toDate(ts: unknown): Date | null {
  if (ts instanceof Timestamp) {
    return ts.toDate();
  }
  return null;
}

export async function syncUserProfile(user: User): Promise<void> {
  if (!user.uid || !VALID_ID_REGEX.test(user.uid)) return;
  const profilePath = `users/${user.uid}/private/profile`;
  const profileRef = doc(db, 'users', user.uid, 'private', 'profile');

  try {
    const snap = await getDoc(profileRef);
    const email = sanitizeString(user.email || `${user.uid}@unknown.local`, 254);
    const displayName = sanitizeString(
      user.displayName || email.split('@')[0] || 'ผู้ใช้งาน',
      100
    );
    const photoURL = sanitizeString(user.photoURL || '', 500);

    if (!snap.exists()) {
      await setDoc(profileRef, {
        uid: user.uid,
        email,
        displayName,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(profileRef, {
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

export function subscribeToTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, PRIMARY_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(d.userId ?? ''),
          type: d.type === 'income' ? 'income' : 'expense',
          amount: typeof d.amount === 'number' ? d.amount : 0,
          category: String(d.category ?? ''),
          title: String(d.title ?? ''),
          note: String(d.note ?? ''),
          date: String(d.date ?? ''),
          monthKey: String(d.monthKey ?? ''),
          paymentMethod: VALID_PAYMENT_METHODS.includes(d.paymentMethod)
            ? d.paymentMethod
            : 'cash',
          createdAt: toDate(d.createdAt),
          updatedAt: toDate(d.updatedAt),
        };
      });

      items.sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });

      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PRIMARY_COLLECTION);
      } catch (wrappedError) {
        onError(
          wrappedError instanceof Error
            ? wrappedError
            : new Error(String(wrappedError))
        );
      }
    }
  );
}

export async function createTransaction(
  userId: string,
  input: TransactionInput
): Promise<string> {
  if (!userId || !VALID_ID_REGEX.test(userId)) {
    throw new Error('ไม่พบรหัสผู้ใช้งานที่ถูกต้อง');
  }
  const clean = validateAndSanitizeTransactionInput(input);
  const newDocRef = doc(collection(db, PRIMARY_COLLECTION));
  const path = `${PRIMARY_COLLECTION}/${newDocRef.id}`;

  try {
    await setDoc(newDocRef, {
      userId,
      type: clean.type,
      amount: clean.amount,
      category: clean.category,
      title: clean.title,
      note: clean.note,
      date: clean.date,
      monthKey: clean.monthKey,
      paymentMethod: clean.paymentMethod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTransaction(
  transactionId: string,
  input: TransactionInput
): Promise<void> {
  if (!transactionId || !VALID_ID_REGEX.test(transactionId)) {
    throw new Error('รหัสรายการไม่ถูกต้อง');
  }
  const clean = validateAndSanitizeTransactionInput(input);
  const path = `${PRIMARY_COLLECTION}/${transactionId}`;

  try {
    await updateDoc(doc(db, PRIMARY_COLLECTION, transactionId), {
      type: clean.type,
      amount: clean.amount,
      category: clean.category,
      title: clean.title,
      note: clean.note,
      date: clean.date,
      monthKey: clean.monthKey,
      paymentMethod: clean.paymentMethod,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  if (!transactionId || !VALID_ID_REGEX.test(transactionId)) {
    throw new Error('รหัสรายการไม่ถูกต้อง');
  }
  const path = `${PRIMARY_COLLECTION}/${transactionId}`;
  try {
    await deleteDoc(doc(db, PRIMARY_COLLECTION, transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToBudgets(
  userId: string,
  onData: (budgets: Record<string, MonthlyBudget>) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, BUDGETS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const map: Record<string, MonthlyBudget> = {};
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const monthKey = String(d.monthKey ?? '');
        if (MONTH_KEY_REGEX.test(monthKey)) {
          map[monthKey] = {
            id: docSnap.id,
            userId: String(d.userId ?? ''),
            monthKey,
            limitAmount: typeof d.limitAmount === 'number' ? d.limitAmount : 0,
            createdAt: toDate(d.createdAt),
            updatedAt: toDate(d.updatedAt),
          };
        }
      });
      onData(map);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, BUDGETS_COLLECTION);
      } catch (wrappedError) {
        onError(
          wrappedError instanceof Error
            ? wrappedError
            : new Error(String(wrappedError))
        );
      }
    }
  );
}

export async function upsertMonthlyBudget(
  userId: string,
  monthKey: string,
  limitAmount: number
): Promise<void> {
  if (!userId || !VALID_ID_REGEX.test(userId)) {
    throw new Error('ไม่พบรหัสผู้ใช้งานที่ถูกต้อง');
  }
  if (!MONTH_KEY_REGEX.test(monthKey)) {
    throw new Error('รูปแบบเดือนไม่ถูกต้อง');
  }
  const cleanLimit = Number(limitAmount);
  if (!Number.isFinite(cleanLimit) || cleanLimit < 0 || cleanLimit > 100_000_000) {
    throw new Error('งบประมาณต้องอยู่ระหว่าง 0 ถึง 100,000,000 บาท');
  }

  const budgetId = `${userId}_${monthKey}`;
  const path = `${BUDGETS_COLLECTION}/${budgetId}`;
  const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);

  try {
    const existingSnap = await getDoc(budgetRef);
    const roundedLimit = Math.round(cleanLimit * 100) / 100;

    if (!existingSnap.exists()) {
      await setDoc(budgetRef, {
        userId,
        monthKey,
        limitAmount: roundedLimit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(budgetRef, {
        limitAmount: roundedLimit,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
