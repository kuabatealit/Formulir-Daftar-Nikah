# Security Specification & Payload-First Security TDD (`form-daftar-nikah`)

## 1. Data Invariants
1. **Strict Ownership Isolation (PII Protection):** Both `/users/{userId}` and `/berkas_nikah/{berkasId}` contain sensitive Indonesian civil registry PII (NIK, full names, home addresses, birth dates, parents' data). No authenticated user may read, list, update, or delete another user's profile or marriage registration dossier.
2. **Verified Email Gate:** Every read and write operation requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Timestamps:** `ownerId` (on `berkas_nikah`), `uid` (on `users`), and `createdAt` can NEVER be altered after document creation. `createdAt` and `updatedAt` MUST match server `request.time`.
4. **No Shadow Fields / Schema Strictness:** Every document and nested map must strictly match `hasAll()` and `hasOnly()` allowlists, and every string field must have an explicit `.size() <= MAX` bound.
5. **Terminal State Locking:** Once a `berkas_nikah` document reaches `status == 'diarsipkan'`, subsequent updates are blocked.
6. **Path ID Hardening:** Every single-document operation (`get`, `create`, `update`, `delete`) enforces `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
7. **Secure List Queries:** `/users` prohibits `list` completely. `/berkas_nikah` enforces `resource.data.ownerId == request.auth.uid` on `list` without any `get()`/`exists()` lookups.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Identity Spoofing on Create:** User A creates `/berkas_nikah/b1` with `ownerId: "user-B"`.
2. **Cross-Tenant PII Read:** User A calls `get` on `/berkas_nikah/b-owned-by-B` or `/users/user-B`.
3. **Unscoped List Scraping:** User A calls `list` on `/berkas_nikah` without `where("ownerId", "==", uid)` or calls `list` on `/users`.
4. **Unverified Email Access:** User with `email_verified: false` attempts to create or read `/berkas_nikah/b1`.
5. **Shadow Field Injection:** User A creates or updates `/berkas_nikah/b1` injecting ghost key `isAdmin: true` or `verifiedByKua: true`.
6. **Ownership Transfer Attack:** User A updates `/berkas_nikah/b1` changing `ownerId` to `"user-B"`.
7. **Immutable Timestamp Tampering:** User A updates `/berkas_nikah/b1` altering `createdAt`, or creates with client-forged timestamp instead of `request.time`.
8. **Resource Exhaustion (1MB String Poisoning):** User A writes a 2000-character string into `catinPria.namaLengkap` or `catatan`.
9. **Path Variable Poisoning:** User A attempts to create `/berkas_nikah/bad..id$script!` or a 300-character document ID.
10. **Nested Map Shadow Injection:** User A injects an unlisted key `extraSecret: "x"` inside `catinPria` map.
11. **Value Type Poisoning:** User A updates `status` with a boolean `true` or an invalid enum string `"approved"`.
12. **Terminal State Bypass:** User A attempts to mutate `catinPria` or revert `status` after `existing().status == 'diarsipkan'`.
