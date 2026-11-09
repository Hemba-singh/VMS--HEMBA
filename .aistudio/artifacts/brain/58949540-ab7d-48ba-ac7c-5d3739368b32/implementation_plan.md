# Interactive OpenStreetMap & Leaflet Voter Geolocation System

Deliver a 100% free, zero-API-key OpenStreetMap & Leaflet mapping system that lets field workers and administrators pinpoint exact voter household coordinates inside the Voter Drawer and visualize all voters and polling stations across AC-31 Thoubal in a dedicated Maps view.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions have been confirmed based on your preferences:

- **Confirmed Map Provider**: **OpenStreetMap with Leaflet** (100% free and open-source, requiring zero API keys or billing setup, with crisp street, leikai, and landmark tiles for Thoubal, Manipur).
- **Confirmed Placement & Workflows**:
  1. **Interactive Map Pin Picker inside Voter Drawer**: Click or drag the household marker on an embedded Leaflet map (or use 1-click device GPS / Nominatim place search) to capture and save exact `lat`/`lng` coordinates for any voter.
  2. **Dedicated Maps Tab in Primary Navigation**: Full-viewport interactive constituency map displaying all scoped voters and all 31 Polling Stations (`PS 1–31`), with filtering by Part/Polling Station, Village, Verification Status, and Pure Color Dots.
- **Confirmed Marker Styling**: **Color-code voter pins by Voter Category color state** (Green `#10b981`, Red `#ef4444`, Amber `#fbbf24`, Blue `#0071e3`) using pure color dots without text labels for category states, while keeping voter names strictly uncolored neutral text.

---

### 1. Overview & Core Concept

- **What It Does**: Replaces static coordinate text with live, interactive OpenStreetMap canvases powered by Leaflet. Users can drag a pin or click anywhere on the map inside a voter's record to lock in their exact house location, or open the dedicated **Maps** tab to inspect household distributions, polling station boundaries, and booth-level coverage across AC-31 Thoubal.
- **Target Audience / Persona**: Booth-Level Officers (BLOs), Field Workers verifying households on location with mobile GPS, Polling Station Incharges auditing part coverage, and Campaign Coordinators analyzing spatial clusters.
- **Key Value**: Eliminates guesswork when locating voter houses (`H.No.`) in dense leikais, provides instant visual awareness of color-state distribution around each polling booth, and operates completely free without external API quotas or billing keys.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Pinpointing a Voter's Exact Location (Voter Drawer)**:
     - User clicks any voter card in the Expanded View or row in List View to open the right-hand **Voter Drawer**.
     - Under **Section 3 (Address, Hierarchy & GPS Location)**, an interactive OpenStreetMap canvas centers on the voter's current coordinates (`lat`, `lng`) alongside their Polling Station reference marker.
     - User can **drag the pin**, **click anywhere on the map** to move the pin, search a nearby Thoubal landmark/leikai via free OpenStreetMap Nominatim geocoding, or click **"Use My Current GPS"** (`navigator.geolocation`) to snap the pin to their physical location.
     - User can optionally check **"Apply to all family members"** so everyone in the same household (`familyId`) shares the exact house pin, then click **Save Changes** to persist to state/Firestore and log an audit trail entry.
  2. **Exploring the Constituency Map (Dedicated Maps Tab)**:
     - User selects **Maps** from the left navigation sidebar (matching the reference design's sidebar navigation).
     - A filter toolbar at the top allows filtering pins by **Polling Station (Part 1–31)**, **Village (12 Villages)**, **Pure Color Dots** (Green, Red, Amber, Blue), **Verification Status**, or **Search Query** (Name, House No, Voter ID).
     - Clicking any color-coded voter pin opens a clean popover card showing their uncolored **Name**, **EPIC No.**, **House No.**, **Part & Serial No.**, and quick actions (**Open Voter Drawer**, **Notify Voter**, **Google/OSM Directions**).
     - Clicking a **Polling Station (`PS-1` to `PS-31`)** marker highlights all voters assigned to that booth and displays booth verification metrics.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Calm, high-contrast Apple Design Language combined with the NEXUS-31 operational layout.
  - *Color Palette & Mood*:
    - Light mode surface `#ffffff` / `#f5f5f7`, Dark mode `#000000` / `#1c1c1e`, primary interactive accent `#0071e3`.
    - Voter map pins rendered as crisp circular vector markers with white borders and subtle drop shadows in the 4 category colors (`#10b981` Emerald, `#ef4444` Red, `#fbbf24` Amber, `#0071e3` Blue).
    - Polling Station markers rendered as distinct badged building pins (`PS-12`) so booths stand out clearly from voter households.
  - *Typography & Hierarchy*: System SF Pro / Inter stack; monospace tabular numerals (`tabular-nums`) for `lat`/`lng` coordinates, EPIC numbers, and distance metrics. Voter names remain strictly neutral (`#1d1d1f` / `#f5f5f7`) with zero color tinting on name text.

- **Interactive Feedback & Motion**:
  - Smooth `flyTo` camera transitions (`400ms` ease-out) when switching Polling Stations or selecting a voter from the search bar.
  - Instant coordinate readout updates as a marker is dragged, paired with a bottom-center confirmation toast when coordinates are saved.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Dynamic Leaflet Rendering in Next.js App Router**
  - *Chosen Approach*: Encapsulate Leaflet map canvases in dedicated client components loaded via `next/dynamic` with `{ ssr: false }` and custom SVG/CSS `L.divIcon` markers.
  - *Why*: Leaflet relies on browser `window` and DOM APIs (`HTMLElement`). Dynamic client-only loading prevents Next.js SSR hydration errors while custom `L.divIcon` markers eliminate broken default marker PNG asset paths and support dynamic category colors natively.
  - *Alternatives Considered*: Static iframe embeds (rejected because they do not support custom color-coded voter pins, draggable pinpointing, or click-to-open Voter Drawer interactions).

- **Decision 2: Free OpenStreetMap Tile Layers + Optional Satellite Toggle & Nominatim Search**
  - *Chosen Approach*: Default to high-legibility OpenStreetMap Standard road/locality tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) with a 1-click toggle to Esri World Imagery satellite view for roof-level house pinpointing in rural/semi-urban leikais, plus free OSM Nominatim search for landmarks.
  - *Why*: Street tiles show road names and landmarks clearly, while satellite imagery helps field workers visually spot individual rooftops when house numbers are non-sequential.

- **Decision 3: Household Coordinate Sync Option**
  - *Chosen Approach*: When updating a voter's pin in the Voter Drawer, provide a toggle to sync those exact `lat`/`lng` coordinates to either the individual voter or their entire linked household (`familyId`).
  - *Why*: Families live in the same physical house (`houseNo`), saving field workers from manually dragging pins for every member of a 5-person household.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        StoreProvider (store-context.tsx)                   │
│  • voters (lat, lng, gpsAccuracyMeters, category, houseNo, familyId)       │
│  • scopedPollingStations (lat, lng, psNo, name) & villages (lat, lng)      │
│  • updateVoter() / bulkUpdateVoters() / addVisit() + Firestore Sync        │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│        Dedicated Maps View            │  │          VoterDrawer            │
│  • Constituency-wide Leaflet Canvas   │  │  • Embedded Pin-Picker Map      │
│  • Filter by Part (PS), Village,      │  │  • Drag Marker or Click-to-Pin  │
│    Pure Color Dots & Search Query     │  │  • "Use My Device GPS" Button   │
│  • Polling Station Markers (PS 1–31)  │  │  • Free Nominatim Place Search  │
│  • Category Color-Coded Voter Pins    │  │  • "Sync Family Household" Opt  │
│  • Popover -> Opens VoterDrawer       │  │  • Saves lat/lng to Store & DB  │
└───────────────────────────────────────┘  └─────────────────────────────────┘
```

- **Data Model & State**:
  - `NavigationTab`: Add `'maps'` to the navigation union type so **Maps** appears in the primary left sidebar right below `Villages & Polling Stations` (and alongside `Voter List` and `Family View`).
  - `Voter`: Uses existing `lat?: number`, `lng?: number`, `gpsAccuracyMeters?: number`, `houseNo?: string`, `category: VoterCategory`, and `pollingStationId: string`.
  - `PollingStation` & `Village`: Uses existing `lat: number` and `lng: number` coordinates centered in AC-31 Thoubal (`~24.638° N, 94.001° E`).

- **Interactive Component & State Mapping**:
  - **Drawer Pin Picker**:
    - Dragging the marker or clicking the map triggers `handleFieldChange('lat', newLat)` and `handleFieldChange('lng', newLng)`, marking `hasUnsavedChanges = true`.
    - Clicking **"Use Device GPS"** invokes `navigator.geolocation.getCurrentPosition`, updates `lat`/`lng` and `gpsAccuracyMeters`, pans the map, and shows a toast notification.
    - Clicking **"Save Changes"** persists `lat`/`lng` to the voter (and optionally all voters sharing `voter.familyId` via `bulkUpdateVoters`), syncing to Firestore if authenticated.
  - **Constituency Maps Tab**:
    - Filters (`selectedPsId`, `villageFilter`, `categoryColorFilter`, `globalSearch`) dynamically filter the rendered markers and auto-fit map bounds (`map.fitBounds`) to the active selection.
    - Clicking a voter pin opens a rich popup with a **"View / Edit Full Record"** button that sets `selectedVoterId(voter.id)` to open the `VoterDrawer` directly over the map view.
    - Clicking **"Pinpoint Mode"** on the Constituency Map lets a worker select any voter and click directly on the map to update their house location on the spot.
