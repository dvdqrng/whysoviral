# Project Structure

This project follows React best practices for organization and structure:

## Directory Structure

- `components/` - React components
  - `ui/` - UI components (buttons, cards, inputs, etc.)
  - `layout/` - Layout components (header, sidebar, navigation, etc.)
  - `features/` - Feature-specific components

- `hooks/` - Custom React hooks

- `services/` - Service modules for API interaction and business logic

- `utils/` - Utility functions and helpers

- `contexts/` - React contexts

- `types/` - TypeScript type definitions

- `lib/` - Internal libraries
  - `supabase/` - Supabase client configuration

- `config/` - Application configuration

## Importing Components

Each directory has an `index.ts` file to re-export its contents, allowing for cleaner imports:

```typescript
// Instead of:
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// You can do:
import { Button, Card } from "@/components/ui";
```

## Naming Conventions

- Component files use kebab-case: `feature-name.tsx`
- Component names use PascalCase: `FeatureName`
- Utility/hook files use kebab-case: `use-feature.ts`
- Hook names use camelCase: `useFeature` 