# mou-service-content-api

Node.js/TypeScript content API service.

## Application Overview

| Property | Value |
|----------|-------|
| **Type** | Node.js/TypeScript API |
| **Port** | 5000 |
| **Database** | PostgreSQL - `contentdb` |
| **Domain** | content.yourdomain.com |
| **Health Endpoint** | GET /health |
| **Repository** | github.com/your-org/mou-service-content-api |

## Infrastructure Compliance Checklist

- [x] `ecosystem.config.js` in repository root
- [x] `.github/workflows/deploy.yml` configured
- [x] TypeScript compiles to `dist/` directory
- [x] Entry point is `dist/index.js`
- [x] Health check endpoint at `/health`
- [ ] Environment variables configured on server
- [ ] Database setup on server

---

## GitHub Repository Secrets Required

Configure these secrets in your GitHub repository settings:

| Secret | Description | Example |
|--------|-------------|---------|
| `EC2_HOST` | EC2 public IP or Elastic IP | `54.123.45.67` |
| `EC2_USER` | Deploy user | `deploy` |
| `EC2_SSH_KEY` | Private SSH key content | `-----BEGIN OPENSSH...` |

---

## Server Setup (First Time)

Run these commands on the EC2 instance:

```bash
# Create application directory
sudo mkdir -p /var/www/mou-service-content-api/{releases,shared}
sudo chown -R deploy:deploy /var/www/mou-service-content-api

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R deploy:deploy /var/log/pm2

# Create shared environment file
cat > /var/www/mou-service-content-api/shared/.env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://content_api:your_secure_password@localhost:5432/contentdb
API_KEY=generate_a_secure_key_here
LOG_LEVEL=info
EOF

# Secure the .env file
chmod 600 /var/www/mou-service-content-api/shared/.env
```

---

## Database Setup

### Create Database and User

Run on the EC2 instance:

```bash
sudo -u postgres psql << 'EOF'
-- Create database
CREATE DATABASE contentdb;

-- Create application user
CREATE USER content_api WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE contentdb TO content_api;

-- Connect to database and grant schema privileges
\c contentdb
GRANT ALL ON SCHEMA public TO content_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO content_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO content_api;
EOF
```

---

## Nginx Site Configuration

Create `/etc/nginx/sites-available/mou-service-content-api`:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=content_limit:10m rate=20r/s;

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name content.yourdomain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/content.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/content.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CORS headers (adjust origins as needed)
    add_header Access-Control-Allow-Origin "https://mou.yourdomain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://mou.yourdomain.com";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }

    # API endpoints with rate limiting
    location / {
        limit_req zone=content_limit burst=40 nodelay;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        
        # Content uploads size limit
        client_max_body_size 50M;
    }

    # Health check (no rate limit)
    location /health {
        proxy_pass http://127.0.0.1:5000;
        access_log off;
    }
}

# HTTP redirect
server {
    listen 80;
    listen [::]:80;
    server_name content.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mou-service-content-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d content.yourdomain.com
```

---

## Monitoring & Troubleshooting

### Check Application Status

```bash
# PM2 status
pm2 status mou-service-content-api

# View logs
pm2 logs mou-service-content-api --lines 100

# Monitor resources
pm2 monit

# Check health endpoint
curl http://localhost:5000/health

# Check database connection
psql -h localhost -U content_api -d contentdb -c "SELECT 1;"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check if PM2 process is running: `pm2 status` |
| Database connection failed | Verify DATABASE_URL and PostgreSQL is running |
| TypeScript build fails | Check compilation errors, ensure `npm ci` |
| Memory issues | Adjust `max-old-space-size` in ecosystem.config.js |

### Database Troubleshooting

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -c "\l" | grep contentdb

# Check user privileges
sudo -u postgres psql -d contentdb -c "\dp"

# Test connection
psql postgresql://content_api:password@localhost:5432/contentdb -c "SELECT NOW();"
```

---

## Local Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Docker build (uses existing docker-compose.yml)
docker-compose up --build

# Stop containers
docker-compose down
```

---

## Inter-Service Communication

The content API can be called by other services on the same server:

### From mou-service-runtime-api

```typescript
// In runtime-api, call content-api locally
const CONTENT_API_URL = process.env.CONTENT_API_URL || 'http://localhost:5000';

async function getContent(id: string) {
  const response = await fetch(`${CONTENT_API_URL}/content/${id}`);
  return response.json();
}
```

### Environment Variable

Add to runtime-api's `.env`:

```bash
CONTENT_API_URL=http://localhost:5000
```

---

## Migration from Docker to PM2

| Docker Compose | PM2 Equivalent |
|----------------|----------------|
| `docker-compose up` | `pm2 start ecosystem.config.js` |
| `docker-compose down` | `pm2 stop mou-service-content-api` |
| `docker-compose restart` | `pm2 reload mou-service-content-api` |
| `docker logs content-api` | `pm2 logs mou-service-content-api` |
| `docker exec -it db psql...` | `psql -h localhost -U content_api -d contentdb` |

### Port Differences

| Service | Local Docker | Production |
|---------|--------------|------------|
| Content API | 5000 | 5000 |
| PostgreSQL | 5433 (mapped) | 5432 |
