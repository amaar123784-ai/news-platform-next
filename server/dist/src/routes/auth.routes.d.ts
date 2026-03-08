/**
 * Auth Routes
 *
 * Security hardening (S1, S3, S15):
 *   - Access token is set as HttpOnly, Secure, SameSite=Strict cookie
 *   - Refresh token is ALSO set as HttpOnly cookie (never exposed in response body)
 *   - Refresh token is ALWAYS hashed with SHA-256 before being stored in DB
 *   - /refresh reads the refresh token from its HttpOnly cookie, so JavaScript
 *     can never access it (XSS-proof)
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=auth.routes.d.ts.map