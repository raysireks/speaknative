import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            SpeakNative
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Modern Enterprise-Level Application Framework
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">
              Welcome to Your Application
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This is a modern, enterprise-level application built with the latest stable
              technologies for 2026:
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>React 19</strong> - The latest version of React with improved
                  performance and features
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>TypeScript</strong> - Type-safe development for better code quality
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Vite</strong> - Lightning-fast build tool and dev server
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Tailwind CSS</strong> - Modern utility-first CSS framework
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Vitest</strong> - Fast unit testing with modern features
                </span>
              </li>
            </ul>

            <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Interactive Counter Demo
              </h3>
              <button
                onClick={() => setCount((count) => count + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Count is {count}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                Click the button to test React state management
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                📚 Documentation
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Learn how to customize and extend this application.
              </p>
              <a
                href="https://react.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                React Documentation →
              </a>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                🚀 Deploy
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This app is configured for GitHub Pages deployment.
              </p>
              <a
                href="https://pages.github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                GitHub Pages Guide →
              </a>
            </div>
          </div>
        </main>

        <footer className="text-center mt-16 text-gray-600 dark:text-gray-400">
          <p>Built with modern technologies for enterprise-level applications</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
