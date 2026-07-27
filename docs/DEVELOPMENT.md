## Development Setup

For local development without Docker:

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Backend

```bash
cd backend
npm install

# Copy and edit environment
cp .env.example .env
# Set DATABASE_URL to your local PostgreSQL

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
# Backend runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install

# Copy and edit environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL

# Start dev server
npm run dev
# Frontend runs on http://localhost:3000
```

### MCP Server

```bash
cd mcp-server
npm install
npm run build

# Run in stdio mode (for local testing)
MCP_API_URL=http://localhost:3001 \
MCP_AUTH_EMAIL=admin@example.com \
MCP_AUTH_PASSWORD=your-password \
node dist/index.js

# Or run the test suite
MCP_API_URL=http://localhost:3001 \
MCP_AUTH_EMAIL=admin@example.com \
MCP_AUTH_PASSWORD=your-password \
node dist/index.js --test
```

---

## Testing

### Backend API Tests

```bash
cd backend
npm test
```

### Frontend E2E Tests (Playwright)

```bash
cd frontend
npm run test:e2e
```

Environment overrides for tests:
- `PLAYWRIGHT_BASE_URL` — Frontend URL (default: `http://localhost:3200`)
- `PLAYWRIGHT_API_URL` — API URL (default: `http://localhost:3201`)
- `E2E_ADMIN_EMAIL` — Admin email for test login
- `E2E_ADMIN_PASSWORD` — Admin password for test login

### MCP Server Tests

```bash
cd mcp-server
npm run build

MCP_API_URL=http://localhost:3201 \
MCP_AUTH_EMAIL=admin@example.com \
MCP_AUTH_PASSWORD=your-password \
node dist/index.js --test
```

This runs end-to-end tests covering all 67 tools, 6 resources, and 6 prompts.

---

