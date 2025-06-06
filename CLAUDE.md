# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

必ず日本語で回答してください。

## Project Overview

RSS Reader - A modern monorepo RSS feed reader application with web and native (iOS/Android) apps. Built with TypeScript across all applications.

### Architecture

- **apps/api**: Node.js/Express API server with Prisma ORM and PostgreSQL
- **apps/web**: Next.js web application with Tailwind CSS
- **apps/native**: React Native/Expo mobile application  
- **packages/sdk**: TypeScript SDK for API client

### Key Technologies

- **Monorepo**: Turborepo for orchestration
- **Backend**: Express, Prisma, PostgreSQL, JWT authentication, RSS parsing
- **Frontend**: React, Next.js, Tailwind CSS, React Hook Form with Zod validation
- **Mobile**: React Native, Expo
- **Tooling**: Biome for linting/formatting, Vitest for testing, TypeScript

## Development Commands

### Root-level commands (use these for most tasks):
```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all applications
npm run test         # Run tests across all apps
npm run lint         # Lint all applications with Biome
npm run type-check   # Type check all applications
npm run format       # Format code with Biome
npm run clean        # Clean build artifacts
```

### Individual app development:
```bash
# API server (port 3001)
cd apps/api && npm run dev

# Web app (port 3000) 
cd apps/web && npm run dev

# Native app
cd apps/native && npm run dev

# SDK development
cd packages/sdk && npm run dev
```

### Database operations (API):
```bash
cd apps/api
npx prisma migrate dev     # Run database migrations
npx prisma db seed         # Seed database with initial data
npx prisma studio          # Open Prisma Studio for database management
```

### Testing:
```bash
npm run test                    # All tests
npm run test:coverage          # Test with coverage
cd apps/api && npm run test    # API tests only
cd apps/web && npm run test    # Web tests only
```

## Code Standards

- **Linting/Formatting**: Uses Biome with specific rules configured in biome.json
- **Validation**: Zod schemas for API validation and form validation
- **Authentication**: JWT-based with bcryptjs for password hashing
- **Internationalization**: i18next for both web and native apps (Japanese/English)
- **State Management**: React Hook Form for forms, context for global state
- **Styling**: Tailwind CSS with responsive design and dark mode support

## Database Setup

The API requires PostgreSQL. Set up environment variables in `apps/api/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/rss_reader"
JWT_SECRET="your-jwt-secret"
PORT=3001
```

## Deployment

- **API & Web**: Vercel (with Supabase PostgreSQL)
- **Native**: EAS Build (Expo Application Services)
- **Environment variables**: Set DATABASE_URL and JWT_SECRET in Vercel dashboard

## Key Features

- User authentication (register/login/password reset)
- RSS feed management (CRUD operations) 
- Article search and filtering
- OPML import/export
- Daily feed refresh via cron jobs
- Responsive design with dark mode
- Multilingual support (Japanese/English)
