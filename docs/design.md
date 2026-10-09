# Goods — High-level design (iOS, Android, web)

> Implements [`spec.md`](spec.md). Rule IDs refer to the spec.


## Context
`docs/spec.md` is now complete (rules `MEM-*` … `UGC-*`, decisions 1–61, no open questions). The
codebase is still close to a fresh Expo 57 template: Expo Router (`src/app/_layout.tsx`, `index`,
`explore`), native/web tab bars (`src/components/app-tabs.tsx` / `app-tabs.web.tsx`), auth screens
with email, Sign in with Apple and Google (`src/screens/auth/index.tsx`), and a Supabase client
(`src/utils/supabase.ts`). `src/data/` and `supabase/migrations/` are empty, so the schema starts
from scratch. Goal: one design that ships the spec to **iOS, Android and a full web version**.

User decisions: web = **full app** from the same codebase; web hosted on **EAS Hosting**; offline —
asked "what goes best with Supabase" (answered below).

## 1. Architecture

```
 Expo Router app (one TypeScript codebase)
   iOS  ─┐
   Android ├─ React Native / react-native-web ── supabase-js + TanStack Query
   Web  ─┘       (web deployed to EAS Hosting, incl. public pages)
                                   │
 Supabase ─────────────────────────┴──────────────────────────────────────
   Postgres: tables + RLS + triggers + SECURITY DEFINER RPCs  ← business rules live here
   Storage: item-photos bucket (RLS by List membership)
   Edge Functions: delete-account, admin-suspend          (need service role / Apple REST)
   pg_cron: daily consensus, Detail cleanup, ban/suspension purge, report purge
```

**Principle: the database enforces the spec; clients are thin.** Privacy (`PRIV-*`), permissions
(§11.3), uniqueness (`UNIQ-*`) and cascades (`LEAVE-*`, `ITEM-6`) must hold no matter which client
calls the API, so they live in RLS, triggers and RPCs — never only in UI code. Three platforms then
share one rule implementation.

**Offline — recommendation: online-first with a TanStack Query cache.** It fits Supabase best here:
aggregates need *other* members' private Values (`PRIV-2`), which may never be copied to a device,
and most writes run server-side checks (uniqueness, word filter, permissions). A full offline replica
would still be unable to compute aggregates or validate writes. Cached reads give fast loads and
survive brief outages. If true offline is needed later, **PowerSync** (Supabase's offline-sync
partner; SQLite on iOS/Android/web) can be added for the user's *own* data without redesigning.

## 2. Backend (Supabase)

**Schema** (one migration per area in `supabase/migrations/`; types generated to
`src/utils/database.types.ts`):
- Identity: `profiles` (username, app_terms_accepted_version, suspended, suspension_reason), `blocks`.
- Lists: `lists` (admission, filters, terms + version, unlisted, name_template), `contributors`
  (status, joined_at, admin_since, previous_status, terms_accepted_version, invited_by,
  screen_config), `invite_links`.
- Details: `details` (kind OPINION|FACT, type, min/max/step, private, required, default, archived,
  selected_detail_count, up_for_deletion_date), `options` (position, archived).
- Personal view: `selected_details`, `option_personalizations`, `value_personalizations`.
- Items: `items` (name, search_text, photo_path, photo_uploader, archived), `fact_values` +
  `fact_value_options`, `reviews` (label), `values` + `value_options`, `consensus_values`.
- Moderation: `reports`, `word_list`, `word_allowlist`.
- Every table: audit columns (`AUD-1`); `*_by` nullable → "deleted contributor" (`LEAVE-4`).

**RLS** via helper functions `is_active_member(list)`, `is_admin(list)`, `is_senior_admin(list, other)`;
private tables (`reviews`, `values`, `selected_details`, personalizations) readable only by owner.

**RPCs (SECURITY DEFINER) for multi-step rules**, each named after its rule IDs:
`create_list` (`LIST-2`), `apply_to_list`/`decide_applicant` (`JOIN-*`), `leave_list` (`LEAVE-*`),
`set_role`/`ban`/`unban` (`MOD-*`), `create_item` (FactValues + Review + `UNIQ-3`), `archive_*`,
`remap_option` (`ARC-5`), `item_aggregates` (applies `PRIV-2/3`, `AGG-2/3`), `export_my_data`
(`DATA-1`).

**Triggers:** `selected_detail_count` + `up_for_deletion_date` (`DET-11..13`), name/search_text
regeneration (`NAME-4`), delete Item at zero Reviews (`ITEM-6`), auto-promote (`MOD-6`), delete
empty List (`LEAVE-6`), word filter reject (`UGC-4`), audit fields.

**pg_cron:** Detail cleanup (`DET-14`), consensus re-check (`AGG-5`), 1-year purge of banned /
suspended data (`MOD-2a`, `UGC-2`), report purge (`UGC-1`).

**Edge Functions:** `delete-account` (`ACC-4`: cascade + delete auth user + revoke Apple tokens),
`admin-suspend` (`UGC-2`, developer-only).

**Search:** `pg_trgm` index on `items.search_text` (`NAME-5`) and `lists.name` (`JOIN-1`).

## 3. Client (Expo Router, all platforms)

**Routes** (`src/app/`):
- `(auth)/` sign-in; `(app)/` signed-in tabs: Lists, Search, Settings.
- `lists/[listId]/` items, item `[itemId]`, details & my view, members/admin, list settings.
- `settings/` account, terms, download my data, delete account, blocked users.
- Public (no auth, web-first): `/privacy`, `/terms`, `/delete-account` (Google Play web link),
  `/invite/[code]`, landing page.

**Data layer** (`src/data/`): one module per domain (lists, details, items, reviews, moderation,
account) wrapping supabase-js calls and RPCs, mapping snake_case rows to camelCase types, exposed as
TanStack Query hooks. Server state lives in the query cache; `screenConfig` is saved to the
Contributor row; everything else is local UI state.

**Platform differences** (use `.web.tsx` / `.native.tsx` like the existing `app-tabs.web.tsx`):
- Auth: native Apple/Google SDKs on iOS/Android; Supabase OAuth redirect on web (google-signin has
  no web build, per the note in `src/screens/auth/index.tsx`).
- Photos: `expo-image-picker` + re-encode with `expo-image-manipulator` before upload, which drops
  EXIF/GPS (`ITEM-7`) on all platforms.
- Invite links: universal/app links on mobile (associated domains), plain web route otherwise.
- Navigation chrome: native tabs on mobile, web tab bar/side nav on wide screens.

**UI:** existing `src/components/*` plus `@expo/ui` for native forms (sliders, pickers, menus) per
Detail type (`DET-1`); one renderer per type shared by Fact and Opinion forms.

## 4. Delivery milestones
1. **Foundation** — schema core + RLS helpers, generated types, auth on all 3 platforms, data-layer
   pattern, EAS Hosting deploy, public legal/deletion pages.
2. **Lists & membership** — create List (with required Fact), search/stats, apply/admission/filters,
   invite links, roles & seniority, leaving.
3. **Details** — Facts & Opinions, Options, SelectedDetails/defaults, mutability, archive & remap.
4. **Items & Reviews** — create Item (FactValues + Review), name template, uniqueness, photos,
   Values, personalizations.
5. **Aggregates & consensus** — `item_aggregates`, privacy threshold, daily consensus job.
6. **Compliance & moderation** — account deletion, export, reports, blocks, suspension, word filter,
   purge jobs.
7. **Release** — EAS Build/Submit for iOS & Android, store privacy labels / Data safety, production
   web on EAS Hosting.

## Verification
- **Database tests (pgTAP via `supabase test db`)**, named by rule ID: every permission-matrix row
  (§11.3) tested per role; privacy (`PRIV-2/3`); cascades (`LEAVE-3`, `ITEM-6`, `ACC-4`); uniqueness.
- **RPC/Edge Function tests** against a local Supabase (`supabase start`).
- **App checks per milestone** on iOS simulator, Android emulator and web (`expo start --web`), with
  a short manual script per feature; production web smoke test after each EAS Hosting deploy.
- **Traceability:** each spec rule ID appears in at least one test name or code comment.
