# DOMRS — Disease Outbreak Monitoring and Response System

DOMRS is a robust digital disease outbreak monitoring and response system designed to facilitate rapid reporting, AI-driven anomaly detection, and coordinated epidemic response across civilians, healthcare institutions, public health organizations, and national emergency operations centres.

## 🚀 Tech Stack

- **Backend Framework:** [Hono](https://hono.dev/) (Running on Node.js Adapter)
- **Language:** TypeScript
- **Database / Auth:** [Supabase](https://supabase.com/) (PostgreSQL + GoTrue Auth)
- **Validation:** Zod

## 👥 User Roles

The system is built around a role-based architecture with four primary user types:
1. **Civilian (Level 0):** Residents who receive hyper-local zone alerts and national health trends.
2. **Institution (Level 1):** Hospitals, clinics, and labs that submit "Sentinel Reports" of patient clusters and symptoms.
3. **Public Health Officer / PHO (Level 2):** Zone-level officials who investigate AI-flagged alerts, verify outbreaks, and broadcast warnings.
4. **Emergency Operations Center / EOC (Level 3):** Top-level administrators who oversee the entire system, manage facilities, assign PHOs, and coordinate national response protocols.

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [Supabase](https://supabase.com/) project

### 2. Environment Variables
Navigate to the `backend/` directory and configure your environment variables:

```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in your Supabase connection details:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (Default: 3000)

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Schema Setup
To get the database up and running, you need to apply the schema to your Supabase project:
1. Copy the contents of the `schema.sql` file located in the root directory.
2. Go to your Supabase Project Dashboard -> **SQL Editor** -> **New Query**.
3. Paste the SQL code and hit **Run**.

This query will create the `profiles`, `facilities`, `ai_alerts`, `sentinel_reports`, and `response_protocols` tables, along with an automatic trigger that synchronizes new authentication users into the `profiles` table.

---

## 🖥️ Running the Application

In the `backend/` directory, you can use the following scripts:

- **Start Development Server (Auto-Reloading):**
  ```bash
  npm run dev
  ```
- **Build for Production:**
  ```bash
  npm run build
  ```
- **Start Production Server:**
  ```bash
  npm start
  ```

---

## 🔗 API Overview

You can use the provided `backend/api-tests.http` file with the VS Code "REST Client" extension to seamlessly test all endpoints.

### Authentication (`/auth`)
- `POST /auth/register` - Create a new user with a specific role.
- `POST /auth/login` - Authenticate a user and receive a JWT.

### Reports (`/reports` - Institutions only)
- `POST /reports` - Submit a Sentinel Report.
- `GET /reports/feed` - View reports submitted by your institution.

### Alerts (`/alerts` - PHO & Civilians)
- `GET /alerts/inbox` - Get pending AI-ranked alerts (PHO).
- `POST /alerts/:id/claim` - Claim an alert for investigation (PHO).
- `PATCH /alerts/:id/status` - Update the status of an alert (PHO).
- `GET /alerts/local` - Retrieve health alerts based on GPS coordinates (Civilian).

### Admin (`/admin` - EOC only)
- `PATCH /admin/facilities/:id/status` - Approve/reject a facility.
- `POST /admin/phos` - Appoint a new PHO to a specific zone.
- `POST /admin/alerts/:id/override` - Manually override an AI false-positive alert.

---
*Developed for the Final Year Project.*
