# Cardio-Sense Frontend

A React-based frontend application for S1 & S2 Heart Sound Classification using AI-powered diagnostics.

## Features

- **Role-based Authentication**: Patient, Doctor, and Researcher signup/login
- **PCG Upload & Analysis**: Upload heart sound recordings and view AI-powered analysis results
- **Role-specific Dashboards**: Customized dashboards for each user role
- **OTP Verification**: Two-factor authentication support
- **Profile Management**: View and edit user profiles
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **MSW (Mock Service Worker)** - API mocking for development
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities

## Getting Started

### Prerequisites

- Node.js (v20.19.0 or >=22.12.0 recommended)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

See the original frontend README for full structure and details.
