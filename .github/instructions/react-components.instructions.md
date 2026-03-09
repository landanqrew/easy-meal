---
applyTo: "packages/web/src/**/*.tsx"
excludeAgent: "coding-agent"
---

# React Component Review Rules

## Component Patterns

- UI primitive components must use `React.forwardRef()` with proper generics
- Components using forwardRef must set `displayName`
- Use Radix UI primitives for accessible interactive elements (Dialog, Popover, etc.)
- Prefer `cn()` utility for conditional Tailwind class merging

## forwardRef Example

```tsx
// Good
const Input = React.forwardRef<
  React.ElementRef<'input'>,
  React.ComponentProps<'input'>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('...', className)} {...props} />
))
Input.displayName = 'Input'

// Bad — breaks ref forwarding
const Input = ({ className, ...props }: React.ComponentProps<'input'>) => (
  <input className={cn('...', className)} {...props} />
)
```

## State and Data

- Use TanStack Router for route params and search params — not React state
- API data fetching should use typed client functions, not raw fetch
- Avoid prop drilling more than 2 levels — use context or composition

## Accessibility

- Interactive elements must be keyboard accessible
- Images must have alt text
- Form inputs must have associated labels
- Flag click handlers on non-interactive elements (div, span) without role/tabIndex
