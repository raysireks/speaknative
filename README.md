# SpeakNative

A modern, enterprise-level web application built with the latest stable technologies for 2026, optimized for GitHub Pages deployment.

## 🚀 Tech Stack

This application uses cutting-edge, enterprise-ready technologies:

- **[React 19](https://react.dev)** - Latest version with improved performance and features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development for better code quality
- **[Vite](https://vite.dev)** - Lightning-fast build tool and development server
- **[Tailwind CSS](https://tailwindcss.com/)** - Modern utility-first CSS framework
- **[Vitest](https://vitest.dev/)** - Fast unit testing framework with modern features
- **[ESLint](https://eslint.org/)** - Code quality and consistency
- **[Prettier](https://prettier.io/)** - Automatic code formatting

## 📋 Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

## 🛠️ Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/raysireks/speaknative.git
cd speaknative

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

### Building

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🌐 Deployment to GitHub Pages

This application is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Build and deployment", select "Source: GitHub Actions"
4. Push to the `main` branch, and the deployment will happen automatically

The site will be available at: `https://<username>.github.io/speaknative/`

### Manual Deployment

You can also trigger a deployment manually from the Actions tab in your GitHub repository.

## 📁 Project Structure

```
speaknative/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/                     # Static assets
├── src/
│   ├── assets/                # Images, fonts, etc.
│   ├── test/
│   │   └── setup.ts           # Test configuration
│   ├── App.tsx                # Main application component
│   ├── App.test.tsx           # App component tests
│   ├── index.css              # Global styles with Tailwind
│   └── main.tsx               # Application entry point
├── .prettierrc                # Prettier configuration
├── eslint.config.js           # ESLint configuration
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.app.json          # TypeScript app configuration
├── tsconfig.node.json         # TypeScript Node configuration
└── vite.config.ts             # Vite configuration
```

## 🧩 Key Features

### Modern React Patterns
- Functional components with hooks
- TypeScript for type safety
- Modern state management

### Responsive Design
- Mobile-first approach
- Tailwind CSS utilities
- Dark mode support

### Developer Experience
- Hot Module Replacement (HMR)
- Fast builds with Vite
- Automatic code formatting
- Type checking

### Testing
- Component testing with React Testing Library
- Fast test execution with Vitest
- Code coverage reports

### CI/CD
- Automated linting and testing
- Automatic deployment to GitHub Pages
- Build caching for faster workflows

## 📝 Customization

### Changing the Base URL

If you fork this repository or change the repository name, update the `base` property in `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
});
```

### Styling

This project uses Tailwind CSS. You can customize the theme in `tailwind.config.js`:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        // Add your custom colors
      },
    },
  },
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vite.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Powered by [React](https://react.dev)
