# Frontend Application

## Overview

This is the frontend application for the **Trinetra Security Platform**, built with modern web technologies to deliver a seamless, responsive, and interactive user experience. It serves as the user interface for accessing security modules, learning resources, and real-time analytics.

---

## Features

### 🔐 Core Functionality
- **Responsive Design** – Optimized for both desktop and mobile devices
- **Authentication** – Secure login, signup, and user session management
- **Dashboard** – Visual overview of security tools and system metrics
- **Security Tools** – Integrated scanners and utilities for various security analyses
- **Learning Center** – In-depth tutorials and educational resources

---

## Tech Stack

### 🧩 Frontend Technologies
- **Framework**: React 18 with TypeScript
- **State Management**: React Context API
- **Routing**: React Router v6
- **UI Components**: Radix UI Primitives
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Authentication**: Supabase Auth
- **Icons**: Lucide Icons

---

## Getting Started

### ⚙️ Prerequisites
- Node.js **v18+**
- npm or yarn

### 🚀 Installation

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

---

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── layouts/        # Page layouts (MainLayout, AuthLayout, etc.)
│   ├── navigation/     # Navbar, Sidebar, MegaMenu, etc.
│   └── ui/             # Low-level UI building blocks
├── context/            # Global React context providers
├── lib/                # Utility functions and shared services
├── pages/              # Route-based page components
│   ├── admin/          # Admin interface pages
│   ├── auth/           # Login, Register, Forgot Password, etc.
│   ├── learn/          # Learning Center: tutorials, docs, etc.
│   └── [module]/       # Security modules (e.g., File Scan, DDoS Shield)
└── types/              # Global TypeScript interfaces and types
```

---

## Development

### 📦 Available Scripts

| Script       | Description                     |
|--------------|---------------------------------|
| `dev`        | Start development server        |
| `build`      | Build the app for production    |
| `preview`    | Preview the production build    |
| `test`       | Run unit tests                  |
| `lint`       | Lint the code using ESLint      |
| `format`     | Format code with Prettier       |

### 🧼 Code Style & Standards
- Follows [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- TypeScript strict mode is enabled
- ESLint + Prettier configured for code quality and consistency

---

## License

This project is licensed under the **MIT License**. Feel free to use and modify it as needed.

---

> 💡 Built with ❤️ by the TrinetraSec Team – empowering security through innovation.
