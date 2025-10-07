# LX Notes - Production Notes Manager

## Project Overview

LX Notes is a collaborative lighting and production notes management system for theatrical teams. It is a Next.js application written in TypeScript and styled with Tailwind CSS. The application is designed to be used in a dark environment, such as a theater.

The application is divided into three core modules:

*   **Cue Notes**: Manage lighting cues and effects.
*   **Work Notes**: Track equipment and technical tasks.
*   **Production Notes**: Cross-department communication.

The application uses Zustand for state management, with a modular store structure. Data is currently mocked, with plans to integrate with Supabase for a persistent database. End-to-end testing is set up with Playwright.

## Building and Running

### Development

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:3001`.

### Production

To build the application for production, run:

```bash
npm run build
```

To start the production server, run:

```bash
npm start
```

### Testing

To run the end-to-end tests, use one of the following commands:

```bash
# Run all tests
npm run test:e2e

# Run tests in headed mode
npm run test:e2e:headed

# Run tests in UI mode
npm run test:e2e:ui

# View the test report
npm run test:report
```

## Development Conventions

*   **Styling**: The project uses Tailwind CSS for styling. The color palette and other design tokens are defined in `tailwind.config.ts`. The application is designed to be dark by default.
*   **State Management**: The project uses Zustand for state management. The stores are located in the `lib/stores` directory.
*   **Testing**: The project uses Playwright for end-to-end testing. The tests are located in the `tests` directory.
*   **Linting**: The project uses ESLint for linting. The configuration is in `.eslintrc.json`. To run the linter, use `npm run lint`.
*   **Typescript**: The project is written in TypeScript. The configuration is in `tsconfig.json`.

## Key Files

*   `README.md`: The main README file for the project.
*   `package.json`: The project's dependencies and scripts.
*   `next.config.mjs`: The Next.js configuration file.
*   `tailwind.config.ts`: The Tailwind CSS configuration file.
*   `tsconfig.json`: The TypeScript configuration file.
*   `playwright.config.ts`: The Playwright configuration file.
*   `app/`: The main application directory, following the Next.js App Router structure.
*   `components/`: The React components used in the application.
*   `lib/`: Utility functions, services, and stores.
*   `tests/`: The end-to-end tests.

## Usage

The application is currently running in development mode with mock data. To use the application, open your browser and navigate to `http://localhost:3001`.

The main features of the application are:

*   **Quick Add**: Fast note creation for each module.
*   **Status Tracking**: Todo, Complete, Cancelled states.
*   **Priority Levels**: High, Medium, Low priorities with visual indicators.
*   **Search & Filter**: Find notes quickly across modules.
*   **Dark Mode**: Optimized for theater environments.
*   **Responsive Design**: Works on desktop and tablets.
