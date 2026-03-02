# Design System Architecture Diagram

## Current State (Fragmented)

```
                         ┌─────────────────────────────────────┐
                         │     Bhutan EduSkill Platform        │
                         └─────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
│  Legacy ui/      │              │   New ui-next/   │              │  Design Tokens  │
│  Components      │              │   Components     │              │  (UNUSED!)       │
├──────────────────┤              ├──────────────────┤              ├──────────────────┤
│ • 32 components  │              │ • 6 components   │              │ • 800+ lines    │
│ • CSS variables  │              │ • RGB values     │              │ • Full system   │
│ • Tailwind       │              │ • Tailwind       │              │ • Not imported  │
│ • In production  │              │ • Unused         │              │                 │
└──────────────────┘              └──────────────────┘              └──────────────────┘
        │                                     │                                     │
        │                                     │                                     │
        └─────────────────────────────────────┼─────────────────────────────────────┘
                                              │
                                              ▼
                                ┌─────────────────────────────────┐
                                │    Portal Pages (90+ files)      │
                                ├─────────────────────────────────┤
                                │ • Mixed component imports        │
                                │ • Inconsistent styling          │
                                │ • Manual inline styles          │
                                └─────────────────────────────────┘
```

## Desired State (Unified)

```
                         ┌─────────────────────────────────────┐
                         │     Bhutan EduSkill Platform        │
                         └─────────────────────────────────────┘
                                              │
                                              ▼
                                ┌─────────────────────────────────┐
                                │      DESIGN TOKENS SYSTEM       │
                                ├─────────────────────────────────┤
                                │ • CSS variables (globals.css)   │
                                │ • TS utilities (lib/utils)      │
                                │ • Single source of truth        │
                                └─────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
        │   ui/ components │      │  ui-next/ merge  │      │  Layout System   │
        ├──────────────────┤      ├──────────────────┤      ├──────────────────┤
        │ • Deprecated     │      │ • Primary system │      │ • PageContainer  │
        │ • Phased out     │      │ • Token-based   │      │ • PageHeader     │
        │                 │      │ • 10+ components │      │ • EmptyState     │
        └──────────────────┘      └──────────────────┘      └──────────────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                              ▼
                                ┌─────────────────────────────────┐
                                │    Portal Pages (90+ files)      │
                                ├─────────────────────────────────┤
                                │ • Consistent components          │
                                │ • Token-based styling           │
                                │ • Layout system adopted         │
                                └─────────────────────────────────┘
```

## Migration Path

```
CURRENT ──► PHASE 1 ──► PHASE 2 ──► PHASE 3 ──► PHASE 4 ──► PHASE 5 ──► PHASE 6 ──► FUTURE
(State)   (Tokens)    (Components) (Layouts)   (Cleanup)   (Polish)    (Innovation)

  │           │            │           │           │           │            │
  │           │            │           │           │           │            │
  ▼           ▼            ▼           ▼           ▼           ▼            ▼
3 systems   CSS export   Badge       PageContainer  No         Standard    Command
merged      utilities    Input       PageHeader    gradients  timings     Palette
            Toast        Button      EmptyState    Consistent  Easing      Progressive
            provider     Card        Adopted       radius     springs     Forms
                                      Table         spacing                In-place
                                      Dropdown                                  Editor
```

## Component Mapping

```
LEGACY (ui/)           NEW (ui-next/)        STATUS
─────────────────      ─────────────────      ───────
button.tsx      ──►    button-next.tsx        Replace
card.tsx        ──►    card-next.tsx          Replace
input.tsx       ──►    input-next.tsx         Replace
badge.tsx       ──►    badge-next.tsx         Replace
dropdown-menu   ──►    dropdown-next.tsx      Replace
table.tsx       ──►    table-next.tsx         Replace
─────────────────      ─────────────────      ───────
checkbox.tsx           (create new)           Future
radio-group.tsx         (create new)           Future
select.tsx              (create new)           Future
switch.tsx              (create new)           Future
```

## Timeline Visualization

```
Week 1  ████ Foundation
Week 2  ██████ Component Migration (Badge, Input)
Week 3  ██████ Component Migration (Button, Card)
Week 4  ████ Layout Adoption
Week 5  ████ Styling Cleanup
Week 6  ████ Animation Polish
Week 7  ██ Workflow Innovation Planning
Week 8  ██ Command Palette + Intelligent Input
Week 9  ██ Progressive Forms + In-Place Editor
Week 10 ██ Testing + Documentation
```

## Risk Assessment

```
IMPACT LEVEL:
███ HIGH   │ Component migration, Layout adoption
██░ MEDIUM │ Styling cleanup, Animation polish
█░░ LOW    │ Foundation, Documentation

EFFORT LEVEL:
███ HIGH   │ Component migration (80+ files)
██░ MEDIUM │ Layout adoption (90+ pages)
█░░ LOW    │ Token system, Toast provider

RISK SCORE: MEDIUM-HIGH
Mitigation: Incremental rollout, feature flags, testing
```
