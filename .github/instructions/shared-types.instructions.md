---
applyTo: "packages/shared/src/**/*.ts"
excludeAgent: "coding-agent"
---

# Shared Package Review Rules

## Schema Conventions

- Every exported type must have a corresponding Zod schema
- Schema names use PascalCase with `Schema` suffix: `ProjectSchema`, `CreateProjectSchema`
- Inferred types drop the suffix: `type Project = z.infer<typeof ProjectSchema>`
- Input schemas (create/update) should be separate from output schemas

## Example

```ts
// Good
export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

// Bad — no schema, type-only
export type CreateProjectInput = {
  name: string
  description?: string
}
```

## Export Rules

- All public types and schemas must be re-exported from `index.ts`
- Use `.js` extension in relative imports (ESM resolution)
- Never import from other packages — shared must have zero internal dependencies

## Breaking Changes

- Flag removal or renaming of exported types/schemas — these break consumers
- Flag changes to schema shape that would invalidate existing API responses
- Adding optional fields is safe; making fields required is breaking
