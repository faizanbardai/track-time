## GitHub Copilot Instructions for track-time

### Project Overview

This is a Next.js application for tracking time and events. It uses TypeScript, Tailwind CSS, several modern React libraries for UI and state management, and IndexedDB as the client-side database.

### Tech Stack

- Next.js (App Router)
- React 19
- TypeScript
- Tailwind CSS
- next-themes (for dark mode)
- react-hook-form (for forms)
- Prettier & ESLint (for code style and linting)

### Folder Structure & Conventions

- `src/app/` — App routes and pages
- `src/components/` — Shared React components
- `src/components/providers/` — Context and provider components
- `src/ui/` — Reusable UI components
- `src/lib/` — Utility functions
- Use PascalCase for component files and camelCase for functions/variables.

### Styling Guidelines

- Use Tailwind CSS utility classes for all styling.
- Custom CSS variables and theming are managed in `globals.css`.
- Use `next-themes` for dark mode; do not manually toggle theme classes.

### Component & Form Usage

- Use `react-hook-form` for all forms (see `src/app/create/page.tsx` for an example).
- Place reusable UI in `src/ui/` and providers in `src/components/providers/`.

### Prettier Guidelines

- Prettier is configured in `.prettierrc`:
  - No semicolons
  - Single quotes
  - Trailing commas
  - Print width: 80
  - Tab width: 2
  - Arrow parens: always
  - End of line: auto
- Run `npm run prettier` to check formatting and `npm run prettier:fix` to auto-format.

### ESLint Guidelines

- ESLint is configured in `eslint.config.mjs` and uses Next.js, TypeScript, and Prettier plugins.
- Key rules:
  - No unused variables
  - Prettier formatting enforced
- Run `npm run lint` or `npm run eslint` to check for lint errors, and `npm run eslint:fix` to auto-fix.

### Best Practices for Copilot

- Review all Copilot suggestions for accuracy, security, and code style.
- Do not accept suggestions that include hardcoded secrets or sensitive data.
- Prefer Copilot for utility functions, component scaffolding, and repetitive code.
- Refactor Copilot code to match project conventions.

### Prompt Examples

- "Create a new form using react-hook-form for event creation."
- "Add a dark mode toggle using next-themes."
- "Generate a reusable Button component with Tailwind CSS."

### Security & Privacy

- Never accept Copilot suggestions with API keys, passwords, or sensitive info.
- Review Copilot code for potential security vulnerabilities.

### Contribution

- If you find useful Copilot prompts or patterns, document them here for the team.
- See the main README for general contribution guidelines.
