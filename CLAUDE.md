# CLAUDE.md - Agent Instructions

## Build & Test Commands
- Build: `npm run build` or `yarn build`
- Dev mode: `npm run dev` or `yarn dev`
- Lint: `npm run lint` or `yarn lint`
- Typecheck: `npm run typecheck` or `yarn typecheck`
- Test (all): `npm run test` or `yarn test`
- Test (single): `npm run test -- -t "test name"` or `yarn test -t "test name"`

## Code Style Guidelines
- **Framework**: React with TypeScript
- **Formatting**: Prettier with 2-space indentation
- **Imports**: Group imports by: 1) React/framework 2) External libraries 3) Internal modules
- **Types**: Use TypeScript interfaces for objects, type for unions/aliases
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Error handling**: Try/catch with proper error propagation, avoid silent failures
- **State management**: Use React hooks for local state, context for shared state
- **Components**: Functional components with hooks, avoid class components
- **Comments**: JSDoc for public APIs, inline comments for complex logic only

Last updated: 2025-03-11