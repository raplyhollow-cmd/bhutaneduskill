# Career Guidance Platform - Design System Architecture

## Overview
This design system provides a centralized, modular approach to styling and components. Change anything from here and it updates everywhere.

## Directory Structure

```
src/design-system/
├── tokens/           # Design tokens (colors, spacing, typography)
├── components/       # Reusable UI components
├── patterns/         # Reusable design patterns
└── templates/        # Page templates
```

## Usage
Import anything from the design system:
```tsx
import { colors, spacing } from "@/design-system/tokens";
import { Button, Card } from "@/design-system/components";
```
