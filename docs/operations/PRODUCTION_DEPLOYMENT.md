# Production Deployment Guide (Vercel + VPS) — Agri

## 1. Architecture Overview (Option A) `[DECIDED]`

- **Frontend:** Deployed to **Vercel** Edge (`https://agriforecasting.com`).
- **Backend & Database:** Deployed to a single **Ubuntu VPS** via **Docker Compose** (`https://api.agriforecasting.com`).
- **Reverse Proxy:** Nginx with automated SSL certificates (Let's Encrypt).

---

## 2. VPS Server Provisioning (Ubuntu 22.04 / 24.04 LTS)

### Hardware Sizing:
- **CPU:** 2 vCPU
- **RAM:** 4 GB RAM
- **Storage:** 40–60 GB NVMe SSD
- **Swap:** 2 GB Swap file recommended

### VPS Initial Setup Commands:
```bash
# Update OS packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose plugin
sudo apt install -y curl git ufw
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Configure Firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP Let's Encrypt
sudo ufw allow 443/tcp   # HTTPS API
sudo ufw enable
```

---

## 3. Deploying the Backend on VPS

```bash
# 1. Clone repository on VPS
git clone <repository_url> /opt/agri
cd /opt/agri

# 2. Configure production .env
cp .env.example .env
nano .env # Set strong POSTGRES_PASSWORD and REDIS_PASSWORD

# 3. Build & start all containers
docker compose build --no-cache
docker compose up -d

# 4. Initialize schema and ingest dataset
docker compose exec postgres psql -U postgres -d agriforecasting -f /app/scripts/create_schema.sql
docker compose exec backend python3 /app/scripts/ingest_national_geography.py
docker compose exec backend python3 /app/scripts/ingest_historical_prices.py

# 5. Verify healthy state
curl https://api.agriforecasting.com/api/v1/health
```

---

## 4. Deploying Frontend to Vercel

1. Link your GitHub repository to Vercel.
2. Configure Root Directory: `frontend`.
3. Configure Build Settings:
   - Framework Preset: `Next.js`
   - Build Command: `next build`
   - Output Directory: `.next`
4. Set Production Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://api.agriforecasting.com/api/v1`
5. Click **Deploy**. Vercel handles global CDN caching, SSL certificates, and edge SSR.
