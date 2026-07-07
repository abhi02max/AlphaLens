# Legacy Authentication Architecture

This project was originally built using a custom JSON Web Token (JWT) based authentication system. 

The custom system included:
1. `src/legacy/auth/auth.controller.js`: Handled register, login, refresh, and logout logic.
2. `src/legacy/auth/auth.service.js`: Managed JWT signing, bcrypt hashing, and cookie generation.
3. `src/legacy/auth/auth.routes.js`: Exposing the authentication endpoints.
4. `frontend/src/legacy/auth/AuthContext.jsx`: A React Context provider that managed global authentication state and a silent refresh interval.
5. `frontend/src/legacy/auth/Login.jsx` & `Register.jsx`: Custom UI components for authentication.

## Why it was replaced

While the custom JWT system demonstrated a deep understanding of stateless authentication, cookie management, and secure password hashing, we upgraded to **Clerk** for production deployment for several reasons:

1. **Security**: Clerk handles complex security requirements like multi-factor authentication (MFA), compromised password protection, and bot detection out of the box.
2. **Maintenance**: Maintaining an internal `AuthContext` with a silent refresh loop led to intermittent flickering and infinite loop bugs when tokens expired ungracefully or cookies were blocked. Clerk's React SDK completely eliminates these issues.
3. **Enterprise Standard**: Moving to a dedicated Identity Provider (IdP) is an enterprise best practice, offloading the risk of storing sensitive passwords (even hashed) from our internal MongoDB.

The legacy files are retained in the `legacy/` directories strictly for educational purposes, interview discussions, and to demonstrate architectural knowledge.
