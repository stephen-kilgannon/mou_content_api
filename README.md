# Content API

A simple and powerful API for storing and serving both traditional content and rich structured objects. Built with Node.js, TypeScript, and PostgreSQL.

## Features

- **Dual Content Types**: 
  - Traditional content with metadata (articles, posts, etc.)
  - Rich structured objects with nested items (tasks, journals, events)
- **Voting System**: Upvote/downvote functionality for objects
- **Flexible Metadata**: JSON storage for extensible data
- **Item Management**: CRUD operations on nested items within objects
- **PostgreSQL**: Reliable relational database with JSONB support
- **Docker Ready**: Complete containerization with PostgreSQL
- **Health Monitoring**: Built-in health checks
- **TypeScript**: Full type safety throughout

## Quick Start

### Using Docker (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd content-api
   cp .env.example .env
   ```

2. **Update environment variables** in `.env`:
   ```env
   DB_HOST=db
   DB_PASSWORD=yourpassword
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Verify health**:
   ```bash
   curl http://localhost:5000/health
   ```

### Local Development

1. **Prerequisites**:
   - Node.js 18+
   - PostgreSQL 12+
   - npm or yarn

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup database**:
   ```bash
   # Create database
   createdb contentdb
   
   # Update .env with local database
   cp .env.example .env
   # Edit .env: DB_HOST=localhost
   ```

4. **Build and run**:
   ```bash
   npm run build
   npm run dev
   ```

## API Endpoints

### Content API (`/api/content`)

Traditional content management for articles, posts, etc.

- `POST /api/content` - Create content
- `GET /api/content` - List all content
- `GET /api/content/:id` - Get content by ID
- `GET /api/content/slug/:slug` - Get content by slug
- `DELETE /api/content/:id` - Delete content
- `DELETE /api/content` - Clean all content (dev only)

**Content Structure**:
```json
{
  "title": "Article Title",
  "content": "Full article content...",
  "meta": {
    "description": "Article description",
    "keywords": ["keyword1", "keyword2"],
    "author": "Author Name",
    "tags": ["tag1", "tag2"],
    "imageUrl": "https://example.com/image.jpg"
  }
}
```

### Objects API (`/api/objects`)

Rich structured objects with nested items, voting, and flexible metadata.

- `POST /api/objects` - Create object
- `GET /api/objects` - List objects (with filtering & pagination)
- `GET /api/objects/:id` - Get object by ID
- `PUT /api/objects/:id` - Update entire object
- `PATCH /api/objects/:id/vote` - Vote on object
- `PATCH /api/objects/:id/items/:index` - Update specific item
- `DELETE /api/objects/:id` - Delete object
- `DELETE /api/objects` - Clean all objects

**Object Structure**:
```json
{
  "title": "Financial Freedom Plan",
  "description": "A comprehensive plan for financial independence",
  "userId": "user123",
  "dueDate": "2025-12-31T00:00:00Z",
  "type": "plan",
  "metadata": {
    "priority": "high",
    "category": "finance"
  },
  "items": [
    {
      "type": "task",
      "title": "Setup Emergency Fund",
      "description": "Save 3-6 months of expenses",
      "status": "pending",
      "completed": false,
      "metadata": {
        "tags": ["savings", "emergency"],
        "estimatedHours": 2
      }
    }
  ],
  "upvotes": 0,
  "downvotes": 0
}
```

## Usage Examples

### Create a Rich Object
```bash
curl -X POST http://localhost:5000/api/objects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Routine",
    "description": "Daily morning routine for productivity",
    "type": "routine",
    "items": [
      {
        "type": "task",
        "title": "Meditation",
        "description": "10 minutes of mindfulness",
        "status": "pending",
        "completed": false,
        "metadata": {"duration": "10min"}
      }
    ]
  }'
```

### Vote on an Object
```bash
curl -X PATCH http://localhost:5000/api/objects/1/vote \
  -H "Content-Type: application/json" \
  -d '{"type": "upvote"}'
```

### Update an Item
```bash
curl -X PATCH http://localhost:5000/api/objects/1/items/0 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "completed": true}'
```

### Query Objects with Filters
```bash
# Get objects by type with pagination
curl "http://localhost:5000/api/objects?type=routine&limit=10&offset=0"

# Get objects by user
curl "http://localhost:5000/api/objects?userId=user123"
```

## Database Schema

### Content Table
```sql
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Objects Table
```sql
CREATE TABLE objects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  user_id VARCHAR(255),
  due_date TIMESTAMP,
  type VARCHAR(100) DEFAULT 'object',
  metadata JSONB DEFAULT '{}',
  items JSONB DEFAULT '[]',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | No |
| `DB_NAME` | Database name | `contentdb` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `PORT` | API server port | `5000` | No |
| `NODE_ENV` | Environment | `development` | No |

## Development

### Project Structure
```
src/
├── controllers/          # Request handlers
│   ├── content.controller.ts
│   └── object.controller.ts
├── models/              # Database models
│   ├── content.model.ts
│   └── object.model.ts
├── routes/              # API routes
│   ├── content.routes.ts
│   └── object.routes.ts
├── utils/               # Utilities
│   ├── database.ts      # PostgreSQL connection
│   └── logger.ts        # Winston logger
└── index.ts             # Application entry point
```

### Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Build and run in development mode
- `npm test` - Run tests (to be implemented)

### Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Remove volumes (reset database)
docker-compose down -v
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add new feature'`
5. Push to branch: `git push origin feature/new-feature`
6. Create a Pull Request

## License

ISC License - see LICENSE file for details

## Health Check

The API includes a health check endpoint at `/health` that returns:

```json
{
  "status": "ok",
  "timestamp": "2025-12-11T20:30:00.000Z",
  "service": "content-api",
  "version": "1.0.0"
}
```

This endpoint is used by Docker for container health monitoring.