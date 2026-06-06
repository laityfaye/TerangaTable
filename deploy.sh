#!/usr/bin/env bash
# TérangaTable deployment script
# Usage: ./deploy.sh {init|update|migrate|logs [service]|status|down}
set -euo pipefail

COMPOSE="docker compose -f infrastructure/docker-compose.prod.yml"
NGINX_CONF="infrastructure/nginx/nginx.conf"
DOMAIN="terangatable.cloud"
EMAIL="innosoftcreation@gmail.com"

# ── Helpers ──────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%H:%M:%S')] $*"; }

require_env() {
  if [ ! -f .env.production ]; then
    echo "ERROR: .env.production not found."
    echo "       cp .env.production.example .env.production  then fill in secrets."
    exit 1
  fi
}

# Write file content in-place (preserves inode so bind-mount sees the change)
write_nginx() {
  cat "$1" > "$NGINX_CONF"
}

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_init() {
  require_env

  log "=== INIT: First deployment of $DOMAIN ==="

  # 1. Start nginx with HTTP-only config (no certs needed)
  log "→ Starting nginx (HTTP only) for ACME challenge..."
  write_nginx infrastructure/nginx/nginx.init.conf
  $COMPOSE up -d nginx
  sleep 3

  # 2. Obtain Let's Encrypt certificates
  log "→ Obtaining SSL certificates (certbot)..."
  $COMPOSE run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --non-interactive \
    -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN"

  # 3. Switch nginx to HTTPS config and reload
  log "→ Switching nginx to HTTPS config..."
  write_nginx infrastructure/nginx/nginx.https.conf
  $COMPOSE exec nginx nginx -s reload

  # 4. Build application images
  log "→ Building Docker images (this takes a few minutes)..."
  $COMPOSE build api web

  # 5. Start all services
  log "→ Starting all services..."
  $COMPOSE up -d

  # 6. Wait for DB and run migrations
  log "→ Waiting for database to be ready (15 s)..."
  sleep 15
  log "→ Running database migrations..."
  $COMPOSE exec api npx prisma migrate deploy --schema=./prisma/schema.prisma

  log ""
  log "✓ TérangaTable is live!"
  log "  Frontend : https://$DOMAIN"
  log "  API      : https://api.$DOMAIN/v1"
  log "  API docs : https://api.$DOMAIN/docs"
}

cmd_update() {
  require_env

  log "=== UPDATE: Deploying latest code ==="
  git pull

  log "→ Rebuilding application images..."
  $COMPOSE build api web

  log "→ Restarting app containers (zero-downtime infra stays up)..."
  $COMPOSE up -d --no-deps api web

  log "→ Running migrations..."
  sleep 5
  $COMPOSE exec api npx prisma migrate deploy --schema=./prisma/schema.prisma

  log "✓ Update complete"
}

cmd_migrate() {
  log "→ Running pending migrations..."
  $COMPOSE exec api npx prisma migrate deploy --schema=./prisma/schema.prisma
  log "✓ Migrations complete"
}

cmd_logs() {
  local service="${2:-api web nginx}"
  # shellcheck disable=SC2086
  $COMPOSE logs -f --tail=100 $service
}

cmd_status() {
  $COMPOSE ps
}

cmd_down() {
  log "Stopping all services (volumes are preserved)..."
  $COMPOSE down
}

cmd_renew() {
  log "→ Force-renewing SSL certificates..."
  $COMPOSE run --rm certbot renew --force-renewal
  $COMPOSE exec nginx nginx -s reload
  log "✓ Certificates renewed"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────

case "${1:-help}" in
  init)    cmd_init ;;
  update)  cmd_update ;;
  migrate) cmd_migrate ;;
  logs)    cmd_logs "$@" ;;
  status)  cmd_status ;;
  down)    cmd_down ;;
  renew)   cmd_renew ;;
  *)
    echo "TérangaTable deploy script"
    echo ""
    echo "Usage: ./deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  init     First-time setup: get SSL certs, build images, start services, migrate"
    echo "  update   Pull code, rebuild images, restart app, migrate"
    echo "  migrate  Run pending Prisma migrations only"
    echo "  logs     Tail logs (default: api web nginx)"
    echo "  status   Show container status"
    echo "  renew    Force-renew Let's Encrypt certificates"
    echo "  down     Stop all containers (data volumes preserved)"
    ;;
esac
