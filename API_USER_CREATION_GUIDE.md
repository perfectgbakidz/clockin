# Backend Guide: New User Creation API

This document provides a technical specification for the backend API endpoint responsible for creating new users (employees, admins, or HR). This process is initiated by an Administrator from the "Employee Management" page in the frontend application.

---

### 1. API Endpoint

-   **URL:** `/api/admin/employees`
-   **Method:** `POST`
-   **Protection:** This endpoint is critical and **must** be protected by middleware that verifies the requesting user has an `Admin` role.

---

### 2. Request Body

-   **Format:** `application/json`

#### Body Structure & Fields:

```json
{
  "name": "John Doe",
  "email": "john.doe@pardee.com",
  "department": "Engineering",
  "role": "employee",
  "password": "a_plain_text_password",
  "status": "Active"
}
```

| Field        | Type     | Required | Description                                                              |
|--------------|----------|----------|--------------------------------------------------------------------------|
| `name`       | `string` | Yes      | The full name of the new user.                                           |
| `email`      | `string` | Yes      | The user's email address. Must be unique in the `users` table.           |
| `department` | `string` | Yes      | The department the user belongs to.                                      |
| `role`       | `string` | Yes      | The user's role. Must be one of: `'employee'`, `'admin'`, or `'hr'`.      |
| `password`   | `string` | Yes      | The user's initial password in **plain text**.                           |
| `status`     | `string` | Yes      | The initial status of the user. The frontend sends `'Active'`.           |

---

### 3. Detailed Field Handling

#### Q: How is the password being handled on the frontend?

**A:** The password is sent from the frontend as **plain text** within the JSON request body. The application must be served over HTTPS to ensure this request is encrypted in transit. The backend is responsible for immediately hashing the plain-text password using a strong, salted hashing algorithm (e.g., bcrypt) before storing the hash in the `users` table.

---

#### Q: How is the role assigned?

**A:** The role is explicitly included in the request payload from the frontend. The administrator performing the creation selects the user's role from a dropdown menu. Since this endpoint is protected and only accessible by admins, the backend can trust the `role` value provided in the payload.

---

#### Q: Is fingerprint data captured at registration?

**A:** **No.** Biometric (fingerprint/face) data is **not** captured by the administrator during the user creation process.

Biometric registration is a separate, security-sensitive step that must be initiated by the users themselves after they have logged into their own accounts for the first time (via the "My Profile" page).

---

#### Q: Any other required fields we should know about?

**A:** The fields listed in the table above (`name`, `email`, `department`, `role`, `password`, `status`) are the only ones sent by the frontend during user creation. There are no other fields like phone number or staff ID included in the current implementation.
