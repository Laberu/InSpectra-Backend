## Base URL
```http://localhost:3000/api/auth```

## Endpoints

### User Registration
**POST /signup**
Creates a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Responses:

* 200 OK: User created successfully.
* 500 Internal Server Error: User already exists or other error.

### User Login

**POST /signin**
Logs in a user and issues tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
Responses:

* 200 OK: Tokens created and sent via cookies.
* 500 Internal Server Error: User doesn't exist or incorrect password.

### Google OAuth Login
**GET /google**
Initiates Google OAuth login.

**GET /google/callback**
Handles Google OAuth callback.

Responses:

* Redirects to frontend with access token, user ID, and email.
* 500 Internal Server Error: OAuth process failed.

### Token Refresh
**POST /**
Refreshes access and refresh tokens.

**Cookies:**

refreshtoken: User refresh token.
**Responses:**

* 200 OK: Tokens refreshed successfully.
* 500 Internal Server Error: Invalid or missing token.

### Protected Route
**GET /protected**
Accesses a protected route (requires authentication).

**Responses:**

* 200 OK: Access granted.
* 500 Internal Server Error: Not logged in or error.

### User Logout
**POST /logout**
Clears authentication cookies.

**Responses:**

* 200 OK: Logged out successfully.

### Password Reset Request
**POST /send-password-reset-email**
Sends a password reset link via email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```
**Responses:**

* 200 OK: Reset link sent.
* 500 Internal Server Error: User not found or email error.

### Password Reset
**POST /reset-password/:id/:token**
Resets the user password.

**Request Body:**
```json
{
  "newPassword": "newSecurePassword123"
}
```
**Responses:**

* 200 OK: Password reset successfully.
* 500 Internal Server Error: Invalid token or user not found.


