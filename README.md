# AC-31 Thoubal Voter List Management System (NEXUS-31)

**Constituency Electoral Roll, Household Verification & Booth Intelligence Platform**  
*Manipur Legislative Assembly · Constituency 31 (Thoubal)*

---

## 👨‍💻 Author & Engineering Credits

- **Features, Business Logic & Functional Implementation**: **Hemba Sanasam**  
  All product features, domain workflows, electoral roll rules, household grouping logic, role-based access control (RBAC) boundaries, and constituency data models were conceived, designed, and implemented by **Hemba Sanasam**.
- **System Architecture & Scaffolding**: Generated and structured using **Gemini**.

---

## 📌 Overview

The **AC-31 Thoubal Voter List Management System** is a full-stack constituency management and booth-level electoral roll verification platform purpose-built for **31-Thoubal Assembly Constituency (Manipur)**. It covers all **13 official villages**, **41 village parts (Leikais)**, and **41 Polling Stations (PS 1–41)** with strict station-scoped data isolation, household-level grouping, geospatial mapping, and immutable audit logging.

---

## ✨ Key Features & Functional Modules (Engineered by Hemba Sanasam)

### 1. Multi-Factor Official Authentication & Session Persistence
- **Single-Screen Official Portal**: Requires registered **Official Email**, **Account Password**, and **4-Digit Role Security PIN**.
- **Session & Account Persistence**: Active sessions and newly provisioned official accounts persist across browser refreshes (`localStorage` + Firestore synchronization).
- **Strict Re-Authentication Policy**: Direct role-switching bypasses are disabled; switching official accounts requires a full sign-out and credential verification.

### 2. 5-Tier Role-Based Access Control (RBAC) & Geographical Scoping
- **Super Admin**: Full constituency-wide access (`PS 1–41`), soft-delete and restore permissions, auto-approved exports, and exclusive authority to create, edit, or suspend `Super Admin` and `Admin/Coordinator` accounts.
- **Admin / Coordinator**: Constituency-wide operational management (`PS 1–41`), bulk CSV import/rollback, export request approval, and user provisioning for lower-tier roles (`Polling Station Incharge`, `Field Worker`, `Viewer`).
- **Polling Station Incharge**: Strictly scoped to assigned Polling Stations and parent Villages; authorized to edit scoped voters, unmask phone numbers (audit-logged), and request CSV exports.
- **Field Worker**: Strictly scoped to assigned booths and households; phone PII remains masked (`98XXXXXX21`), and administrative tabs (`Import Data`, `Users`, `Settings`) are hidden.
- **Viewer**: Read-only access within assigned station scope with enforced phone number masking.

### 3. Electoral Roll & Voter List Management
- **Comprehensive Voter Registry**: Tracks EPIC Number (`^[A-Z]{3}[0-9]{7}$`), Serial Number, Part Number, Full Name, Father's Name, Mother's Name, Spouse's Name, House Number, Age (`>= 18`), Gender, Phone Number, Verification Status (`Verified`, `Pending`, `Issues`, `New`, `Removed`), and 6-color categorization dots.
- **Slide-Over Voter Drawer**: Instant 360° profile view with inline status updates, household relationships, field visit logs, verification tasks, notes, GPS pin-drop coordinates, and individual audit history.
- **Individual & Bulk Voter Notifications**: Personalized dispatch templates (*Polling Slip*, *Verification Reminder*, *Booth Update*, *Custom Message*) across WhatsApp, SMS, Voice Alert, and Doorstep Field Slips.

### 4. Household & Family Grouping (`Family View`)
- **Automated Household Rollups**: Automatically groups voters into families by Village Part and House Number, tracking verification completion ratios (e.g., `3/4 Verified`).
- **Split & Merge Workflows**: Move voters between families, split multi-generational households into separate family units, or merge duplicate household records.

### 5. Villages, Leikais & Polling Station Hierarchy (`PS 1–41`)
- **Complete AC-31 Thoubal Master Data**: Pre-configured with all 13 Thoubal constituency villages, 41 village parts, and 41 official polling stations (`PS-1` through `PS-41`).
- **Part-to-Station Allocation**: Dynamic mapping between Village Parts (Leikais) and Polling Stations with automatic cascade updates to associated voters and families.
- **Booth Team Assignment**: Assign Polling Station Incharges and Field Workers to individual booths.

### 6. Interactive GIS Constituency & Booth Maps (`Maps`)
- **Leaflet GIS Visualization**: Interactive map of AC-31 Thoubal displaying all 13 villages, 41 polling stations, and geotagged voter households.
- **Spatial Filtering & Pin Picker**: Filter map markers by verification status or polling station, and capture exact household latitude/longitude coordinates.

### 7. Bulk CSV Electoral Roll Import & Rollback (`Import Data`)
- **5-Step Validated Import Pipeline**: Upload CSV -> Column Mapping -> Validation & Duplicate EPIC Detection -> Preview & Unassigned Queue -> Commit Batch.
- **One-Click Batch Rollback**: Every import batch is tagged with a unique `importBatchId`, allowing administrators to roll back an entire batch cleanly if discrepancies are found.

### 8. Approval-Gated Watermarked Exports & Immutable Audit Trail (`Reports` & `Settings`)
- **Watermarked CSV Exports**: Every exported CSV is embedded with the exporting official's identity, timestamp, and stated purpose.
- **Immutable Audit Logs**: Tracks every login, voter creation, field edit, phone PII unmasking, station reallocation, import batch, and user role change.

---

## 🏗️ System Structure (Generated using Gemini)

```text
├── app/
│   ├── globals.css                  # Tailwind CSS v4 & typography styles
│   ├── layout.tsx                   # Root application shell & metadata
│   └── page.tsx                     # Primary entry point mounting StoreProvider & AppShell
├── components/
│   ├── AppShell.tsx                 # Authentication gate, RBAC sidebar navigation & global search
│   ├── VoterListView.tsx            # Scoped voter registry, filters, bulk actions & Add Voter modal
│   ├── VoterDrawer.tsx              # Slide-over 360° voter profile, tasks, visits & audit log
│   ├── FamilyView.tsx               # Household grouping, split/merge & family verification rollups
│   ├── VillagesStationsView.tsx     # 13 Villages, 41 Parts & 41 Polling Stations management
│   ├── MapsView.tsx                 # GIS constituency map dashboard & spatial analytics
│   ├── ConstituencyLeafletMap.tsx   # Interactive Leaflet map engine for booths & voter pins
│   ├── VoterPinPickerMap.tsx        # Household GPS coordinate pin-picker modal
│   ├── ImportDataView.tsx           # 5-step CSV electoral roll importer & batch rollback manager
│   ├── ReportsView.tsx              # Booth verification analytics & export approval queue
│   ├── UsersView.tsx                # 5-tier RBAC matrix, official account provisioning & booth scoping
│   └── SettingsView.tsx             # System configuration, Firestore sync & security audit logs
├── lib/
│   ├── types.ts                     # TypeScript domain models for Voters, Families, Booths & RBAC
│   ├── seed-data.ts                 # Official AC-31 Thoubal 13-village / 41-station master hierarchy
│   ├── store-context.tsx            # Central state engine, RBAC enforcement & persistence layer
│   └── firebase-client.ts           # Firebase Auth & Firestore client initialization
├── firestore.rules                  # Production Firestore security rules enforcing RBAC & schemas
└── package.json                     # Dependencies & scripts (Next.js 15, React 19, Tailwind CSS v4)
