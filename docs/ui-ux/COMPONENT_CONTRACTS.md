# Component contracts (UI handoff)

## Ownership

- UI/UX edits **only** `frontend/components/` on `feat/ui-design-system`.
- Project owner must **not** modify `frontend/components/`; import components into `frontend/app/` and `frontend/features/` instead.
- See [../development/TEAM_OWNERSHIP.md](../development/TEAM_OWNERSHIP.md).

For each shared or feature component, provide:

1. Figma frame/link or screenshots
2. MUI component names and props
3. Expected props, callbacks, and state
4. Loading / empty / error / success states
5. Responsive behavior
6. Required icons/assets and licenses
7. A minimal usage example
8. Files intended to be touched

Do not invent API response fields in UI mockups without marking them as placeholders.
Do not create a second design system or introduce Tailwind.
