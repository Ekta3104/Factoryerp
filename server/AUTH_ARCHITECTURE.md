# Authentication Architecture

## Overview

FactoryERP uses a **stateless, cookie-based JWT** authentication strategy. There is **no public user registration endpoint**. All user creation is strictly controlled.

---

## Exposed Endpoints

| Method | Endpoint            | Access  | Description                              |
|--------|---------------------|---------|------------------------------------------|
| POST   | `/api/auth/login`   | Public  | Validates credentials; issues JWT cookie |
| POST   | `/api/auth/logout`  | Private | Clears the JWT cookie                    |
| GET    | `/api/auth/me`      | Private | Returns the authenticated user's profile |

> **No registration endpoint exists and none will be added here.**  
> User creation belongs to the Admin User Management module (future, RBAC-protected).

---

## User Creation Policy

Users can **only** be created through these two controlled channels:

### 1. Database Seed Script *(bootstrapping)*
```
server/scripts/seedAdmin.js
```
- Run once to create the initial Owner/Admin account.
- Credentials are supplied via environment variables (`SEED_PASSWORD`, etc.).
- Idempotent — safe to re-run; skips if user already exists.
- Requires `SEED_PASSWORD` to be explicitly set; will exit with error if missing.

```bash
# Set variables in server/.env, then run:
node server/scripts/seedAdmin.js
```

### 2. Future Admin User Management Module *(runtime)*
- A protected API under `/api/admin/users` (not yet implemented).
- Will be guarded by `protect` + `authorize('Owner', 'Admin')`.
- Only `Owner` and `Admin` roles will be able to create, update, or deactivate users.

---

## JWT Strategy

### Token Payload
```json
{
  "id":   "<user UUID>",
  "role": "<Owner | Admin | Operator | ...>",
  "iss":  "factoryerp-api",
  "aud":  "factoryerp-client",
  "iat":  1234567890,
  "exp":  1234567890
}
```

- `role` is embedded in the token to avoid a DB round-trip on every protected request.
- `iss` (issuer) and `aud` (audience) claims are verified on every request.

### Cookie Settings
| Property   | Value                              | Reason                        |
|------------|------------------------------------|-------------------------------|
| `httpOnly` | `true`                             | JS cannot read the cookie     |
| `secure`   | `true` in production               | HTTPS only                    |
| `sameSite` | `strict`                           | CSRF protection               |
| `maxAge`   | 24 h (configurable via `JWT_EXPIRES_IN`) | Session lifetime        |

---

## Middleware

### `protect` — Authentication Guard
File: `server/middlewares/auth.middleware.js`

- Reads JWT from the `jwt` HTTP-only cookie.
- Verifies signature, expiry, issuer, and audience.
- Attaches `{ id, role }` to `req.user`.
- Returns `401` if token is missing, expired, or invalid.

### `authorize(...roles)` — RBAC Guard
File: `server/middlewares/auth.middleware.js`

- Must be used **after** `protect`.
- Accepts a list of allowed role strings.
- Returns `403` if `req.user.role` is not in the allowed list.

```js
// Example — only Owner and Admin can access this route
router.delete('/users/:id', protect, authorize('Owner', 'Admin'), deleteUser);
```

---

## Security Measures

| Measure                        | Implementation                                              |
|-------------------------------|-------------------------------------------------------------|
| Timing-attack protection       | bcrypt compare always runs (even for non-existent users)    |
| Password hashing               | bcrypt with 12 salt rounds                                  |
| JWT algorithm                  | HS256 (symmetric)                                           |
| Cookie isolation               | `httpOnly` + `secure` + `sameSite=strict`                   |
| Token issuer/audience binding  | `iss` and `aud` claims verified on every request            |
| Account deactivation           | `is_active` column checked at login                         |
| Input sanitization             | `express-validator` with `.trim().escape()` on login inputs |

---

## Environment Variables

| Variable          | Required | Default                   | Description                        |
|-------------------|----------|---------------------------|------------------------------------|
| `JWT_SECRET`      | Yes      | dev fallback only         | Token signing secret               |
| `JWT_EXPIRES_IN`  | No       | `1d`                      | Token lifespan (e.g. `8h`, `1d`)   |
| `SEED_USERNAME`   | No       | `admin`                   | Username for seed user             |
| `SEED_EMAIL`      | No       | `admin@factoryerp.com`    | Email for seed user                |
| `SEED_PASSWORD`   | Yes      | script exits if unset     | Password for seed user             |
| `SEED_ROLE`       | No       | `Admin`                   | Role for seed user (Owner/Admin)   |

---

## What Was Deliberately Absent

| Item                             | Reason                                                       |
|----------------------------------|--------------------------------------------------------------|
| `POST /api/auth/register`        | Self-registration is a security anti-pattern for internal ERP |
| Public `createUser` endpoint     | User management is Admin-only and requires RBAC              |
| Hardcoded seed credentials       | Replaced with env-driven config; script fails if unset       |
| Role fetched from DB per request | Role is in the JWT; avoids an extra DB query on every call   |
