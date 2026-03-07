# Authentication Module
This folder contains the Authentication module for the MERMS backend.

## Purpose
It handles user registration and login functionalities across all user roles ('eoc', 'pho', 'institution', 'civilian'). It validates credentials and interfaces with Supabase Auth and the `profiles` table.

## Architecture
- `auth.repository.ts`: Data access layer dealing with Supabase `auth.admin` and `profiles` table insertion.
- `auth.service.ts`: Business logic, performs credential validation (Zod) and triggers repository methods. Handles role assignment default behavior.
- `auth.controller.ts`: Defines Hono routes (`/register`, `/login`) and maps request payload into the service, sending customized HTTP responses based on service outcomes.
- `index.ts`: Aggregates routes and is imported into the global route setup.
- `__tests__/auth.test.ts`: Unit tests representing component flows to assure robust behavior under ideal and adversarial inputs.