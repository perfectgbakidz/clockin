# Backend Guide: Admin, HR & Profile Features

This document details the backend implementation for features accessible to Administrators, HR personnel, and for general user profile management. All endpoints described here must be protected by role-based access control (RBAC) middleware that validates the user's JWT.

## Table of Contents
1. [Admin Dashboard](#1-admin-dashboard)
2. [Attendance Logs (Admin & HR)](#2-attendance-logs-admin--hr)
3. [Reports (Admin & HR)](#3-reports-admin--hr)
4. [Profile Management (All Roles)](#4-profile-management-all-roles)

---

## 1. Admin Dashboard

This section provides the data needed to populate the statistical cards on the Admin Dashboard.

### `GET /api/admin/dashboard`
-   **Protection:** `Admin` role required.
-   **Description:** Fetches aggregated attendance and employee statistics for the current day.
-   **Logic:**
    1.  **Get Total Active Employees**:
        -   `SELECT COUNT(*) FROM users WHERE status = 'Active';`
    2.  **Get Present Employees Today**:
        -   `SELECT COUNT(DISTINCT user_id) FROM attendance_records WHERE date = CURRENT_DATE;`
    3.  **Get Late Arrivals Today**:
        -   `SELECT COUNT(*) FROM attendance_records WHERE date = CURRENT_DATE AND CAST(clock_in AS TIME) > '09:00:00';` (Assuming 9 AM is the start time).
    4.  **Calculate Absent Today**:
        -   This is calculated in the application logic: `(Total Active Employees) - (Present Employees Today)`.
-   **Success Response (200 OK):**
    ```json
    {
      "totalEmployees": 150,
      "presentToday": 142,
      "absentToday": 8,
      "lateArrivals": 15
    }
    ```

---

## 2. Attendance Logs (Admin & HR)

This endpoint powers the page where admins and HR can view, search, and filter all employee attendance records.

### `GET /api/admin/attendance-logs`
-   **Protection:** `Admin` or `HR` role required.
-   **Description:** Retrieves a list of attendance records, with support for filtering by date and searching by employee name.
-   **Query Parameters:**
    -   `date` (optional, string `YYYY-MM-DD`): Filters records for a specific date.
    -   `search` (optional, string): Filters records where the employee's name matches the search term (case-insensitive).
-   **Logic:**
    -   Construct a base SQL query that joins `attendance_records` with `users` to get the employee's name.
      ```sql
      SELECT ar.id, ar.user_id, u.name as "userName", ar.date, ar.clock_in, ar.clock_out, ar.total_hours
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      ```
    -   Dynamically add `WHERE` clauses based on query parameters:
        -   If `date` is provided: `WHERE ar.date = :date`
        -   If `search` is provided: `WHERE u.name ILIKE :search` (e.g., `'%john doe%'`)
    -   Combine clauses with `AND` if both are present.
    -   Order the results, for instance: `ORDER BY ar.date DESC, u.name ASC`.
    -   Implement pagination (e.g., using `LIMIT` and `OFFSET`) to handle large datasets.
-   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "uuid-for-record-1",
        "userId": "uuid-for-user-1",
        "userName": "Jane Doe",
        "date": "2023-10-27",
        "clockIn": "08:55:00",
        "clockOut": "17:05:00",
        "totalHours": 8.17
      },
      {
        "id": "uuid-for-record-2",
        "userId": "uuid-for-user-2",
        "userName": "John Smith",
        "date": "2023-10-27",
        "clockIn": "09:15:00",
        "clockOut": null,
        "totalHours": null
      }
    ]
    ```

---

## 3. Reports (Admin & HR)

These endpoints provide data for the charts and downloadable CSV reports.

### `GET /api/reports/absenteeism-trends`
-   **Protection:** `Admin` or `HR` role required.
-   **Description:** Provides data for the past week to show daily present vs. absent counts.
-   **Logic:**
    1.  Get the total number of active employees.
    2.  Iterate through the last 7 days. For each day:
        -   Query `attendance_records` to count distinct users who clocked in (`presentCount`).
        -   Calculate `absentCount = totalActiveEmployees - presentCount`.
    3.  Format the data into the required JSON structure.
-   **Success Response (200 OK):**
    ```json
    [
      { "name": "Mon", "Present": 140, "Absent": 10 },
      { "name": "Tue", "Present": 145, "Absent": 5 },
      { "name": "Wed", "Present": 142, "Absent": 8 }
    ]
    ```

### `GET /api/reports/working-hours`
-   **Protection:** `Admin` or `HR` role required.
-   **Description:** Provides the average working hours per employee for the last 7 days.
-   **Logic:**
    -   For each of the last 7 days, calculate the average of the `total_hours` column from the `attendance_records` table where `total_hours` is not null.
      ```sql
      SELECT date, AVG(total_hours) as "avgHours" FROM attendance_records WHERE date >= CURRENT_DATE - INTERVAL '7 days' GROUP BY date ORDER BY date;
      ```
-   **Success Response (200 OK):**
    ```json
    [
      { "name": "Mon", "avgHours": 7.8 },
      { "name": "Tue", "avgHours": 8.1 },
      { "name": "Wed", "avgHours": 7.9 }
    ]
    ```

### `GET /api/reports/download`
-   **Protection:** `Admin` or `HR` role required.
-   **Description:** Generates and serves a CSV file of attendance records for a specified period.
-   **Query Parameter:**
    -   `type` (required, string): Either `'weekly'` or `'monthly'`.
-   **Logic:**
    1.  Determine the date range based on the `type` parameter.
    2.  Query all attendance records within that range, joining with the `users` table to get names.
    3.  Use a CSV generation library or manually construct a CSV string from the query results.
    4.  Set the HTTP response headers to trigger a file download in the browser:
        -   `Content-Type: text/csv`
        -   `Content-Disposition: attachment; filename="weekly_report.csv"` (or `monthly_report.csv`)
-   **Success Response (200 OK):** The raw text content of the CSV file.

---

## 4. Profile Management (All Roles)

These endpoints are for individual users to manage their own account settings.

### `POST /api/auth/change-password`
-   **Protection:** Any authenticated user.
-   **Description:** Allows a logged-in user to change their password.
-   **Request Body:**
    ```json
    {
      "oldPassword": "current_password",
      "newPassword": "new_secure_password"
    }
    ```
-   **Logic:**
    1.  Extract `userId` from the JWT.
    2.  Fetch the user's current `password_hash` from the `users` table.
    3.  Use a secure comparison function (e.g., from bcrypt) to verify `oldPassword` against the stored hash. If it doesn't match, return a `401 Unauthorized` error.
    4.  If it matches, hash the `newPassword` and `UPDATE` the user's `password_hash` in the database.
-   **Success Response:** `204 No Content`

### `GET /api/webauthn/registration-status`
-   **Protection:** Any authenticated user.
-   **Description:** Checks if the user has any WebAuthn credentials registered.
-   **Logic:**
    1.  Extract `userId` from the JWT.
    2.  Query the `webauthn_credentials` table: `SELECT 1 FROM webauthn_credentials WHERE user_id = :userId LIMIT 1;`
    3.  If a row is found, the user has at least one device registered.
-   **Success Response (200 OK):**
    ```json
    {
      "isRegistered": true
    }
    ```
    or `false` if no credentials are found.
