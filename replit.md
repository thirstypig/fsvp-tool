# FSVP Compliance Platform

## Overview

The FSVP Compliance Platform is a comprehensive Foreign Supplier Verification Program application designed for FDA compliance management. It enables vendors to register and submit product SKUs with compliance documentation, distributors to review and approve submissions, and auditors to oversee system-wide compliance with complete audit trails. The platform provides role-based access control, document management with version tracking, digital signature capabilities, and comprehensive audit logging for regulatory compliance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript using Vite as the build tool

**UI Component System:** Shadcn/ui with Radix UI primitives
- Enterprise-focused design with Material Design and Carbon Design influences
- Custom theming system supporting light/dark modes via CSS variables
- Extensive component library for data-dense interfaces (tables, forms, dialogs, badges)
- Responsive layouts optimized for regulatory compliance workflows

**State Management:** 
- TanStack Query (React Query) for server state management
- Session-based authentication with custom query handling for 401 responses
- Local state managed through React hooks

**Routing:** Wouter for lightweight client-side routing

**Form Management:** React Hook Form with Zod validation for type-safe form handling

**Design System:**
- Typography: Inter font family for readability, Roboto Mono for technical data
- Color palette optimized for regulatory trust (professional blue primary, semantic status colors)
- Information-dense layouts with clear hierarchy for compliance workflows

### Backend Architecture

**Runtime:** Node.js with Express framework

**Language:** TypeScript with ES modules

**API Design:** RESTful endpoints organized by domain:
- `/api/auth/*` - Authentication (register, login, logout)
- `/api/vendors/*` - Vendor management
- `/api/products/*` - Product/SKU management
- `/api/documents/*` - Document uploads and retrieval
- `/api/signatures/*` - Digital signature functionality
- `/api/audit/*` - Audit log access

**Authentication & Authorization:**
- Session-based authentication using express-session
- Password hashing with Node.js crypto (scrypt with salt)
- Role-based access control (vendor, distributor, auditor, admin)
- Session persistence with 7-day cookie expiration

**File Upload Handling:**
- Multer middleware for multipart form data
- 10MB file size limit
- Accepted formats: PDF, DOCX, XLSX
- In-memory storage before persistence to object storage

**Business Logic:**
- Version increment system for document revisions (semver-style)
- Comprehensive audit logging for all state changes
- Status workflow management (draft → pending → approved/rejected)

### Data Storage

**Database:** PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database operations
- WebSocket connection support for serverless environment
- Schema-first approach with migrations in `/migrations`

**Database Schema Design:**

**Core Tables:**
- `users` - User accounts with role-based access (vendor, distributor, auditor, admin)
- `vendors` - Vendor company profiles linked to users with verification status
- `products` - Product SKUs with comprehensive metadata (ingredients, allergens, manufacturer details)
- `documents` - File metadata with version tracking and object storage references
- `digital_signatures` - Cryptographic signatures with signer identity and timestamps
- `audit_logs` - Complete audit trail of all system actions

**Key Relationships:**
- One-to-one: User → Vendor
- One-to-many: Vendor → Products
- One-to-many: Product → Documents
- Many-to-many: Products ↔ Digital Signatures (implicit through product references)

**Enums for Data Integrity:**
- User roles: vendor, distributor, auditor, admin
- Compliance status: draft, pending, approved, rejected
- Verification status: unverified, pending, verified
- Audit actions: upload, approve, reject, sign, edit, delete, create, update

**File Storage:** Replit Object Storage (via @replit/object-storage Client)
- Document files stored separately from metadata
- Referenced by file paths in document records

### External Dependencies

**Infrastructure Services:**
- **Neon Database:** Serverless PostgreSQL hosting with WebSocket support
- **Replit Object Storage:** File storage for compliance documents (PDF, DOCX, XLSX)

**Core Libraries:**
- **Drizzle ORM (0.39.1):** Type-safe PostgreSQL ORM with schema management
- **TanStack Query (5.60.5):** Server state management and caching
- **React Hook Form (via @hookform/resolvers 3.10.0):** Form validation with Zod schemas
- **Zod:** Runtime type validation for API contracts and forms

**UI Component Libraries:**
- **Radix UI:** Unstyled accessible component primitives (40+ components)
- **Tailwind CSS:** Utility-first styling with custom design tokens
- **Lucide React:** Icon system
- **shadcn/ui:** Pre-built styled components following New York variant

**Authentication & Security:**
- **express-session:** Session management middleware
- **connect-pg-simple:** PostgreSQL session store
- **Node.js crypto:** Native password hashing (scrypt) and signature verification

**Development Tools:**
- **Vite:** Frontend build tool and dev server with HMR
- **TypeScript:** Type safety across full stack
- **esbuild:** Server-side bundling for production
- **Replit Dev Tools:** Runtime error overlay, cartographer, dev banner (development only)

**File Handling:**
- **Multer:** Multipart form data parsing for file uploads
- **date-fns:** Date manipulation and formatting for audit timestamps