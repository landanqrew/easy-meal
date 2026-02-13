# Easy Meal

A web application that streamlines meal preparation—from AI-powered recipe creation to grocery list generation.

## Features

- **AI Recipe Generation** - Create personalized recipes by selecting proteins, vegetables, cuisines, and cooking preferences
- **Recipe Organization** - Tag and organize recipes with custom tags
- **Household Sharing** - Share recipes with family members via invite codes
- **Grocery Lists** - Generate consolidated grocery lists from recipes with automatic ingredient aggregation and servings scaling
- **Mobile-Friendly** - Responsive design works on phones and tablets

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TanStack Query
- **Backend**: Bun, Hono, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (email/password + Google OAuth)
- **AI**: Google Gemini 3.0 Flash
- **Deployment**: Google Cloud Run

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) v20+ (for web package)
- [Docker](https://www.docker.com/) (for local PostgreSQL)
- [Google AI API Key](https://aistudio.google.com/apikey) (for recipe generation)

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/easy-meal.git
cd easy-meal
bun install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5433 (to avoid conflicts with local installations).

### 3. Configure Environment

```bash
cp packages/api/.env.example packages/api/.env
```

Edit `packages/api/.env`:

```env
# Database (default works with docker-compose)
DATABASE_URL=postgres://easymeal:easymeal_dev@localhost:5433/easymeal

# Better Auth (generate a random 32+ character string)
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Google AI (get from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key

# Google OAuth (optional - get from https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Set Up Database

```bash
cd packages/api
bun run db:push
```

### 5. Start Development Servers

In separate terminals:

```bash
# Terminal 1: API server (http://localhost:3001)
cd packages/api
bun run dev

# Terminal 2: Web server (http://localhost:5173)
cd packages/web
npm run dev
```

### 6. Open the App

Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
easy-meal/
├── packages/
│   ├── api/          # Backend API (Bun + Hono)
│   │   ├── src/
│   │   │   ├── db/           # Database schema and connection
│   │   │   ├── lib/          # Auth, AI, utilities
│   │   │   ├── middleware/   # Error handling, security
│   │   │   └── routes/       # API endpoints
│   │   └── Dockerfile
│   ├── web/          # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── lib/          # Auth client
│   │   │   └── pages/        # React components
│   │   └── Dockerfile
│   └── shared/       # Shared TypeScript types
├── docs/
│   └── deployment.md # Detailed deployment guide
├── docker-compose.yml
├── cloudbuild.yaml   # GCP Cloud Build config
└── project-plan.md   # Project roadmap
```

## Available Scripts

### API (`packages/api`)

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run db:push` | Push schema changes to database |
| `bun run db:studio` | Open Drizzle Studio (database GUI) |

### Web (`packages/web`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `GET /api/auth/session` - Get current session

### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile

### Households
- `POST /api/households` - Create household
- `POST /api/households/join` - Join via invite code
- `GET /api/households/current` - Get current household

### Recipes
- `POST /api/recipes/generate` - Generate recipe with AI
- `POST /api/recipes` - Save recipe
- `GET /api/recipes` - List household recipes
- `GET /api/recipes/:id` - Get recipe details
- `DELETE /api/recipes/:id` - Delete recipe

### Grocery Lists
- `POST /api/grocery-lists` - Create from recipes
- `GET /api/grocery-lists` - List all grocery lists
- `GET /api/grocery-lists/:id` - Get list with items
- `PATCH /api/grocery-lists/:id/items/:itemId` - Toggle item checked

## Deployment to Google Cloud Run

### Quick Start

1. **Install Google Cloud CLI**
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Or download from https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate and Create Project**
   ```bash
   gcloud auth login
   gcloud projects create easy-meal-prod
   gcloud config set project easy-meal-prod
   ```

3. **Enable Required APIs**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     sqladmin.googleapis.com \
     secretmanager.googleapis.com \
     cloudbuild.googleapis.com
   ```

4. **Create Cloud SQL Database**
   ```bash
   # Create instance (this takes a few minutes)
   gcloud sql instances create easy-meal-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1

   # Create database and user
   gcloud sql databases create easymeal --instance=easy-meal-db
   gcloud sql users create easymeal --instance=easy-meal-db --password=YOUR_SECURE_PASSWORD
   ```

5. **Configure Secrets**
   ```bash
   # Database URL
   echo -n "postgresql://easymeal:YOUR_PASSWORD@/easymeal?host=/cloudsql/PROJECT_ID:us-central1:easy-meal-db" | \
     gcloud secrets create easy-meal-db-url --data-file=-

   # Auth secret (generate random string)
   openssl rand -base64 32 | gcloud secrets create easy-meal-auth-secret --data-file=-

   # Gemini API key
   echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create easy-meal-ai-key --data-file=-
   ```

6. **Deploy**
   ```bash
   # Build and deploy (from project root)
   gcloud builds submit --config=cloudbuild.yaml
   ```

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md).

### Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Cloud SQL connection string |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `BETTER_AUTH_URL` | API public URL |
| `FRONTEND_URL` | Web public URL |
| `GOOGLE_AI_API_KEY` | Gemini API key |
| `SENTRY_DSN` | (Optional) Error tracking |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT


