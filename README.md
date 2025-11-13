# Ovarc Frontend Admin

## Overview

The bookstore dashboard now exposes full administrator tooling with authentication, inventory management, and a configurable data layer. The app can run against the bundled JSON fixtures (static mode), a built-in mock REST API powered by `json-server`, or an external backend by flipping a single environment flag.

## Tech Stack

- React 19 + Vite
- React Router 7
- Tailwind CSS utilities
- TanStack Table v8
- json-server (mock REST API)
- ESLint (flat config)

## Getting Started

### 1. Install dependencies

   ```bash
   npm install
   ```

### 2. Configure the runtime

Create a `.env` file in the project root (alongside `package.json`) and choose one of the following profiles:

```ini
# Use the bundled mock REST API (recommended for development)
# mock / static
VITE_API_SOURCE=mock

VITE_MOCK_API_URL=http://localhost:4000

MOCK_PORT=4000

VITE_MOCK_USER_EMAIL=admin@ovarc.io
VITE_MOCK_USER_PASSWORD=admin123

```

### 3. Run the mock API (optional but recommended)

```bash
npm run mock
```

The server boots on `http://localhost:4000` and exposes `/stores`, `/books`, `/authors`, `/inventory`, and `/login`.

### 4. Start the web app

   ```bash
   npm run dev
   ```

Visit the printed Vite URL (usually `http://localhost:5173`). Sign in with the seeded admin user:

```
Email:    admin@ovarc.io
Password: admin123
```

### Additional scripts

| Command         | Description                         |
|-----------------|-------------------------------------|
| `npm run build` | Create a production build           |
| `npm run lint`  | Run ESLint across the codebase      |

## Admin Features

- **Authentication**
  - No profile is shown until a user signs in.
  - Email/password modal backed by the mock API.
  - Sign out clears the persisted session.
  - Guests can browse data but cannot mutate inventory, stores, books, or authors (buttons are disabled with sign-in prompts).

- **Inventory Management (`/store/:id`)**
  - Tabbed view: list of books or grouped by author.
  - Search + column sorting for Book Id, Name, Pages, Author, and Price.
  - Inline price editing with optimistic UX and server persistence.
  - Delete books from the store inventory.
  - Add books via a searchable dropdown (shows up to 7 matches) with price validation.
  - Responsive layout and empty states.

- **Stores / Books / Authors**
  - Unified table experience with search, pagination, and sorting.
  - Inline editing backed by the API.
  - Creation & deletion modals with validation and loading guards.
  - Store deletion also clears linked inventory entries.

- **Data Layer**
  - Centralised API client with environment-driven routing.
  - Global library context keeps stores/books/authors/inventory in sync across pages.
  - Graceful fallback to static JSON data when write operations are disabled.

- **Responsive Shell**
  - Desktop sidebar + mobile navigation chips.
  - Top bar shows the active route, authenticated user info, and auth actions.

## Quality Notes

- ESLint passes (`npm run lint`).
- Tailwind utility classes keep components lightweight; design tuned for mobile, tablet, and desktop widths.
- Network mutations surface alerts on failure; additional toast system could be layered later if desired.

## Time Spent

- Development & review: **≈4h 30m**

## Next Steps & Known Gaps

- Integrate toast notifications for better mutation feedback.
- Expand test coverage (unit + integration) around the context providers.
- If a production backend exists, wire up authentication tokens and refresh flows.

## License

This challenge solution follows the original repository license (MIT).
