# GitHub Copilot Instructions for SpeakNative

## Project Overview

SpeakNative is a modern web application built with React 19, TypeScript, Vite, and Tailwind CSS. It's designed for GitHub Pages deployment and follows modern enterprise-level development practices.

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 with PostCSS
- **Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint 9 with TypeScript ESLint, Prettier 3

## Coding Style and Formatting

### Prettier Configuration
- Use **single quotes** for strings
- Use **semicolons** at the end of statements
- Tab width: **2 spaces**
- Trailing commas: **ES5 style**
- Max line width: **100 characters**
- Always run `npm run format` before committing code

### ESLint Rules
- Follow recommended ESLint, TypeScript, React Hooks, and React Refresh rules
- ECMAScript version: **2020**
- Target environment: **browser**
- All TypeScript files should use `.ts` or `.tsx` extensions

## TypeScript Best Practices

- Always use TypeScript for all new files (`.ts` for utilities, `.tsx` for components)
- Use proper type annotations for function parameters and return types
- Avoid using `any` type; use `unknown` or specific types instead
- Enable strict type checking
- Use interfaces for object types when defining component props

## React Development Guidelines

### Component Structure
- Use **functional components** with hooks (no class components)
- Follow React 19 best practices and patterns
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

### File Naming
- Components: PascalCase (e.g., `Landing.tsx`, `App.tsx`)
- Tests: Match component name with `.test.tsx` suffix (e.g., `Landing.test.tsx`)
- Utilities and hooks: camelCase (e.g., `useLocalStorage.ts`)

### Component Props
- Always define prop types using TypeScript interfaces
- Use destructuring for props in function parameters

## Testing Requirements

### Test Framework
- Use **Vitest** for all tests
- Use **React Testing Library** for component testing
- Use **@testing-library/jest-dom** matchers for assertions

### Test Standards
- Write tests for all new components
- Follow the Arrange-Act-Assert pattern
- Use `describe` blocks to group related tests
- Use meaningful test descriptions
- Test user interactions and behavior, not implementation details
- Place test files alongside the components they test
- Run `npm test` to run tests in watch mode
- Run `npm run test:run` for CI/CD environments

### Test Example Pattern
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('should render expected content', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Build and Development Commands

### Development
- `npm run dev` - Start development server (http://localhost:5173/)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- Always run linting and formatting before committing

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once (for CI)
- `npm run test:ui` - Run tests with UI interface

## Project Structure

```
speaknative/
├── .github/
│   ├── workflows/          # GitHub Actions CI/CD
│   └── copilot-instructions.md  # This file
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── test/              # Test configuration
│   │   └── setup.ts       # Vitest setup file
│   ├── *.tsx              # React components
│   ├── *.test.tsx         # Component tests
│   ├── index.css          # Global styles with Tailwind
│   └── main.tsx           # Application entry point
├── dist/                  # Build output (ignored in git)
└── [config files]         # Various configuration files
```

## Tailwind CSS Guidelines

- Use Tailwind utility classes for styling
- Follow mobile-first responsive design approach
- Use Tailwind's design tokens (colors, spacing, etc.)
- Avoid inline styles; prefer Tailwind classes
- Use the Prettier Tailwind plugin for automatic class sorting
- Reference `tailwind.config.js` for custom theme extensions

## Security Best Practices

### Input Validation
- Always validate and sanitize user inputs
- Use TypeScript's type system for compile-time validation
- Never trust client-side data

### Dependencies
- Keep dependencies up to date
- Review security advisories before adding new packages
- Use `npm audit` to check for vulnerabilities
- Only add dependencies when absolutely necessary

### Secrets and Credentials
- Never commit API keys, tokens, or passwords
- Use environment variables for sensitive configuration
- Keep `.env` files out of version control

## Git and Version Control

### Branch Protection
- Main branch is protected
- All changes must go through pull requests
- GitHub Pages deploys automatically from the `main` branch

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb (e.g., "Add", "Fix", "Update", "Remove")
- Keep the first line under 72 characters

## GitHub Pages Deployment

- Base URL is configured as `/speaknative/` in `vite.config.ts`
- If the repository name changes, update the `base` property in `vite.config.ts`
- Deployment happens automatically via GitHub Actions on push to `main`
- Preview builds are created for all pull requests

## Dependency Management

### Adding Dependencies
- Only add production dependencies that are essential for runtime
- Add development tools to devDependencies
- Consider bundle size impact
- Check for existing alternatives already in the project
- Document why the dependency is needed

### Approved Ecosystem
- **React** ecosystem for UI components
- **Tailwind CSS** for styling
- **Vitest/React Testing Library** for testing
- Prefer smaller, focused libraries over large frameworks

## Documentation Standards

### Code Comments
- Write self-documenting code with clear variable and function names
- Add comments only when code intent is not obvious
- Use JSDoc style comments for complex functions
- Keep comments up to date with code changes

### README Updates
- Update README.md when making significant changes to project structure
- Keep setup instructions current
- Document any new npm scripts or commands

## AI and Copilot Usage

### Best Practices
- Always review AI-generated code before accepting
- Ensure generated code follows project conventions
- Test AI-generated code thoroughly
- Verify that generated code matches the existing style


### What to Delegate
- Boilerplate component creation
- Test file generation
- Refactoring tasks
- Bug fixes with clear reproduction steps
- Documentation updates

### What to Review Carefully
- Security-critical code
- Complex business logic
- Authentication/authorization
- Data validation and sanitization
- State management

### Deprecated Patterns
- **Do NOT use `concept_id`**: This field is being removed from the database schema. Do not try to link phrases across locales using an explicit ID string. Instead, rely on vector similarity embeddings or other mechanisms to find related phrases.


## Performance Considerations

- Keep bundle size small
- Lazy load components when appropriate
- Optimize images and assets
- Use React's built-in optimization features (memo, useMemo, useCallback)
- Monitor build output size

## Accessibility

- Target **WCAG 2.1 AA compliance** as the minimum standard
- Use semantic HTML elements (e.g., `<nav>`, `<main>`, `<article>`, `<button>`)
- Include proper ARIA labels where needed
- Provide alternative text for all images (`alt` attributes)
- Ensure keyboard navigation works for all interactive elements
- Implement proper focus management (visible focus indicators, logical tab order)
- Test with screen readers when possible
- Maintain sufficient color contrast (minimum 4.5:1 for normal text, 3:1 for large text)

## Browser Compatibility

- Target modern browsers (ES2020+)
- Test in Chrome, Firefox, Safari, and Edge
- Mobile-responsive design is required
- No IE11 support needed

## Quick Reference

### Starting Work
1. Pull latest changes: `git pull`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Run tests: `npm test`

### Before Committing
1. Run linter: `npm run lint`
2. Format code: `npm run format`
3. Run tests: `npm run test:run`
4. Build succeeds: `npm run build`

### For Pull Requests
- Ensure all tests pass
- Update documentation if needed
- Keep changes focused and minimal
- Write clear PR descriptions
- Request review from maintainers
