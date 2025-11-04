# FSVP Compliance Platform - Design Guidelines

## Design Approach: Enterprise Design System

**Selected Framework**: Material Design with Carbon Design influences  
**Rationale**: This FDA compliance platform requires clarity, trust, and efficiency. Enterprise design systems excel at information-dense interfaces with complex workflows, role-based access, and audit trails.

**Core Principles**:
- Professional Trust: Clean, authoritative interface that conveys regulatory credibility
- Information Clarity: Dense data presented with clear hierarchy and scannable layouts
- Operational Efficiency: Streamlined workflows for form completion and document review
- Audit Transparency: Clear visibility into version history and compliance status

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 210 85% 45% (Professional blue - trust and authority)
- Secondary: 210 15% 25% (Dark slate for text and headers)
- Success: 142 71% 45% (Approval/compliance indicators)
- Warning: 38 92% 50% (Pending review states)
- Error: 0 84% 60% (Non-compliance alerts)
- Background: 0 0% 98% (Clean canvas)
- Surface: 0 0% 100% (Cards and elevated content)
- Border: 220 13% 91% (Subtle divisions)

**Dark Mode**:
- Primary: 210 85% 60%
- Secondary: 210 15% 85%
- Success: 142 71% 55%
- Warning: 38 92% 60%
- Error: 0 84% 70%
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Border: 217 19% 27%

### B. Typography

**Font Stack**:
- Primary: Inter (via Google Fonts) - excellent readability for data-dense interfaces
- Monospace: 'Roboto Mono' for document IDs, audit timestamps, version numbers

**Scale**:
- Display (Dashboard headers): text-3xl font-semibold
- H1 (Page titles): text-2xl font-semibold
- H2 (Section headers): text-xl font-semibold
- H3 (Card headers): text-lg font-medium
- Body: text-base font-normal
- Small (Meta info, timestamps): text-sm
- Tiny (Labels, captions): text-xs font-medium uppercase tracking-wide

### C. Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16 (e.g., p-4, gap-6, mb-8, py-12, mt-16)

**Grid Structure**:
- Dashboard: 12-column grid with sidebar (col-span-3) and main content (col-span-9)
- Forms: Single column max-w-3xl for optimal form completion
- Data tables: Full-width responsive tables with horizontal scroll on mobile
- Card grids: 2-3 column grid for product SKUs and vendor cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

**Container Widths**:
- App shell: w-full
- Form containers: max-w-3xl mx-auto
- Data tables: max-w-7xl mx-auto
- Content areas: max-w-6xl

### D. Component Library

**Navigation**:
- Top navbar: Fixed header with role indicator, user menu, notifications
- Sidebar: Collapsible navigation with role-specific menu items, icons from Heroicons
- Breadcrumbs: Always visible for deep navigation hierarchies

**Forms & Inputs**:
- Text inputs: Border-2 with focus ring, clear labels above inputs
- File upload: Drag-and-drop zone with file type indicators and version display
- Select menus: Native-styled with clear dropdown indicators
- Radio/Checkbox: Grouped with clear visual association
- Digital signature: Canvas-based signature pad with timestamp display
- Form sections: Grouped in cards with clear progress indicators

**Data Display**:
- Tables: Striped rows, sortable columns, sticky headers, inline status badges
- Status badges: Pill-shaped with role colors (Approved: green, Pending: amber, Rejected: red)
- Cards: Elevated with clear headers, metadata footer with timestamps
- Timeline: Vertical audit trail with version markers and action descriptions
- Document viewer: Embedded PDF viewer with version selector and download options

**Interactive Elements**:
- Primary button: Filled with primary color, medium height (h-10), px-6 padding
- Secondary button: Outlined border-2, hover background
- Danger actions: Red background for deletions/rejections
- Icon buttons: Square (h-10 w-10) for table actions
- Tabs: Underline-style for section switching within pages

**Feedback & Overlays**:
- Modals: Centered with backdrop blur, max-w-2xl for forms
- Toasts: Top-right positioned with auto-dismiss, icon indicators
- Loading states: Skeleton screens for tables, spinners for actions
- Empty states: Illustrated with clear CTAs to guide first actions
- Confirmation dialogs: Clear action descriptions with role-appropriate warnings

### E. Role-Based Visual Differentiation

**Vendor Interface**:
- Accent color: Subtle blue tint in nav and primary actions
- Dashboard focus: Product SKU creation and submission status
- Key views: My Products, Upload Documents, Submission History

**Distributor Interface**:
- Accent color: Green tint for approval actions
- Dashboard focus: Vendor directory and SKU review queues
- Key views: Vendor Search, SKU Review, Approval Workflows

**FDA Auditor Interface**:
- Accent color: Neutral gray with red audit indicators
- Dashboard focus: System-wide visibility and audit trails
- Key views: Complete Audit Log, All Vendors, All SKUs, Compliance Reports
- Enhanced features: Export capabilities, advanced filtering, full history access

### F. Compliance-Specific Patterns

**Audit Trail Display**:
- Chronological timeline with expandable entries
- Each entry shows: Timestamp, User, Action, Changes (diff view), Digital signature indicator
- Version comparison: Side-by-side diff view for document revisions

**Document Management**:
- Version badge always visible (v1.2.3 format)
- Upload date and uploader clearly labeled
- File type icons (PDF, DOCX, etc.) from Heroicons
- Download and history buttons always accessible

**Form Validation**:
- Inline validation with clear error messages
- Required field indicators (red asterisk)
- Field-level help text for FDA-specific requirements
- Save draft functionality with auto-save indicators

**Status Indicators**:
- Traffic light system: Green (Compliant), Amber (Under Review), Red (Issues Found), Gray (Draft)
- Status banners at page top for critical compliance alerts
- Progress bars for multi-step submission workflows

---

## Images

**No hero images required** - This is an enterprise application, not a marketing site. Focus on:
- User avatars in navigation and audit trails
- Company logos for vendor profiles
- Document preview thumbnails in file management
- Icon-based empty states with clear illustrations of next actions
- Iconography throughout using Heroicons solid/outline variants

---

## Accessibility & Polish

- WCAG AA compliance minimum, AAA where possible
- Keyboard navigation fully supported with visible focus states
- Screen reader labels on all interactive elements
- Consistent dark mode across all form inputs, tables, and interactive surfaces
- Loading states never block user with spinners - use skeleton UI
- Animations minimal: Only micro-interactions on buttons (scale on press), fade transitions on modals (150ms duration)