# Reports Module
Handles Institution Sentinel Reports submission and localized reporting for DOMRS.

## Purpose
Allows registered healthcare institutions to submit Sentinel Reports regarding potential outbreak events. Handles the core Confidence-Based-Scoring (CBS) mechanism to gauge the urgency and likelihood of an outbreak and dispatches potential alerts to the `ai_alerts` table based on computed values.

## Architecture
- `reports.repository.ts`: Interacts securely with Supabase databases (`sentinel_reports`, `ai_alerts`).
- `reports.service.ts`: Performs robust validations including the Confidence-Based Scoring (CBS) math based on Symptom Weights, Temporal Velocities, and Patient Volume logic.
- `reports.controller.ts`: Extracts `user` from the authentication middleware and executes endpoints.
- `index.ts`: Combines internal parts and maps endpoints to the main API.
- `__tests__/reports.test.ts`: Unittest components against mathematical threshold constraints and DB error scenarios.
