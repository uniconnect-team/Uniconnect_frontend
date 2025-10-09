# Uniconnect Frontend

A mobile-first React + TypeScript client for the Uniconnect platform. The UI is inspired by the supplied Figma screens and integrates with the Uniconnect backend API.

## Getting Started

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:5173](http://localhost:5173) by default.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=http://127.0.0.1:8000
```

## Project Structure

- `/src/app` – Application layout and routing
- `/src/components` – Reusable UI components (icons, form fields)
- `/src/features/auth` – Authentication-related screens (role select, login, signup)
- `/src/features/home` – Placeholder home screen
- `/src/lib` – API utilities, shared types, and validators
- `/src/styles` – Design tokens and styling helpers

## Routes

- `/` – Role selection
- `/login/seeker` – Dormitory seeker login
- `/login/owner` – Dormitory owner login
- `/signup` – Account registration
- `/home` – Placeholder home screen after authentication
