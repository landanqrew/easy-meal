---
applyTo: "packages/api/src/**/*.ts"
excludeAgent: "coding-agent"
---

# API Route Review Rules

## Route Structure

- Routes must be modular Hono instances typed with `AuthEnv`
- Protected routes must apply `requireAuth` middleware via `.use("*", requireAuth)`
- User context is accessed via `c.get("user")` — never parse auth headers manually

## Request Validation

- All request bodies must be validated with Zod `safeParse()` before use
- Return 400 with `{ success: false, error: { message } }` on validation failure
- Never trust `c.req.json()` output without schema validation

## Response Format

All responses must follow this shape:

```ts
// Success
c.json({ success: true, data: T })
// or with status
c.json({ success: true, data: T }, 201)

// Error
c.json({ success: false, error: { message: string, code?: string } }, 4xx)
```

## Drizzle Error Handling

Database operations should handle errors gracefully via Hono's error handling:

```ts
// Good — check query results, return appropriate status
const result = await db.query.recipes.findFirst({
  where: and(eq(recipes.id, id), eq(recipes.householdId, householdId)),
})
if (!result) {
  return c.json({ success: false, error: { message: 'Not found' } }, 404)
}

// Good — let unexpected errors propagate to the global error handler
// (don't wrap every query in try/catch)

// Good — catch specific cases when needed
try {
  await db.insert(table).values(data)
} catch (e: unknown) {
  if (e instanceof Error && e.message.includes('unique constraint')) {
    return c.json({ success: false, error: { message: 'Already exists' } }, 409)
  }
  throw e
}

// Bad — swallows all errors
catch (e) {
  return c.json({ success: false, error: { message: 'Error' } }, 500)
}
```
