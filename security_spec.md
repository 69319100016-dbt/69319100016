# Security Specification — 69319100016DB Financial Ledger

## 1. Data Invariants
1. **Identity Isolation**: A `Transaction` in `/69319100016DB/{transactionId}` or a `MonthlyBudget` in `/monthlyBudgets/{budgetId}` can ONLY be read, listed, created, updated, or deleted by the authenticated, email-verified user whose `request.auth.uid` equals `userId`.
2. **PII Protection**: User profile documents containing `email` reside strictly at `/users/{userId}/private/profile` and are never readable or listable by any other user.
3. **Immutable Ownership & Temporal Integrity**: `userId` and `createdAt` are immutable once created. `createdAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on creation and every update.
4. **Strict Financial Bounds**: `amount` must be a positive number (`> 0` and `<= 100000000`), `type` must be `'income'` or `'expense'`, `date` must match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, `monthKey` must match `^[0-9]{4}-[0-9]{2}$` and match the `YYYY-MM` prefix of `date`.
5. **No Ghost Fields**: Every write must match `hasAll` + `hasOnly` on create and `affectedKeys().hasOnly(...)` on update.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Create**: Creating a transaction in `69319100016DB` with `request.auth == null`.
2. **Unverified Email Write**: Creating a transaction when `request.auth.token.email_verified == false`.
3. **Identity Spoofing**: Creating a transaction with `userId: "victim_uid"` while authenticated as `"attacker_uid"`.
4. **Ghost Field Injection (Shadow Update)**: Creating or updating a transaction with an unexpected field such as `{ ..., isAdmin: true }`.
5. **Negative / Zero Amount Injection**: Creating a transaction with `amount: -5000` or `amount: 0`.
6. **Denial-of-Wallet String Poisoning**: Creating a transaction with `title` length > 120 chars or `note` length > 500 chars or invalid doc ID > 128 chars.
7. **Invalid Date / MonthKey Mismatch**: Creating a transaction with `date: "2026-11-15"` and `monthKey: "2026-10"`.
8. **Client Timestamp Forgery**: Creating a transaction with a backdated client timestamp instead of `request.time`.
9. **Owner Reassignment on Update**: Updating an existing transaction to change `userId` to another user.
10. **Immutable CreatedAt Mutation**: Updating an existing transaction while altering `createdAt`.
11. **Cross-User Query Scraping (List)**: Listing `/69319100016DB` without constraining `where("userId", "==", request.auth.uid)` or querying another user's `userId`.
12. **PII Blanket Read**: Reading `/users/{victimId}/private/profile` while authenticated as `{attackerId}`.
