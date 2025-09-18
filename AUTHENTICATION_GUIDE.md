# Authentication and Authorization Guide

This document provides a comprehensive overview of the authentication and authorization mechanisms used in the Pardee Foods Employee Attendance System.

## Table of Contents

1.  [Overview](#1-overview)
2.  [Standard Login: Email & Password](#2-standard-login-email--password)
3.  [Biometric Verification: WebAuthn](#3-biometric-verification-webauthn)
    -   [3.1. Device Registration (First-Time Setup)](#31-device-registration-first-time-setup)
    -   [3.2. Action Verification (Clock-in/Clock-out)](#32-action-verification-clock-inclock-out)
4.  [Authorization: Role-Based Access Control (RBAC)](#4-authorization-role-based-access-control-rbac)
5.  [Session Management & Security](#5-session-management--security)

---

## 1. Overview

The system employs a two-layered approach to security:

1.  **Primary Authentication (Login):** All users (Employees, HR, Admins) log in to the application using their email and a secure password. Upon successful login, they receive a JSON Web Token (JWT) that authenticates their session for subsequent API requests.
2.  **Action-Specific Verification (Biometrics):** For sensitive actions like clocking in or out, employees must provide a second, stronger form of verification using their device's built-in biometrics (e.g., fingerprint, face recognition) via the WebAuthn standard. This ensures that the person performing the action is physically present and authorized.

---

## 2. Standard Login (Email & Password)

This is the entry point for all users.

**Flow:**

1.  **User Input:** The user navigates to the `/login` page and enters their registered email and password.
2.  **API Request:** The frontend sends a `POST` request to the `/api/auth/login` endpoint with the user's credentials in the request body.
3.  **Backend Validation:**
    -   The backend finds the user by their email address in the `users` table.
    -   It securely compares the provided password against the `password_hash` stored in the database using a strong hashing algorithm (e.g., bcrypt).
4.  **Token Issuance:** If the credentials are valid, the backend generates a JWT. This token contains a payload with essential, non-sensitive user information, such as `userId` and `role`, along with an expiration time.
5.  **Session Creation:**
    -   The backend sends a success response containing the JWT and the user's profile data (name, email, role, etc.).
    -   The frontend stores the JWT and the user object in the browser's `localStorage`. This persists the user's session across page reloads.
6.  **Authenticated Requests:** For all subsequent API calls to protected endpoints, the frontend includes the JWT in the `Authorization` header (`Authorization: Bearer <JWT>`). The backend validates this token on every request to ensure the user is authenticated.

---

## 3. Biometric Verification (WebAuthn)

WebAuthn provides a secure, passwordless way to verify a user's identity. In this application, it is used to authorize critical actions, not as a primary login method.

### 3.1. Device Registration (First-Time Setup)

Before an employee can use biometrics, they must register their device (e.g., laptop with a fingerprint scanner, phone with face ID). This is a one-time process per device.

**Flow:**

1.  **Initiation:** The logged-in user navigates to their `/profile` page and clicks "Register a New Device".
2.  **Request Challenge:** The frontend sends a request to the `/api/webauthn/register/begin` endpoint.
3.  **Backend Generates Options:** The backend generates a unique, random challenge and other credential creation options required by the WebAuthn standard. These options are tied to the specific user.
4.  **Browser Prompts User:** The frontend uses the options from the backend to call the `navigator.credentials.create()` browser API. This triggers the browser and operating system to prompt the user for biometric verification.
5.  **Key Pair Generation:** The user's device (the "authenticator") creates a new public/private key pair. The private key is stored securely on the device and never leaves it.
6.  **Send Public Key to Server:** The authenticator returns the newly created public key and an "attestation statement" (proof of creation) to the frontend. The frontend sends this data to the `/api/webauthn/register/finish` endpoint.
7.  **Backend Verification & Storage:** The backend verifies the attestation and, if valid, stores the user's public key, credential ID, and other metadata in the `webauthn_credentials` database table, linking it to the `user_id`.

### 3.2. Action Verification (Clock-in/Clock-out)

Once a device is registered, the user can use it to verify attendance events.

**Flow:**

1.  **Action Trigger:** The employee clicks "Clock In" or "Clock Out" on their dashboard.
2.  **Request Challenge:** A popup window opens and immediately requests a new, unique challenge from the `/api/webauthn/login/begin` endpoint. The backend looks up the user's registered credential IDs and includes them in the options.
3.  **Browser Prompts User:** The popup's frontend calls `navigator.credentials.get()` with the options from the backend. The browser prompts the user for their fingerprint or face scan.
4.  **Challenge Signing:** The user's device uses its securely stored private key to sign the challenge sent by the backend. This signature proves the user's presence and consent.
5.  **Verification:**
    -   The signed challenge ("assertion") is sent from the popup back to the main dashboard page.
    -   The dashboard page sends this assertion to the final backend endpoint (e.g., `/api/attendance/clock-in`).
    -   The backend retrieves the user's stored public key from the `webauthn_credentials` table.
    -   It uses the public key to verify the signature on the assertion. It also checks a signature counter to prevent replay attacks.
6.  **Action Confirmed:** If the signature is valid, the backend processes the request (e.g., creates a new entry in the `attendance_records` table) and returns a success message.

---

## 4. Authorization: Role-Based Access Control (RBAC)

Authorization determines what a logged-in user is allowed to see and do. Access is restricted based on the user's role (`employee`, `hr`, or `admin`).

-   **Frontend Enforcement:** The React application uses a `ProtectedRoute` component. This component wraps around routes and checks the `user.role` stored in the `AuthContext`. If the user's role is not in the allowed list for a specific route, they are redirected to an "Unauthorized" page. This controls UI visibility.
-   **Backend Enforcement (Crucial):** Every API endpoint on the backend is protected by middleware that checks the user's role extracted from their JWT payload. For example, a request to `/api/admin/employees` will be rejected if the JWT does not belong to a user with the `admin` role. **This is the most critical layer of security**, as it prevents users from bypassing the frontend UI to access data they are not permitted to see.

---

## 5. Session Management & Security

-   **JWT Storage:** The JWT is stored in `localStorage`, which is vulnerable to Cross-Site Scripting (XSS) attacks. It is critical to sanitize all user inputs and implement other XSS mitigation strategies.
-   **Token Expiration:** JWTs are configured with a short expiration time (e.g., 1-2 hours) on the backend. This limits the window of opportunity for an attacker if a token is compromised. A refresh token mechanism could be implemented for a more seamless user experience.
-   **HTTPS:** The entire application must be served over HTTPS to encrypt communication between the client and server, protecting credentials and tokens from being intercepted. WebAuthn requires a secure context and will not work over HTTP.
-   **Logout:** The logout function clears the JWT and user data from `localStorage` on the client side, effectively ending the session. The backend can also maintain a token blocklist for immediate server-side invalidation if needed.
