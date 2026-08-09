# MakTech IAMS — Laravel migration handoff

**State as of:** 9 Aug 2026
**Branch:** `main`, last commit `80ce3ab` ("Updated")
**Nothing has been committed.** All work below is in the working tree awaiting review.

This document exists so the work can be resumed from a different machine or account with no loss of context.

---

## 1. What was asked

Create a fresh Laravel application in the existing prototype directory, move the complete
prototype into a `prototype` folder inside it, and — **before** building — supply a tech and
package list with versions for verification, all at latest.

The version list was delivered and approved before any scaffolding happened. It lives in a
Cursor canvas at:

```
C:\Users\HP\.cursor\projects\c-Industrial-Software-prototype\canvases\laravel-stack-verification.canvas.tsx
```

That canvas is the authoritative record of the stack: every package, its version, release date,
PHP requirement, and the reasoning for inclusion — plus a table of packages considered and
deliberately rejected.

---

## 2. Decisions taken (all confirmed by the user)

| Decision | Choice |
|---|---|
| Production PHP | **8.4** — take every package at latest |
| Prototype location | **`public/prototype`** — browsable at `/prototype/index.html` |
| Styling | **Keep the hand-written CSS**, bundled by Vite. No Tailwind. |
| PDF engine | **`spatie/laravel-pdf`** via headless Chromium (pixel-accurate) |
| Database | **PostgreSQL** (18.4 already installed locally) |
| DB credentials | **Dedicated least-privilege `iams` role**, not the `postgres` superuser |
| First build target | **The database schema** — port the prototype's data model to migrations + models |

---

## 3. Verified local environment

| Tool | Version | Note |
|---|---|---|
| PHP | 8.4.20 (XAMPP, ZTS) | Meets the 8.4 floor |
| Composer | 2.9.8 | |
| Node | 22.14.0 | Satisfies Vite 8 and concurrently 10 |
| npm | 10.9.2 | npm 12.0.2 available, not required |
| PostgreSQL | 18.4, service `postgresql-x64-18` running on 5432 | `psql` at `C:\Program Files\PostgreSQL\18\bin\psql.exe` |
| PHP extensions | `pdo_pgsql` + `pgsql` both loaded | PDO drivers: mysql, pgsql, sqlite |

**The PHP 8.4 floor is real and was verified**, not assumed. Laravel 13 alone runs on 8.3, but
re-resolving the tree with the platform pinned to 8.3 fails on exactly three packages:
`spatie/laravel-activitylog 5.0`, `endroid/qr-code 6.1`, `pestphp/pest 5.0`.
If the production server turns out to be 8.3, pin those three one major line back and everything
else stays latest.

---

## 4. What is built and verified

Laravel **13.24.0** at the repo root; the complete prototype at `public/prototype`.

All 27 prototype files moved via `git mv` as **pure renames with zero content change**, so history
follows them and no prototype behaviour was altered.

### Installed — production

| Package | Version |
|---|---|
| laravel/framework | 13.24.0 |
| laravel/tinker | 3.0.2 |
| laravel/fortify | 1.37.3 |
| inertiajs/inertia-laravel | 3.3.1 |
| spatie/laravel-permission | 8.3.0 |
| spatie/laravel-activitylog | 5.0.0 |
| spatie/laravel-medialibrary | 11.23.4 |
| spatie/laravel-settings | 3.9.0 |
| spatie/laravel-pdf | 2.12.0 |
| spatie/browsershot | 5.4.0 |
| endroid/qr-code | 6.1.3 |
| maatwebsite/excel | 3.1.69 |
| league/csv | 9.28.0 |
| propaganistas/laravel-phone | 6.0.3 |

### Installed — dev

`pestphp/pest 5.0.4`, `pestphp/pest-plugin-laravel 5.0.1`, `larastan/larastan 3.10.0`,
`laravel/pint 1.30.4`, `laravel/pail 1.2.7`, `laravel/telescope 5.22.0`,
`barryvdh/laravel-debugbar 4.4.1`, `barryvdh/laravel-ide-helper 3.7.0`,
`nunomaduro/collision 8.9.5`, `fakerphp/faker 1.24.1`, `mockery/mockery 1.6.12`

### Installed — npm

`vite 8.2.1`, `laravel-vite-plugin 3.1.3`, `axios 1.19.0`, `chart.js 4.5.1`,
`concurrently 10.0.4`, `jsdom 29.1.1`, `playwright 1.62.1`, `puppeteer 25.5.0`

### Verification results

| Check | Result |
|---|---|
| Prototype jsdom suite | **280 passed, 0 failed** — matches the pre-move baseline exactly |
| Prototype Playwright suite | **24 passed, 0 failed** (real CSV and `.xlsx` uploads) |
| Pest | 2 passed |
| Migrations | All 8 tables create cleanly |
| Vite build | 34.76 kB CSS; Deep Navy sidebar and all design tokens present in the bundle |
| `composer audit` / `npm audit` | 0 vulnerabilities across 173 Composer packages |
| Prototype pages via Laravel | `index.html`, `portal.html`, `teacher-portal.html`, `verify.html`, CSS and JS all HTTP 200 |

---

## 5. Five non-obvious things discovered — do not undo these

1. **The Fortify security advisory.** Fortify 1.37.0 pulls `web-auth/webauthn-lib 5.2.4`, which has
   a live advisory (`PKSA-zk1n-qbm6-d3rq`); Composer refuses to install it. Latest Fortify pulls the
   patched 5.3.5. Never pin Fortify below 1.37.3.

2. **`intervention/image` was dropped.** It was in the original proposal but medialibrary 11 uses
   `spatie/image` instead, making it redundant. One fewer dependency than quoted.

3. **`spatie/laravel-pdf` 2.x is driver-based and Browsershot is only a `suggest`, not a `require`.**
   Without explicitly installing `spatie/browsershot`, the Chromium driver has no engine and PDF
   generation fails at runtime. It is installed; keep it.

4. **Chromium binaries were landing in a temp cache that gets wiped.** Fixed two ways:
   `.puppeteerrc.cjs` pins Puppeteer's download to `node_modules/.cache/puppeteer`, and Playwright's
   browsers were installed to `C:\Users\HP\AppData\Local\ms-playwright`. If the Playwright test ever
   reports a missing executable, set `PLAYWRIGHT_BROWSERS_PATH` to that path or re-run
   `npx playwright install chromium`.

5. **Laravel's root `package.json` declares `"type": "module"`, which broke the prototype's
   CommonJS test harness.** Rather than rename the test files, `public/prototype/package.json`
   scopes that directory back to `"type": "commonjs"`. Do not delete that file.

Also: **`node_modules` is no longer tracked in git.** It had been committed before `.gitignore`
existed (1813 of 1843 tracked files). It is now untracked — files remain on disk — which is what
the existing `.gitignore` always intended. Tracked file count went 1843 → 30.

---

## 6. Immediate next step — finish the database

The only outstanding setup task. `.env` is configured for PostgreSQL with `DB_USERNAME=iams` and an
**empty `DB_PASSWORD`**, waiting on the role being created. `.env` is gitignored.

Run this once, choosing your own long random password. `psql` will prompt for the `postgres`
superuser password:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -v app_password="'YOUR_PASSWORD_HERE'" -f database/setup-postgres.sql
```

Then put that same password into `.env` as `DB_PASSWORD` and run:

```powershell
php artisan migrate
```

The script `database/setup-postgres.sql` creates a login-only `iams` role (no SUPERUSER, no
CREATEDB), an `iams` database owned by it, and grants it the `public` schema — Postgres 15+ no
longer grants `CREATE` on `public` by default, which is a common migration failure.

---

## 7. Then: the database schema

**Status: IN PROGRESS (9 Aug 2026)** — domain migrations and models are built; awaiting PostgreSQL connection to run against the real database.

### What is done

| Area | Status |
|---|---|
| **8 IAMS domain migrations** (17 new tables total across 7 migration files + user extension) | Created and validated on SQLite |
| **Eloquent models** (20 models with relationships) | Created for core domains |
| **PermissionSeeder** | Maps prototype RBAC → spatie/laravel-permission (149 permissions, 8 roles) |
| **Prototype reference** | Still at `public/prototype/` — 304 passing assertions unchanged |

### Tables created (beyond Laravel + package defaults)

**Reference:** `departments`, `institutions`, `institution_departments`, `labs`

**Academic:** `courses`, `course_modules`, `course_discounts`, `course_sessions`, `batches`, `batch_teacher`, `class_schedules`

**CRM:** `leads`, `visits`, `contact_histories`, `follow_ups`, `online_sessions`, `marketing_targets`

**Students:** `students`, `student_enrollments`, `module_progress`, `attendance_sessions`, `attendance_records`, `enrollment_requests`

**Finance:** `fee_invoices`, `payment_installments`, `payments`, `refunds`, `course_migrations`, `discounts_given`, `cash_handovers`, `cash_handover_payment`, `vendors`, `expenses`

**Teacher payments:** `teacher_pay_rates`, `teacher_payments`

**Certificates & notifications:** `certificates`, `id_cards`, `notifications`, `notification_rules`

**Users extended with:** `phone`, `status`, `avatar_color`, `cash_custodian` (+ profile photos via medialibrary)

### Permission naming (matches prototype `effectivePerm`)

```
{Module}.{Action}           →  Students.ChangeStatus
Reports.Report_{id}         →  Reports.Report_9
{Module}.List_{key}         →  Payments.List_Paid
Users.AdminPanelAccess      →  portal-only vs admin panel gate
```

### Multi-guard authentication (admin / teacher / student)

Three independent session guards — logging into one panel does not authenticate the others.

| Panel | Guard | Model | URL prefix | Auth mechanism |
|---|---|---|---|---|
| Admin ERP | `admin` | `User` | `/admin` | Fortify (email + password) |
| Teacher portal | `teacher` | `User` | `/teacher` | Phone + password; `Course Coordinator / Teacher` role only |
| Student portal | `student` | `Student` | `/student` | Phone + `portal_password` |

**Spatie permissions apply only to the admin guard.** All 149 permissions and 8 roles are seeded with `guard_name => 'admin'`. The `User` model sets `$guard_name = 'admin'`.

Key files:

- `config/auth.php` — three guards + legacy `web` alias
- `config/fortify.php` + `FortifyServiceProvider` — admin login at `/admin/login`, blocks inactive users and users without `Users.AdminPanelAccess`
- `routes/admin.php`, `routes/teacher.php`, `routes/student.php`
- Middleware: `admin.panel`, `teacher.account`, `guest.admin`, `guest.teacher`, `guest.student`
- Prototype parity helpers on `User`: `canAccessAdminPanel()`, `canModule()`, `canAccessReport()`, `isTeacher()`

Placeholder dashboards exist at `/admin/dashboard`, `/teacher/dashboard`, `/student/dashboard`.

### Frontend stack — Laravel + React (Inertia)

The application UI is **React via Inertia.js**, not Blade/Livewire.

| Package | Version |
|---|---|
| inertiajs/inertia-laravel | 3.3.1 |
| @inertiajs/react | latest |
| react / react-dom | latest |
| @vitejs/plugin-react | latest |

Key paths:

- `resources/views/app.blade.php` — single root Blade shell (`@inertia`)
- `resources/js/app.jsx` — Inertia bootstrap, wraps every page in `IdentityProvider` + `UiProvider`
- `resources/js/Pages/` — React pages (Admin, Teacher, Student, Welcome, Verify)
- `resources/js/Layouts/` — `AdminLayout`, `PortalLayout`, `TeacherPortalLayout`
- `resources/js/lib/` — the shared foundation (see below)
- `resources/css/app.css` — imports prototype `theme.css` + `portal.css` (hand-written CSS, no Tailwind)

Fortify admin login renders `Admin/Auth/Login.jsx`. Teacher and student auth controllers render their own Inertia login pages.

---

## 8. The prototype → React port

The frozen prototype at `public/prototype` is the **pixel spec**. It was ported to React first,
as a complete static UI, before any module's backend was written. `resources/css/theme.css` and
`portal.css` are **byte-identical** to their `public/prototype/css` counterparts (verified by
hash) — that is what makes the ported screens visually exact, so do not diverge them.

### Two layers, ported differently

| Prototype file | Ported to | How |
|---|---|---|
| `js/data.js` (1550 lines: fixtures + all business logic) | `resources/js/lib/db.js` | **Mechanical, verbatim.** `scripts/port-proto-module.mjs` copies the source byte-for-byte and appends an `export { … }` block for its 176 top-level declarations. |
| `js/icons.js` | `resources/js/lib/icons.js` | Same script, 2 exports. |
| `js/ui.js` (imperative DOM helpers) | `resources/js/lib/ui.jsx`, `UiProvider.jsx`, `Receipt.jsx` | Rewritten as React components/context, same DOM output. |
| `js/app.js` (shell, router, click delegation) | `Layouts/AdminLayout.jsx`, `lib/nav.js`, `lib/identity.jsx` | Rewritten; navigation is Inertia visits. |
| `js/render-*.js` (11 files) | `resources/js/Pages/**` | Hand-ported to JSX, one page per prototype view. |

**Regenerate the two mechanical modules rather than hand-editing them:**

```powershell
node scripts/port-proto-module.mjs public/prototype/js/data.js resources/js/lib/db.js
node scripts/port-proto-module.mjs public/prototype/js/icons.js resources/js/lib/icons.js
```

### The foundation every page uses

| Module | Provides |
|---|---|
| `lib/db.js` | `DB`, `TODAY`, and all 176 prototype helpers (`fmtMoney`, `effectivePerm`, `recordPayment`, `markAttendance`, …) |
| `lib/ui.jsx` | `Icon`, `IconGlyph`, `StatusBadge`, `MethodBadge`, `KpiCard`, `Donut`, `BarChart`, `HBarList`, `Tabs`, `Avatar`, `Pagination` |
| `lib/UiProvider.jsx` | `useUi()` → `openModal`, `closeModal`, `openDrawer`, `closeDrawer`, `toast`, `confirmAction` (modal/drawer/toast hosts are mounted once, globally) |
| `lib/identity.jsx` | `useIdentity()` → the previewed user + `can()` / `canList()` / `canReport()`; backs the topbar role switcher |
| `lib/hooks.js` | `useRefresh()` — the prototype's `refreshCurrentView()` equivalent |
| `lib/ProfilePhotoBlock.jsx` | the `ui.js` photo picker, shared by the admin My Profile modal and both portals' profile screens (pass the prototype's own `inputId` / `previewId` per caller) |
| `lib/Receipt.jsx` | `PaymentReceipt`, `CashHandoverReceipt`, `printPaymentReceipt`, `printCashHandoverReceipt` |
| `lib/CertificateArt.jsx` | `CertificateSheet`, `IdCard` |
| `lib/nav.js` | `NAV` (sidebar tree) + `VIEW_META` (page titles), ported from `app.js` |

### `Icon` vs `IconGlyph` — the one easy way to break pixel fidelity

The prototype emitted icons two different ways and the difference is load-bearing:

- `icon('x')` → `<span class="ic">…svg…</span>`, and `.ic` is a **fixed 16px box**.
- `${ICONS.x}` → a **bare `<svg>`**, which lets the parent's own rule size it — `.kpi-icon svg` wants
  19px, `.report-card .ric svg` 18px, `verify.html`'s `.big-icon svg` 28px.

So match whichever the prototype used: `<Icon name>` for `icon()`, `<IconGlyph name>` for `${ICONS.x}`.
`IconGlyph` wraps the SVG in a `display:contents` span, so the `<svg>` lands directly in the parent's
flex box and those container rules still apply. Getting this backwards silently renders a 16px icon
where the design wants 19px. Do **not** "fix" it by adding CSS overrides — `theme.css` and
`portal.css` must stay byte-identical to the prototype's.

There is deliberately **no `EmptyState` component**: the prototype writes
`<div class="empty-state">${icon('x')}<p>msg</p></div>` inline, with no title and no inner wrapper,
so pages reproduce that shape directly.

### Actions that cross module boundaries

A few prototype actions are reachable from screens owned by a different `render-*.js`. Those are
shared as hooks rather than duplicated, and each takes the caller's `useRefresh()`:

| Hook | Prototype action | Called from |
|---|---|---|
| `Pages/Admin/students/StudentProfileDrawer.jsx` → `useStudentDrawer(onRefresh)` | `view-student` | Students, Attendance, batch rosters, finance screens |
| `Pages/Admin/teacherpay/PayRateForm.jsx` → `useSetPayRateModal(onSaved)` | `open-set-payrate` | Teacher Payments rates table, Batches' Manage Teachers modal |
| `Pages/Admin/admin/MyProfileModal.jsx` → `useMyProfileModal(onChange)` | `open-my-profile` | the topbar user chip in `AdminLayout` |

The academic screens expose the first two through `useAcademicModals()` as `actions.viewStudent` and
`actions.setPayRate`. The CRM host and the Attendance page use `useStudentDrawer()` directly.

**When one of these opens from inside another screen, thread the host's refresh through it.** The
prototype's `refreshCurrentView()` re-rendered the whole page, so a payment recorded from the student
drawer also updated the Students table underneath. A bare `useRefresh()` in the nested hook only
re-renders the nested piece. That is why `useFinanceModals(onRefresh)` takes an optional callback and
`StudentProfileDrawer` passes its `refreshAll` (drawer + host page) into it.

One structural difference from the prototype: its modal shell was static markup that survived
`navigate()`, whereas here the modal host sits **above** the Inertia page component. A modal left
open during a visit would strand itself over the next screen, so `go-view`-style buttons call
`closeModal()` before `router.visit()`.

### Admin routing

One controller serves all 29 admin screens: `Admin\PanelController::VIEWS` lists the view ids,
each resolving to `resources/js/Pages/Admin/<StudlyId>.jsx` (`online-sessions` → `OnlineSessions`).
The view id is also the URL segment and the sidebar key in `lib/nav.js` — **keep those three in
sync.** As each module gets a real backend, give it a dedicated controller and drop its id from
`PanelController::VIEWS`.

`tests/Feature/AdminPanelRenderTest.php` walks every id and asserts the page renders. Inertia's
`assertInertia()` also fails when the named component file is missing, so that test is the gate
proving routes and pages stay matched. `tests/Feature/PortalRenderTest.php` does the same for the
two portals and the public `/verify` page. Both portals are **single-route SPAs** — the prototype's
in-portal navigation (its `pgo` actions) is client-side, so `student/dashboard` and
`teacher/dashboard` each cover that portal's whole surface.

### Known scope of the static phase

Pages read from `lib/db.js` and **mutate it in memory**, exactly as the prototype did, so the
click-through demo behaves identically with no backend. Nothing persists across a refresh. Every
handler that writes to `DB` calls `useRefresh()` so React re-renders. The topbar role switcher
changes the previewed user and is persisted in `sessionStorage` under `iams.previewUserId` — it
is a demo affordance and disappears when real per-user permissions drive the UI.

The two portals have the same affordance for the same reason. Their login cards offered "log in as
any sample student/teacher", which the prototype did client-side; a real session can only carry the
account that actually authenticated, and the fixture students and teachers have no database rows. So
those selects record a preview choice via `readPortalPreviewId()` / `setPortalPreviewId()` in
`lib/identity.jsx` (`iams.portalStudentId`, `iams.portalTeacherId`), and each portal picks its fixture
in that order: previewed choice, then a match on the authenticated phone, then the first fixture.
Both login forms are prefilled with the seeded `DemoAccessSeeder` credentials so they submit
successfully out of the box — **update those prefills if the seeded numbers change.**

Two intentional deviations remain, both consequences of Inertia's page swap:

- Access Control's "manage this user" jump navigates as `/admin/access?user=<id>` and seeds its
  selection from that param, because the prototype could set a module variable and re-render in place.
- `save-curriculum` and `save-course-edit` reopen the course-detail modal **without** refreshing the
  catalogue table behind it, so it stays stale until you navigate. That is the prototype's own
  behaviour, kept deliberately.

### What is still needed

1. **PostgreSQL setup** (blocked on you — see section 6)
2. **IamsDataSeeder** — port the prototype's seed data from `data.js` into the database
3. **Org settings** — `spatie/laravel-settings` class for `DB.orgProfile`
4. **Remaining model stubs** — Visit, Payment, Expense, CashHandover, etc. (minimal, for completeness)
5. **Backend, module by module** — replace each page's `lib/db.js` reads with real Inertia props
   and its in-memory mutations with form posts, one module and one panel at a time

The prototype's 304 passing assertions (280 jsdom + 24 Playwright) remain the acceptance spec.

---

## 9. Useful commands

```powershell
# Serve the Laravel app (prototype at http://127.0.0.1:8000/prototype/index.html)
php artisan serve

# Everything at once: server, queue, logs, vite
composer dev

# Build assets
npm run build

# Prototype test suites — the static server must be running first, in a second terminal
node public/prototype/_staticserver.js
npm run test:prototype           # jsdom, expect 280 passed
npm run test:prototype:browser   # Playwright, expect 24 passed

# Laravel tests / quality
vendor\bin\pest
vendor\bin\pint
vendor\bin\phpstan analyse
```

---

## 10. Uncommitted working-tree state

- 27 staged renames (prototype → `public/prototype`)
- 1813 staged deletions (the `node_modules` untracking; files still on disk)
- 24 untracked entries (the Laravel skeleton, `.puppeteerrc.cjs`, `HANDOFF.md`, and this setup)
- Modified: `.gitignore`, `package.json`, `package-lock.json`

Reviewing the diff before committing is recommended, since the `node_modules` untracking makes the
staged deletion count look alarming while being entirely intentional.
