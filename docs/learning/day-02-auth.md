# Day 2 - Auth

## Goal

Understand register/login, JWT creation, token storage, and protected routes.

## Learn These Ideas

- Password hash: store hash, never raw password.
- JWT: signed token that carries user identity.
- Guard: NestJS gate that blocks unauthenticated requests.
- Protected route: React route hidden when no token exists.

## Files To Open

- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/auth.service.ts`
- `apps/backend/src/auth/strategies/jwt.strategy.ts`
- `apps/backend/src/auth/guards/jwt-auth.guard.ts`
- `apps/backend/src/auth/decorators/current-user.decorator.ts`
- `apps/frontend/src/api/auth.ts`
- `apps/frontend/src/stores/auth.ts`
- `apps/frontend/src/components/ProtectedRoute.tsx`

## What To Trace

Register:

```text
Login page -> useRegister -> POST /api/auth/register
-> AuthController.register -> AuthService.register
-> UsersService.create -> bcrypt.hash -> JwtService.sign
-> frontend stores accessToken
```

Login:

```text
Login page -> useLogin -> POST /api/auth/login
-> AuthService.login -> bcrypt.compare -> JwtService.sign
```

Protected API:

```text
Axios token header -> JwtAuthGuard -> JwtStrategy.validate
-> @CurrentUser -> controller receives user.userId
```

## Commands

```powershell
bun --cwd apps/backend test -- auth.service.spec.ts
bun --cwd apps/frontend test -- auth.test.tsx
```

## Check Your Understanding

Answer:

1. Where is password hashed?
2. What does JWT payload contain?
3. Why do controllers use `@CurrentUser()` instead of trusting request body?
4. What happens on frontend when token is missing?

## Common Mistake

Do not think JWT means user is permanently trusted. Backend validates token on
each protected request.

