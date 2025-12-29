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

```
frontend/
├── public/              # Static assets
│   ├── Website Logo.png
│   └── a0007.wav       # Sample audio file
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── FileUploader.jsx
│   │   ├── OTPDialog.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/       # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/          # Page components
│   │   ├── LandingPage.jsx
│   │   ├── RoleSelection.jsx
│   │   ├── Login.jsx
│   │   ├── signup/     # Role-specific signup pages
│   │   ├── dashboards/ # Role-specific dashboards
│   │   ├── UploadPage.jsx
│   │   ├── ResultsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── services/       # API service layer
│   │   └── api.js
│   ├── utils/          # Utility functions
│   │   └── validation.js
│   ├── mocks/          # MSW mock handlers
│   │   ├── handlers.js
│   │   ├── browser.js
│   │   └── server.js
│   ├── __tests__/      # Test files
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Mock Users

The following test users are available in the mock API:

- **Doctor**: 
  - Email: `raja3.ahsan@gmail.com`
  - Password: `password123`

- **Researcher**: 
  - Email: `ahsan3.dev@gmail.com`
  - Password: `password123`

- **Patient**: 
  - Email: `ahsan3.aahmed@gmail.com`
  - Password: `password123`

## API Mocking

This project uses MSW (Mock Service Worker) to mock API endpoints during development. The mocks are automatically enabled in development mode.

### Switching to Real Backend

To connect to a real backend:

1. Create a `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=https://your-backend-api.com
```

2. The API service in `src/services/api.js` will automatically use this base URL.

3. Ensure your backend implements the API contract described in `api_contract.md`.

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# API Base URL (defaults to /api for MSW mocks)
VITE_API_BASE_URL=/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all tests pass before submitting

## License

This project is part of a Final Year Project (FYP).

