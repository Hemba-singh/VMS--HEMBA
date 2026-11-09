# Security Specification — AC-31 Thoubal Voter List Management System

## 1. Data Invariants
1. **Default-Deny Catch-All**: All paths not explicitly matched are denied for both read and write.
2. **Verified Identity**: All mutations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Audit Logs**: Documents in `/auditLogs/{logId}` can only be created (`allow create`), never updated or deleted (`allow update, delete: if false`).
4. **Soft Delete Only on Voters**: Hard deletes on `/voters/{voterId}` are strictly prohibited unless `isAdmin()`. Standard workflow uses soft-delete (`isDeleted: true` with `deleteReason`).
5. **Strict EPIC & Schema Validation**: Every `Voter` write must validate `epicNo` matches `^[A-Z]{3}[0-9]{7}$`, bounded string lengths, and `tags.size() <= 10`.
6. **Privilege Escalation Prevention**: Users cannot self-assign `Super Admin` or `Admin/Coordinator` roles in `/users/{userId}` unless they are already an authenticated admin (`isAdmin()`).
7. **Temporal Integrity**: `createdAt == request.time` on creation and `updatedAt == request.time` on update, with `createdAt` and `createdBy` immutable on update.
8. **Scoped List Queries**: List queries evaluate `resource.data` (such as `resource.data.createdBy == request.auth.uid` or `isAdmin()`), never delegating unfiltered security to the client.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection on Voter**: Adding `{"isAdminOverride": true}` to `/voters/v1`. Rejected by `.keys().hasOnly(...)`.
2. **Unverified Email Admin Spoof**: Token with `email: "sanasamhembasingh@gmail.com"` and `email_verified: false`. Rejected by `request.auth.token.email_verified == true`.
3. **Invalid EPIC Format**: Creating a voter with `epicNo: "1234567890"`. Rejected by `data.epicNo.matches('^[A-Z]{3}[0-9]{7}$')`.
4. **Oversized String Denial-of-Wallet**: Sending a 5,000-character `name` on `/voters/v1`. Rejected by `data.name.size() <= 120`.
5. **Unbounded Tag Array**: Sending 25 tags in `tags` array on `/voters/v1`. Rejected by `data.tags.size() <= 10`.
6. **Audit Log Tampering**: Updating or deleting `/auditLogs/log1`. Rejected by `allow update, delete: if false`.
7. **Identity Spoofing on Create**: Setting `createdBy: "other_user_uid"` when `request.auth.uid == "attacker_uid"`. Rejected by `data.createdBy == request.auth.uid`.
8. **Self-Assigned Admin Role**: Creating `/users/attacker_uid` with `role: "Super Admin"` as a non-admin. Rejected by role gate requiring `isAdmin()`.
9. **Immortal Field Mutation**: Updating `createdAt` or `createdBy` on `/voters/v1`. Rejected by immutability checks.
10. **Terminal State Bypass on ImportBatch**: Updating an `ImportBatch` after `status == 'Rolled Back'` as a non-admin. Rejected by terminal state lock.
11. **Path Variable Poisoning**: Using an invalid document ID with spaces or special characters. Rejected by `isValidId(id)`.
12. **PII Leak on Users Collection**: Reading `/users/other_uid` as a non-owner, non-admin user. Rejected by `isOwner(userId) || isAdmin()`.
