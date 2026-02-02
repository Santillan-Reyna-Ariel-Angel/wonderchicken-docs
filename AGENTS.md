# Agent Guidelines for wonderchicken-front

This document provides coding agents with essential information about this Next.js project's structure, conventions, and commands.

## Project Overview

- **Framework**: Next.js 16.1.4 with App Router
- **Language**: TypeScript 5.x (strict mode)
- **UI Library**: Material UI (MUI) v7.3.7 with Emotion
- **State Management**: Zustand 5.0.10
- **Validation**: Zod 4.3.5
- **React Version**: 19.2.3
- **Package Manager**: pnpm
- **Special Features**: React Compiler enabled

## Build, Lint, and Test Commands

### Development
```bash
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Create production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Testing
**Note**: No test framework is currently configured. When implementing tests:
- Add Jest/Vitest for unit tests
- Add Playwright/Cypress for e2e tests
- Follow naming convention: `*.test.tsx` or `*.spec.tsx`
- Place tests in `__tests__/` directories or co-located with components

### Running Single Tests (Future)
```bash
# Once testing is set up:
pnpm test <file-path>           # Run specific test file
pnpm test -- -t "test name"     # Run specific test by name
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout (must be "use client" for MUI)
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles
├── theme/                 # MUI theme configuration
│   └── theme.ts           # Theme setup
└── [future directories]
    ├── components/        # Reusable UI components
    ├── stores/           # Zustand state stores
    ├── lib/              # Utilities and helpers
    ├── types/            # TypeScript type definitions
    └── api/              # API client functions
```

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: Enabled (always type everything)
- **Target**: ES2017
- **Module Resolution**: bundler
- **Path Alias**: `@/*` maps to `./src/*`

### File Naming Conventions
- **Pages**: `page.tsx` (Next.js convention)
- **Layouts**: `layout.tsx` (Next.js convention)
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `UserTypes.ts`)
- **Config files**: kebab-case (e.g., `eslint.config.mjs`)

### Import Organization
Always organize imports in this order:
```typescript
// 1. Type imports
import type { Metadata } from "next";

// 2. External packages
import { ThemeProvider, CssBaseline } from "@mui/material";

// 3. Internal imports using @ alias
import { theme } from "@/theme/theme";

// 4. Relative imports
import "./globals.css";
```

### Import Patterns
- Use `@/` path alias for all src/ imports: `import { theme } from "@/theme/theme"`
- Prefer named exports for utilities: `export const theme = ...`
- Use default exports for page components: `export default function MainPage()`
- Use `import type` for type-only imports

### Component Conventions
```typescript
// Page components (default export)
export default function MainPage() {
  return <div>Content</div>;
}

// Reusable components (named export)
export function UserCard({ name }: { name: string }) {
  return <div>{name}</div>;
}

// Client components (when using hooks or browser APIs)
"use client";
import { useState } from "react";
```

### TypeScript Types
- Always define prop types explicitly
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `React.ReactNode` for children prop
- Use Zod for runtime validation schemas

```typescript
// Props interface
interface UserCardProps {
  name: string;
  age?: number;
  children?: React.ReactNode;
}

// Zod schema for API validation
import { z } from "zod";
const userSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
});
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile`, `MainPage`)
- **Functions**: camelCase (`getUserData`, `formatDate`)
- **Variables**: camelCase (`userName`, `isLoading`)
- **Constants**: camelCase or UPPER_SNAKE_CASE (`theme` or `API_URL`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse`)

### State Management with Zustand
When creating stores:
```typescript
// src/stores/userStore.ts
import { create } from "zustand";

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Error Handling
- Use try-catch blocks for async operations
- Create error boundaries for React components
- Log errors appropriately (consider error tracking service)
- Provide user-friendly error messages

```typescript
// API error handling example
try {
  const data = await fetchUserData();
  return data;
} catch (error) {
  console.error("Failed to fetch user data:", error);
  throw new Error("Unable to load user data. Please try again.");
}
```

### MUI Theme Usage
- Always wrap components in `ThemeProvider` (already set up in layout.tsx)
- Use theme values via `sx` prop or `styled` components
- Import components from `@mui/material`
- Use `@mui/icons-material` for icons

```typescript
import { Button, Box } from "@mui/material";
import { Add } from "@mui/icons-material";

<Button sx={{ mt: 2, color: "primary.main" }}>
  <Add /> Add Item
</Button>
```

## Important Notes

- **React Compiler**: Enabled in `next.config.ts` - avoid manual memoization
- **Client Components**: Mark with `"use client"` when using hooks or browser APIs
- **Root Layout**: Must be "use client" directive due to MUI ThemeProvider
- **Fonts**: Geist Sans and Geist Mono are pre-configured via next/font
- **ESLint**: Uses Next.js recommended config with TypeScript support

## Best Practices

1. **Always use TypeScript** - no `.jsx` or `.js` files
2. **Follow Next.js conventions** - use App Router patterns
3. **Use path aliases** - `@/` instead of relative imports for src/
4. **Type everything** - strict mode is enabled
5. **Validate external data** - use Zod for API responses
6. **Keep components small** - single responsibility principle
7. **Use MUI components** - maintain consistent UI
8. **Document complex logic** - add comments for non-obvious code
9. **Handle loading states** - use Suspense or loading.tsx files
10. **Handle errors gracefully** - use error.tsx files or error boundaries
