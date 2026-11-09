# PRD – AC-31 Thoubal Voter List Management System

Version 1.1 · Draft · Confidential client project · Prepared for Hemba

## 1. Overview

A secure web system (plus a field-worker mobile app) to manage, verify, and organize the voter list of the AC-31 Thoubal constituency. It holds 33,128 voter records divided across the constituency's 31 polling stations and grouped into families, tracks verification status, and lets admins and field workers collaborate through notes, tasks, and visits.

**Problem:** Voter data arrives as raw lists (PDF/Excel) with spelling variants, duplicates, missing relations, and outdated addresses. Verification is done by teams in the field with no single source of truth.

**Solution:** One system that imports raw data, cleans and groups it into families, assigns verification work to field teams, records results on location, and reports progress by booth and area.

## 2. Goals and Success Metrics

| Goal | Metric |
| --- | --- |
| Single clean database | Less than 1% duplicate records after dedupe; 100% of voters allocated to one of 31 polling stations |
| Faster verification | Pending + Issues reduced by 50% in 60 days |
| Field accountability | 100% of status changes have worker, time, and GPS |
| Fast lookup | Search results under 500 ms on 33k+ records |
| Data safety | Zero unauthorized exports; full audit trail |

## 3. Users and Roles

| Role | Access |
| --- | --- |
| Super Admin | Everything: users, settings, import, delete, audit logs |
| Admin / Coordinator | Manage voters and polling stations, assign workers, reports, export (approval-gated) |
| Polling Station Incharge | Own polling station's voters only: edit, verify, assign tasks |
| Field Worker | Assigned households in their polling station (mobile): visit, update, add notes |
| Viewer / Analyst | Read-only dashboards and reports, no personal data export |

Access is scoped by **Polling Station (PS 1–31)**, not just by role.

## 4. Scope by Phase

**Phase 1 (MVP):** Polling station master and voter allocation, voter list, voter details, family view, import with validation, status workflow, roles and permissions, audit log, basic reports, export with approval.

**Phase 2:** Field worker mobile app (offline), tasks and meetings, map view, duplicate detection and merge, voter slips, bulk actions, saved filters.

**Phase 3:** Meitei Mayek and transliteration search, SMS/WhatsApp notifications, analytics dashboards, polling day tracking, AI assistant.

## 5. Feature Requirements

### 5.1 Polling Stations and Voter Allocation (new)

AC-31 Thoubal has 31 polling stations (PS 1–31), and every voter belongs to exactly one. Polling station is the main way to divide data, work, and access; at 33,128 voters that averages about 1,070 voters per station.

- **Polling station master:** PS number (1–31), name, building and location, GPS pin, roll part number(s), incharge, and assigned workers. Managed by Admins.
- **Allocation on import:** each imported record is mapped to a polling station using the part number in the roll file, through a mapping table kept in Settings. Records that cannot be mapped go to an **Unassigned** queue and cannot be verified until allocated.
- **One station per voter:** enforced in the database. Moving a voter to another station needs a reason and is written to the audit log (for example after an address shift).
- **Per-station voter list:** a polling station selector (multi-select, with an All view for Admins) sits at the top of the voter list. Families are never split across stations without a coordinator's approval.
- **Per-station dashboard:** total voters, Verified, Pending, Issues, New, verification percentage, progress trend, issues by type, and worker coverage for each station.
- **Station comparison:** one view of all 31 stations sorted by pending or issues, so coordinators can see where to send more workers.
- **Station-wise assignment:** each station gets an incharge and workers; workers see only that station's households.
- **Station-wise outputs:** printable voter roster, voter slips, and field sheets per station, generated in bulk for all 31.
- **Rebalance tool:** move households between stations after boundary corrections, with a preview of the count change and an audit entry.

### 5.2 Voter List (existing, with changes)

- Table with status, name, EPIC, family, father, mother, spouse/close member, age, gender, actions.
- **Add columns:** Polling Station (PS 1–31), Part No., Serial No., Ward/Locality, Phone (masked), Assigned Worker, Last Verified On. Users can show/hide columns and save the layout.
- **Filters:** polling station (multi-select), status, locality, age range, gender, tags, assigned worker, issue type, last updated, family size, has-phone, newly imported.
- **Saved filters / smart views**, e.g. First-time voters, Senior citizens (80+), Unverified in PS 12.
- **Bulk actions** on selected rows: change status, assign worker, add tag, add to task, export.
- Sorting on all columns, 15/25/50/100 per page, server-side pagination.
- Fuzzy search by name, EPIC, father, mother, family ID, phone. Tolerant to spelling variants (e.g. Thokchom/Thokchon, Singh/Sing).
- Row click opens the details drawer; keyboard shortcuts for Next/Previous.

### 5.3 Voter Details Drawer (existing, with changes)

- Tabs: Overview, Family Members, Notes, Tasks, History.
- Sections: Personal Info, Family Info, Address & Location, Notifications, Quick Actions, Tasks, Tags.
- **Add:** photo (optional), phone and alternate phone, occupation, education, ration/household ID, special needs flag (elderly, PwD, bedridden) for assistance planning, polling station name, contact preference.
- **History tab:** full timeline of every edit (who, what, old to new value, when), visit logs, and status changes.
- **Mark Issue** opens a form with a required issue type: Duplicate, Deceased, Shifted/Migrated, Wrong address, Missing data, Name mismatch, Other. Issues need a resolution note to close.
- Unsaved-changes warning on close. Delete is **soft delete** with reason, restorable by Super Admin.
- Directions button opens navigation; map pin can be dragged to correct the location.

### 5.4 Family View

- Auto-groups voters by Family ID with the head of family, members, relations, and household address.
- Drag-and-drop to move a member between families; split and merge families with audit.
- Family-level status roll-up (e.g. 4/5 verified), family-level notes and tasks.
- Printable family sheet for field visits.

### 5.5 Import Pipeline

- Supported: Excel, CSV, and OCR-assisted PDF of the electoral roll.
- Steps: upload, column mapping (saved templates), validation preview, polling station allocation, dedupe check, confirm import.
- Imported records get status **New** and an import batch ID; whole batches can be rolled back.
- Validation rules: EPIC format (3 letters + 7 digits) and uniqueness, age at least 18 (flag age 17 and below as Data Issue or Upcoming Voter), gender in allowed values, required fields, family reference consistency.
- Error report downloadable as Excel with row numbers and reasons.
- Auto family suggestion from father/mother/spouse name + address similarity, to be confirmed by a coordinator.

### 5.6 New Features

1. **Duplicate detection and merge:** match on EPIC, name + father + age, and phone. Side-by-side merge screen.
2. **Tasks and assignments:** assign voters or whole families to workers, with due dates, priority, overdue alerts, and a daily task list.
3. **Meetings and visits:** schedule, log outcomes, and set follow-ups.
4. **Map view:** clustered pins by status color, heatmap of pending areas, polling station boundaries as a layer, draw an area to assign.
5. **Voter slip generator:** printable slips with part, serial, polling station, and a QR code. Bulk PDF per polling station (all 31 in one run).
6. **Notifications center:** system alerts, task reminders, and issue escalations. Real-time updates.
7. **Comments and mentions:** @mention coordinators inside notes.
8. **Search by Meitei Mayek and Roman transliteration** (Phase 3).
9. **Polling day mode** (Phase 3): mark voted/not voted by polling station agents and live turnout by polling station.
10. **Approval workflow for export:** exports of personal data need Admin approval, are watermarked, and logged.
11. **Data quality score** per polling station showing completeness of phone, address, and relations.
12. **Dark mode and language toggle** (English, Manipuri).

### 5.7 Reports and Dashboard

- Home dashboard: Verified, Pending, Issues, Newly Imported, plus trend chart over time, with a polling station selector (All or PS 1–31).
- Make cards clickable so they apply the matching filter.
- Reports: status by polling station (all 31 side by side), worker productivity, issue breakdown by type, age and gender distribution, family size distribution, import history, audit report.
- Export to Excel/PDF for aggregated reports. Personal data exports follow the approval rule.

### 5.8 Field Worker Mobile App (Phase 2)

- Works **offline**: downloads assigned households from their polling station, syncs when online, with conflict handling.
- Visit flow: open household, confirm each member, update details, capture GPS and optional photo, set status.
- Call and WhatsApp deep links, task list, and daily summary.
- PIN or biometric lock, and remote wipe on lost device.

## 6. Changes to Current Design

| Current | Change |
| --- | --- |
| Number bubble overlaps status chip (5, 2, 3…) with no label | Remove the badge from the status column. Show open notes/tasks count in a separate "Activity" column with an icon and tooltip |
| Detail drawer hides the Newly Imported card | Keep all four status cards visible; make them clickable filters |
| Delete icon on every row | Move delete into the details drawer and the row menu; soft delete with reason |
| Edit icon and row click both open edit | Row click opens read view; Edit enters edit mode |
| Spouse/Close Member shows only text | Link to the member's record when present in the system |
| Status and Issue are one field | Keep status plus a separate issue type and resolution |
| No polling station in list | Add Polling Station (PS 1–31), Part and Serial columns, since field work is organized by polling station |
| Admin sees everything | Scope data by polling station and role |

## 7. Data Model (Key Entities)

- **Voter:** id, epic\_no, name, name\_local, father\_name, mother\_name, spouse\_name, age, dob (optional), gender, phone, family\_id, part\_no, serial\_no, polling\_station\_id, address\_id, status, issue\_type, tags, assigned\_worker\_id, is\_deleted, created\_at, updated\_at.
- **Family:** id, family\_code, head\_voter\_id, address\_id, status\_rollup.
- **Address:** id, line, locality, ward, pincode, lat, lng, accuracy.
- **PollingStation:** id, ps\_no (1–31), name, location, lat, lng, part\_nos, incharge\_id, voter\_count (cached).
- **Task:** id, voter\_id/family\_id, type, assignee\_id, due\_date, priority, status.
- **Note, Visit, Notification, Tag, ImportBatch, User, Role, AuditLog, ExportRequest, StationAssignment (worker to polling station).**

All edits write to AuditLog (user, entity, field, old, new, timestamp, IP).

## 8. Status Workflow

New (imported) leads to Pending (assigned for visit). Pending leads to Verified (confirmed in field) or Issue (problem found). Issue leads to Pending again after it is resolved, or to Removed (deceased/shifted) with a reason. Verified can be re-opened by a coordinator when new information arrives. Every transition records who, when, and where (GPS for field changes).

## 9. Security, Privacy, and Compliance

This system holds personal data of tens of thousands of people, so it must be built defensively.

- **Legal:** Use only for lawful election-related purposes. Follow the Digital Personal Data Protection Act, 2023 and Election Commission rules on use of electoral roll data. Have the client confirm legal basis and data ownership in writing.
- **Do not collect by default:** caste, religion, or political leaning of individuals. If the client insists, make it a separate restricted field, behind explicit approval, and flag the legal risk to them.
- **Access:** Role- and polling-station-based access; 2FA for admins; session timeout; IP allowlist option.
- **Data protection:** TLS everywhere, encryption at rest, field-level encryption for phone numbers, masked display (98XXXXXX21) unless permitted.
- **Audit:** Immutable audit log; alerts on bulk exports, mass deletes, and unusual logins.
- **Backups:** Daily encrypted backups, tested restore, retention policy.
- **Data lifecycle:** Retention period and secure deletion at project end.
- **Hosting:** Private deployment preferred; no third-party analytics on personal data.

## 10. Non-Functional Requirements

- Handle 100k+ voters and 100+ concurrent users.
- Page load under 2 seconds; search under 500 ms.
- Responsive design for tablet and mobile browsers; accessible contrast and keyboard navigation.
- Availability 99.5%; zero-downtime deploys.
- Full English and Manipuri UI labels (Phase 3).

## 11. Suggested Tech Stack

- **Frontend:** Next.js + React, Tailwind, TanStack Table (virtualized rows)
- **Backend:** NestJS (REST), role/booth guards, BullMQ for import jobs
- **Database:** PostgreSQL with pg\_trgm for fuzzy search and PostGIS for map queries
- **Mobile:** Flutter with local SQLite and sync
- **Storage:** S3-compatible private bucket for imports and photos
- **Maps:** Leaflet/OpenStreetMap or Google Maps
- **Infra:** Docker, private VPS or cloud, automated backups

## 12. Milestones

| Phase | Deliverables | Estimate |
| --- | --- | --- |
| 0 | Finalize PRD, legal sign-off, UI design | 1 week |
| 1 | Auth, roles, polling stations, voter CRUD, list, drawer, families, import, audit | 5–6 weeks |
| 2 | Tasks, map, dedupe, slips, bulk actions, mobile app | 5–6 weeks |
| 3 | Transliteration search, notifications, polling day, analytics | 3–4 weeks |

## 13. Assumptions and Open Questions

- Source of the voter data and its format (PDF roll, Excel, or ECI export).
- How roll part numbers map to the 31 polling stations (one-to-one, or several parts per station), and the expected voter count per station.
- Who owns the data, and who is the data controller (client, party, or candidate)?
- Is polling day tracking in scope for this election cycle?
- Number of field workers per polling station at launch.
- Hosting preference and client's retention policy.
- Whether SMS/WhatsApp outreach is required (consent rules apply).
