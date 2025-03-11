# RSS Reader

A modern RSS reader application built with Next.js, React, TypeScript, and PostgreSQL.

## Features

- User registration and authentication
- Feed management
- Article reading
- Read status tracking
- Theme and language settings

## Tech Stack

- React
- TypeScript
- Next.js
- NextAuth
- Prisma
- PostgreSQL
- Tailwind CSS
- Zod
- Biome
- Prettier
- Vitest
- Testing Library
- Playwright

## Development

### Prerequisites

- Docker
- Docker Compose

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd reader
   ```

2. Start the development environment:
   ```bash
   docker-compose up
   ```

This will start the application at http://localhost:3000.

### Default User

A default user is created for testing:
- Email: demo@example.com
- Password: password123

### Database

The PostgreSQL database is accessible at:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: postgres
- Database: reader

You can use Prisma Studio to explore the database:
```bash
docker-compose exec web npx prisma studio
```

This will start Prisma Studio at http://localhost:5555.

## Testing

Run tests inside the Docker container:

```bash
docker-compose exec web npm run test
```

Run E2E tests:

```bash
docker-compose exec web npm run test:e2e
```