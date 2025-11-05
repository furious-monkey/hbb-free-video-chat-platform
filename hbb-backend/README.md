# HBB Backend API


Node.js backend, Rest API, and React frontend. The whole stack is with TypeScript.

### 1 Features

#### 1.1 Backend

- [Node.js](https://nodejs.org/en/) with [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/) ORM with [PostgreSQL](https://www.postgresql.org/) database
- [ESBuild](https://esbuild.github.io) bundling

#### 1.2 Tooling/Infrastructure

- [GitHub Actions](https://github.com/features/actions) CI/CD
- [Sentry](https://sentry.io) error monitoring
- [Jest](https://jestjs.io/) testing
- [ESLint](https://eslint.org/) linting

### 2 Setup

#### 2.1 Server
1. Install [Docker Compose](https://docs.docker.com/compose/install/)
2. Install dependencies in all projects: `npm install`
3. Create the file `.env` and add the fields from `.env.example`
4. Run: npx prisma generate
5. Run: npx prisma migrate dev --name init 