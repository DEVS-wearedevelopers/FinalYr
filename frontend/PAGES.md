# MERMS Frontend — Page-by-Page Design Reference

> **Purpose:** Complete design & interaction reference for every page in the MERMS (Medical Emergency Response & Management System) frontend. Copy this document into any design AI (Figma AI, Galileo, v0, Relume, etc.) to generate or refine screens.

---

## Design System

| Token | Value |
|--|--|
| **Primary colour** | `#1e52f1` (electric blue) |
| **Background** | `#ffffff` (white) / `#f8fafc` (slate-50 for dashboard body) |
| **Text — primary** | `#0f172a` slate-900 |
| **Text — secondary** | `#64748b` slate-500 |
| **Border** | `#e2e8f0` slate-200 |
| **Font** | System sans-serif (Inter or similar) |
| **Border radius** | Cards `16px`, Buttons `12px`, Modals `24px` |
| **Shadow** | Subtle `shadow-sm` on cards; coloured `shadow-[primary]/25` on primary buttons |
| **Doodle pattern** | Repeating SVG cross/plus pattern at 3% opacity as page-background texture |

**Severity palette (used on alerts & badges):**
- Green `bg-green-100 / text-green-700` → Normal / Low
- Amber `bg-amber-100 / text-amber-700` → Warning / Medium
- Red `bg-red-100 / text-red-700` → Critical / High

---

## User Roles

| Role | Level | Self-register? | After login routes to |
|--|--|--|--|
| **Civilian** | 0 | ✅ Simple form | `/dashboard/civilian` |
| **Institution** | 1 | ✅ Full 5-step onboarding | `/dashboard/institution` |
| **PHO** (Public Health Officer) | 2 | ✅ 2-step restricted form | `/dashboard/pho` |
| **EOC Admin** | 3 | ❌ Provisioned by EOC | `/dashboard/eoc` |

---

## Pages — Auth & Public

---

### 1. Landing Page
**Route:** `/`  
**File:** `src/app/page.tsx`  
**Status:** ✅ Live

**Layout:**
- Full-viewport white page, centred content
- Subtle repeating doodle/grid SVG background at 3% opacity
- MERMS wordmark badge (blue dot indicator + text) at top of content
- Large bold heading: *"Building the structured Frontend with Style"*  
  → Keyword `Frontend` highlighted in primary blue
- Subheading paragraph describing the modular architecture
- Two CTA buttons in a row:
  - **Primary:** `Get Started →` → links to `/register`
  - **Secondary (outline):** `Sign In` → links to `/login`
- Below CTAs: a 3-column card grid illustrating `ui`, `components`, `screens` folders
  - Each card: folder icon in blue, title, short description

**Interactions:**
- `Get Started →` → navigates to `/register`
- `Sign In` → navigates to `/login`

**Pending work:**
- Replace the generic architecture description with actual MERMS product copy (mission statement, key features)
- Add a proper hero image or animated dashboard preview

---

### 2. Login Page
**Route:** `/login`  
**File:** `src/screens/Auth/LoginScreen.tsx`  
**Layout file:** `src/components/AuthLayout.tsx`  
**Status:** ✅ Live

**Layout (AuthLayout):**
- Centred card on white background
- MERMS logo top-left of card
- Heading + subheading
- Form content in the main body

**Form elements:**
- Email address input (type=email, required)
- Password input (type=password, required)
- **"Forgot password?"** link (right-aligned, blue) → `/auth/forgot-password`
- **"Sign in"** primary button (full width) — submits to `POST /auth/login`
- On success: JWT stored in localStorage, user redirected to role-specific dashboard
- Error banner shown inline above form on failure

**Dev Quick Login panel (collapsible):**
- Dashed border container
- Toggle row labelled "Dev Quick Login — skip registration"
- 4 test account rows (Institution, PHO, EOC Admin, Civilian) — clicking auto-fills and auto-submits the form
- Footer note

**Footer:**
- "Don't have an account? Create account" → `/register`

**Pending work:**
- Remove Dev Quick Login panel before production build
- Add "Remember me" checkbox

---

### 3. Forgot Password Page
**Route:** `/auth/forgot-password`  
**File:** `src/app/auth/forgot-password/page.tsx`  
**Layout file:** `src/components/AuthLayout.tsx`  
**Status:** ✅ Live (newly created)

**States:**

*Request state:*
- Email input (required)
- "Send reset link" primary button → calls `POST /auth/forgot-password`
- "← Back to Sign In" link

*Success state (shown after send):*
- Green icon (envelope)
- "Check your inbox" heading
- Confirmation text showing the email address used
- "← Back to Sign In" link

---

### 4. Register — Role Selection
**Route:** `/register`  
**File:** `src/screens/Auth/RegisterScreen.tsx`  
**Layout file:** `src/components/AuthLayout.tsx`  
**Status:** ✅ Live

**Layout:**
- Heading "Create an account"
- 4 role cards stacked vertically:

| Card | Badge | Behaviour on click |
|--|--|--|
| Civilian | Level 0 | Shows inline sign-up form |
| Institution | Level 1 | "Full Onboarding →" badge, redirects to `/register/institution` |
| PHO | Level 2 | "Full Onboarding →" badge, redirects to `/register/pho` |
| EOC Admin | Level 3 | 🔒 Restricted badge, shows amber warning notice — no form |

- Selected card highlighted in blue border + blue background tint
- EOC card is greyed out (opacity 70%, `cursor-not-allowed`)
- **EOC amber notice** (shown on EOC click): "EOC Administrator accounts cannot be self-registered. Contact your EOC system administrator."
- "Already have an account? Sign in" link → `/login`

*Inline form (for Civilian):*
- First name + Last name (side by side)
- Email
- Password
- "Create account" submit button → `POST /auth/register` with `role: 'civilian'`
- "Change" link to go back to role selector
- On success: redirect to `/dashboard/civilian`

---

### 5. Institution Registration — Full Onboarding
**Route:** `/register/institution`  
**File:** `src/screens/Institution/InstitutionRegisterScreen.tsx`  
**Status:** ✅ Live

**Layout:**
- Split screen: fixed blue brand panel (left, hidden on mobile) + scrollable form panel (right)
- Brand panel: MERMS logo, "Join Nigeria's Emergency Response Network" heading, 3 feature pills (MDCN Verified, Live Dashboards, Emergency Alerts)
- 5-step progress stepper at top of form

**Steps:**

| Step | Label | Fields |
|--|--|--|
| 1 | Facility | Facility Name, Facility Type (dropdown), CAC Registration Number |
| 2 | Director | Director Full Name, MDCN Folio Number, Official Institutional Email (blocks Gmail/Yahoo etc.), Official Phone Number |
| 3 | Location | Interactive Leaflet map (click to pin, auto-fills address), Street Address, City, State, LGA, Postal Code |
| 4 | Documents | Operating License file upload (PDF), Director Govt ID upload (PDF/image), Data Sharing Consent checkbox, Accountability Clause checkbox |
| 5 | Review | Read-only summary of all steps with "Edit" links per section |

**Controls:**
- `← Change Role` / `← Back` button (left)
- `Continue →` / `Submit Application` button (right)
- Stepper dots: filled blue for done, animated ping for active, grey for future
- File upload zones: dashed border, icon, drag-drop style click-to-upload

**Pending state (after submit):**
- `ApplicationUnderReview` component shown full-screen
- Status tracker: Account Created ✅ → EOC Review → Approval → Access

---

### 6. PHO Registration
**Route:** `/register/pho`  
**File:** `src/screens/Auth/PHORegisterScreen.tsx`  
**Status:** ✅ Live

**Layout:**
- Split screen: dark slate brand panel (left) + form (right)
- Brand panel dark (`slate-900`): "Public Health Officer Portal", amber pulse badge, 3 feature pills
- 2-step stepper

**Steps:**

| Step | Label | Fields |
|--|--|--|
| 1 | Identity | Full Name, Government/Institutional Email (blocks personal domains), Assigned Jurisdiction, Clearance Level (radio: Field Observer / Verification Officer / Regional Admin) |
| 2 | Access | Password (with 4-bar strength indicator: Weak/Fair/Good/Strong), Confirm Password, MFA notice card |

**Controls:**
- Step 2 summary pill shows name + email from step 1, with "Edit" link back
- `← Change Role` / `← Back` / `Continue →` / `Submit Registration` buttons
- Password strength bar updates live as user types

**Pending state (after submit):**
- `PHOPendingState` full-screen: dark header, 4-step tracker (Account Created ✅ → EOC Review → MFA Binding → Dashboard Access), amber notice about email verification

---

### 7. Custom 404 Page
**Route:** Any unmatched route  
**File:** `src/app/not-found.tsx`  
**Status:** ✅ Live (newly created)

**Layout:**
- White page, centred content, doodle background
- Giant ghost "404" in blue outline text (very low opacity, decorative)
- Blue icon tile (exclamation mark)
- Heading "Page not found"
- Subheading
- Two buttons: `Go home` (primary blue) + `Sign in` (outline)
- MERMS logo wordmark at bottom
- Entrance animation: elements fade + slide up on mount

---

## Pages — Institution Dashboard

---

### 8. Institution Dashboard
**Route:** `/dashboard/institution`  
**File:** `src/screens/Institution/InstitutionDashboard.tsx`  
**Layout:** `DashboardLayout` (white sidebar, slate body)  
**Status:** ✅ Live

**Sidebar nav (Institution):**
- Overview → `/dashboard/institution` *(active page)*
- Reports → `/dashboard/reports` ⚠️ *page not built*
- Alerts → `/dashboard/alerts` ⚠️ *page not built*
- Sign out (bottom, clears token → `/login`)

**Top bar:**
- Live / Disconnected status dot (animated pulse)
- Report count today
- **Staff View / Director View** toggle button (blue when Director View active)

**PHO Advisory Banner (always shown if active):**
- Amber or red full-width banner, "PHO Advisory — Zone SW-03: …"
- Non-dismissable (PHO-controlled)

**Director EOC Banner (Director mode, shown if reliability < 70%):**
- Red tinted banner: "Your facility's data quality has been flagged by EOC"

---

#### Staff View
- **"+ New Sentinel Report"** CTA button (full-width gradient blue) → opens `SentinelModal`
- **Live Report Feed** table:
  - Columns: time ago, ward/location, symptom summary, pipeline status badge
  - Click row → expands inline detail (patient count, severity, symptoms chips, notes)
  - Pipeline badges: Pending AI Scan / AI Scored — CBS: 0.74 / Under PHO Review / Validated / Dismissed

**SentinelModal (multi-step conversational form):**
- Floating modal, dark overlay
- Conversational symptom collection (chatbot-style UX)
- Steps through: chief complaint → symptom checklist → patient count → severity → ward/location → notes → confirmation
- "Submit Report" → `POST /reports`

---

#### Director View
- **Staff Activity Table:** Name, Role, Reports This Week (progress bar), Last Submission, Status badge (Active/Inactive), Activate/Deactivate button
- **Facility Health Panel** — 3 cards:
  - Data Quality Score (red if <70%, green if ≥70%)
  - Reports This Month vs Last Month (with delta indicator)
  - EOC Flags count (red if any)

**Pending work:**
- `/dashboard/reports` sub-page
- `/dashboard/alerts` sub-page

---

## Pages — PHO Dashboard

---

### 9. PHO Dashboard
**Route:** `/dashboard/pho`  
**File:** `src/screens/PHO/PHODashboard.tsx`  
**Status:** ✅ Live

**Sidebar nav (PHO):**
- Alert Inbox → `/dashboard/pho` *(active page)*
- Analytics → `/dashboard/pho/analytics` ⚠️ *page not built*
- Broadcasts → `/dashboard/pho/broadcasts` ⚠️ *page not built*
- Sign out

**Header:** "PHO Command Centre" + jurisdiction chip + active alerts count pill

**Tab navigation** (pill switcher):
- 🚨 Alert Triage *(default)*
- 📊 Weekly Intelligence

---

#### Alert Triage Tab

**Left column — Alert Inbox (280px, scrollable):**
- Alerts sorted by CBS (Cluster Behaviour Score) descending
- Each card:
  - Facility name, zone, time ago
  - CBS score badge (green <0.4, amber ≤0.7, red >0.7)
  - Progress bar (CBS fill)
  - Severity badge Sev X/5
  - Symptom chips (first 2 + "+N more")
  - Patient count + location
  - **"Claim" / "✓ Claimed"** toggle button
  - **"Quick Verify"** button (loads alert in right panel)

**Right panel — Evidence Board:**
- Facility heading + CBS score highlight
- 3 stat cards: Patients, Severity/5, Zone
- Symptom Breakdown (horizontal bars per symptom)
- Historical Delta chart — 14-day bar chart (today bars vs baseline bars)
- Action Panel:
  - 3 status toggle buttons: **Monitor Only** (green) / **Issue Advisory** (amber) / **Dispatch Emergency Team** (red)
  - Justification textarea
  - **"Trigger Broadcast"** button → opens BroadcastModal
  - **"Escalate to EOC"** button (red border) → fires toast notification

**BroadcastModal:**
- 4 template radio cards (Respiratory Advisory, Enteric Warning, Hemorrhagic Alert, General Health Watch)
- Preview panel below
- Cancel / Broadcast buttons

---

#### Weekly Intelligence Tab
**File:** `src/screens/PHO/components/WeeklyIntelligence.tsx`  
- AI Weekly Analysis Report section (top symptoms, watch items, disease trends, AI summary)
- Civilian Content Approval Queue (newsletter drafts, prevention tips, disease alerts — Approve / Reject actions)

**Pending work:**
- `/dashboard/pho/analytics` page
- `/dashboard/pho/broadcasts` page

---

## Pages — EOC Dashboard

---

### 10. EOC Dashboard
**Route:** `/dashboard/eoc`  
**File:** `src/screens/EOC/EOCDashboard.tsx`  
**Status:** ✅ Live

**Sidebar nav (EOC):**
- Command Centre → `/dashboard/eoc` *(active)*
- Applications → `/dashboard/eoc/applications` ⚠️ *page not built*
- SORMAS Sync → `/dashboard/eoc/sormas` ⚠️ *page not built*
- Sign out

**Header:**
- "EOC Command Centre" + subtitle
- **"Execute National Protocol"** CTA button (red, top-right) → opens `NationalProtocolModal`

**4 Stat cards (top row):**
- Active Alerts (national count, red)
- Pending Applications (awaiting review, amber)
- Silent Nodes (no report in 24h, slate)
- Last SORMAS Sync (time + date, green)

**National Zone Map:**
- Interactive Leaflet map of Nigeria, divided into 6 zones
- Zone pins: green (normal), amber (warning), red (critical)
- Click zone → right panel slides in with: zone name, status badge, alert count, facility count, silent nodes, assigned PHO
- Legend: Normal / Warning / Critical

**Facility Management table:**
- Columns: Facility, Status (Verified/Pending/Flagged/Blacklisted), Reliability score (progress bar), Actions
- Actions per row: **"Approve"** (green) + **"Blacklist"** (red, if not already blacklisted)
- **BlacklistModal** (on Blacklist click): facility name, warning notice, justification textarea (required), Confirm Blacklist button

**PHO Management table:**
- Columns: Officer name, Zone, Clearance level badge, Broadcast rights toggle
- **Broadcast toggle**: blue pill switch — clicking toggles broadcast rights and fires toast

**NationalProtocolModal:**
- Dual-authorization warning notice
- 4 protocol radio cards (National Epidemic Alert, Regional Containment, Enhanced Surveillance, Mass Casualty Response)
- Co-Signer EOC ID input (required)
- Execute Protocol button (disabled until both fields filled)

**Pending work:**
- `/dashboard/eoc/applications` page (institution application review)
- `/dashboard/eoc/sormas` page (SORMAS sync status)

---

## Pages — Civilian Dashboard (PENDING)

---

### 11. Civilian Dashboard
**Route:** `/dashboard/civilian`  
**File:** ❌ Does not exist yet  
**Status:** ⚠️ **NOT BUILT — placeholder route only**

**Planned features:**
- Personal health alerts feed (area-based)
- Report a concern (simple symptom form, much lighter than Sentinel)
- Broadcast/advisory viewing (read-only from PHO broadcasts)
- Simple map showing nearby active health alerts
- Profile settings

---

## Shared Components

### DashboardLayout
**File:** `src/components/DashboardLayout.tsx`

- White left sidebar (264px width, `min-h-screen`)
- MERMS logo + wordmark at top of sidebar
- User badge (avatar initial, name, role pill in role-colour)
- Nav items (icon + label, active = blue fill)
- Sign out button at bottom (red hover)
- Mobile: sidebar hidden, top header bar shown with hamburger + name initial avatar → tapping hamburger overlays sidebar with backdrop

### AuthLayout
**File:** `src/components/AuthLayout.tsx`

- Centred `max-w-sm` card on white/slate background
- MERMS logo
- Heading + subheading
- Slot for form content

---

## Route Map Summary

| Route | Status | Component |
|--|--|--|
| `/` | ✅ Built | `app/page.tsx` |
| `/login` | ✅ Built | `LoginScreen.tsx` |
| `/auth/forgot-password` | ✅ Built | `app/auth/forgot-password/page.tsx` |
| `/register` | ✅ Built | `RegisterScreen.tsx` |
| `/register/institution` | ✅ Built | `InstitutionRegisterScreen.tsx` |
| `/register/pho` | ✅ Built | `PHORegisterScreen.tsx` |
| `/dashboard/institution` | ✅ Built | `InstitutionDashboard.tsx` |
| `/dashboard/pho` | ✅ Built | `PHODashboard.tsx` |
| `/dashboard/eoc` | ✅ Built | `EOCDashboard.tsx` |
| `/dashboard/civilian` | ❌ Not built | — |
| `/dashboard/reports` | ❌ Not built | — |
| `/dashboard/alerts` | ❌ Not built | — |
| `/dashboard/pho/analytics` | ❌ Not built | — |
| `/dashboard/pho/broadcasts` | ❌ Not built | — |
| `/dashboard/eoc/applications` | ❌ Not built | — |
| `/dashboard/eoc/sormas` | ❌ Not built | — |
| `*` (catch-all) | ✅ Built | `not-found.tsx` |

---

## Tech Stack

| Layer | Technology |
|--|--|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| HTTP client | Axios (`apiClient`) |
| Maps | Leaflet (lazy-loaded, SSR disabled) |
| Auth | JWT via Supabase — stored in localStorage |
| Backend base URL | `https://merms-backend.onrender.com` (configurable via `NEXT_PUBLIC_API_URL`) |
