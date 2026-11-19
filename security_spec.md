# Vitalora Health — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny:** Any path not explicitly matched (`/articles/{articleId}`, `/pages/{pageSlug}`, `/admins/{userId}`) is strictly denied for all reads and writes.
2. **Draft Confidentiality:** Articles with `status == 'draft'` can ONLY be read (`get` or `list`) by a verified administrator (`isAdmin()`). Unauthenticated visitors and non-admin users can strictly only read articles where `status == 'published'`.
3. **Editorial Authority:** Creating, editing, or deleting `/articles/{articleId}` or `/pages/{pageSlug}` requires a verified administrator (`request.auth.token.email_verified == true` and either primary owner email `subhankarhal007@gmail.com` or an existing `/admins/{uid}` record).
4. **Controlled View Increment:** Readers may increment `views` on a `published` article ONLY by `+1` (`incoming().views == existing().views + 1`) with `affectedKeys().hasOnly(['views'])` and passing full `isValidArticle(incoming())` validation. No other field can be modified by non-admins.
5. **Immutable Audit Fields:** `id`, `authorUid`, and `createdAt` on articles are immutable after creation. On creation, `createdAt == request.time`, `updatedAtTimestamp == request.time`, and `authorUid == request.auth.uid`.
6. **PII & Role Isolation:** `/admins/{userId}` documents contain admin emails and RBAC roles. Reads are strictly limited to the document owner (`userId == request.auth.uid`) or the primary admin. Writes are strictly limited to the primary admin, preventing self-assigned privilege escalation.
7. **Strict Schema & Bounds:** Every string has `.size()` limits, every array is bounded (`tags.size() <= 15`), every ID matches `^[a-zA-Z0-9_\-]+$`, and shadow/ghost fields are blocked via `keys().hasAll()` + `keys().hasOnly()` and `affectedKeys().hasOnly()`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection (Create Article):** Admin attempts to create an article with an extra ghost field `{ ..., "isFeaturedHack": true }`. Blocked by `keys().hasOnly(...)`.
2. **Unverified Admin Email Spoofing:** Attacker authenticates with email `subhankarhal007@gmail.com` where `email_verified: false` and tries to create/update an article. Blocked by `request.auth.token.email_verified == true`.
3. **Unauthorized Draft Scraping (List Query):** Public visitor runs an unfiltered `list` query on `/articles` without `where('status', '==', 'published')`. Blocked because `allow list` enforces `resource.data.status == 'published' || isPrimaryAdmin()`.
4. **Direct Draft Read:** Public visitor calls `get` on `/articles/art-draft-1` where `status == 'draft'`. Blocked by `resource.data.status == 'published' || isAdmin()`.
5. **View Count Manipulation (+1000):** Public visitor attempts `update` on a published article setting `views: existing.views + 1000`. Blocked by `incoming().views == existing().views + 1`.
6. **Public Content Tampering during View Update:** Public visitor sends `update` with `{ views: existing.views + 1, title: "Hacked" }`. Blocked by `affectedKeys().hasOnly(['views'])`.
7. **Draft View Increment:** Public visitor attempts to increment `views` on a `draft` article. Blocked by `existing().status == 'published'`.
8. **Self-Assigned Admin Escalation:** Signed-in regular user tries to create `/admins/{theirUid}` with `{ role: "admin" }`. Blocked because only `isPrimaryAdmin()` can write `/admins`.
9. **PII Leak on `/admins`:** Signed-in non-admin user tries to `get` or `list` `/admins/{otherUid}` to harvest admin emails. Blocked by `isOwner(userId) || isPrimaryAdmin()`.
10. **ID Poisoning / Oversized Document ID:** Admin or attacker attempts to create `/articles/` with a 200-char or special-character ID `../../etc/passwd`. Blocked by `isValidId(articleId)`.
11. **Backdated Timestamp Spoofing:** Admin attempts to create an article with client-chosen `createdAt: "2020-01-01"` instead of `request.time`. Blocked by `incoming().createdAt == request.time`.
12. **Immutable Field Modification & Oversized Array:** Admin attempts to mutate `authorUid` or `createdAt` on an existing article, or submit 50 tags (`tags.size() > 15`). Blocked by immutability checks and `data.tags.size() <= 15`.
