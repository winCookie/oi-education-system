# OI Interactive Teaching System (OI 互动教学系统)

## Project Overview

The **OI Interactive Teaching System** is a comprehensive web platform designed for Olympiad in Informatics (OI) training. It features interactive learning tools such as a knowledge tree, dynamic segment tree visualization, and algorithm execution traceback. The system also includes user management for teachers and students, supporting permissions and progress tracking.

## Technology Stack

### Frontend
*   **Framework:** React 19
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS, PostCSS
*   **Visualization:** D3.js, Chart.js
*   **Icons:** Lucide React, FontAwesome
*   **State/Logic:** React Router DOM, React Hook Form, Zod
*   **Markdown/Math:** React Markdown, KaTeX, React Syntax Highlighter

### Backend
*   **Framework:** NestJS 11
*   **Database ORM:** TypeORM
*   **Database:** PostgreSQL 15
*   **Authentication:** Passport, JWT, Argon2
*   **Media Processing:** Fluent-ffmpeg
*   **Testing:** Jest

### Infrastructure
*   **Containerization:** Docker, Docker Compose
*   **Server:** Nginx (inferred from README deployment notes)

## Getting Started (Local Development)

### Prerequisites
*   Node.js
*   Docker & Docker Compose

### 1. Start Database
Run the PostgreSQL database using Docker Compose:
```bash
docker-compose up db -d
```

### 2. Backend Setup
Open a new terminal for the backend:
```bash
cd backend
npm install
# Start in development mode
npm run start:dev
```
**Initial Setup:** Run the seed script to create a default teacher account (`teacher01` / `password123`):
```bash
npm run seed
```

### 3. Frontend Setup
Open a new terminal for the frontend:
```bash
cd frontend
npm install
# Start the development server
npm run dev
```

## Key Commands

### Backend (`/backend`)
| Command | Description |
| :--- | :--- |
| `npm run start:dev` | Start the application in development mode with watch. |
| `npm run build` | Build the application for production. |
| `npm run test` | Run unit tests using Jest. |
| `npm run test:e2e` | Run end-to-end tests. |
| `npm run format` | Format code using Prettier. |
| `npm run lint` | Lint code using ESLint. |
| `npm run seed` | Seed the database with initial data. |

### Frontend (`/frontend`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the development server. |
| `npm run build` | Build the application for production. |
| `npm run lint` | Lint code using ESLint. |
| `npm run preview` | Preview the production build locally. |

### Docker (Root)
| Command | Description |
| :--- | :--- |
| `docker-compose up db -d` | Start only the database service in the background. |
| `docker-compose up -d --build` | Build and start all services (Full Stack) in the background. |

## Project Structure

*   **`backend/`**: Contains the NestJS API application.
    *   `src/modules/`: Feature-based modules (Auth, Blog, Knowledge, Users, etc.).
    *   `src/entities/`: TypeORM entity definitions.
*   **`frontend/`**: Contains the React SPA.
    *   `src/pages/`: Application views/routes.
    *   `src/components/`: Reusable UI components.
    *   `src/api/`: API client configurations.
*   **`docker-compose.yml`**: Defines the services (db, backend, frontend) for containerized execution.

## Development Conventions

*   **Code Style:** The project uses `Prettier` and `ESLint` for enforcing code style and quality. Run `npm run format` and `npm run lint` before committing.
*   **Commits:** Follow standard git commit message conventions.
*   **Environment Variables:** Check `.env` files in `backend/` and `frontend/` (or create them based on examples) to configure environment-specific variables like database credentials and API endpoints.
