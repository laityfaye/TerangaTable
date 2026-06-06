#!/usr/bin/env bash
# TérangaTable deployment script
# Usage: ./deploy.sh {init|update|migrate|logs [service]|status|down}
set -euo pipefail

COMPOSE="docker compose -f infrastructure/docker-compose.prod.yml --env-file .env.production"
DOMAIN="terangatable.cloud"

# ── Helpers ──────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%H:%M:%S')] $*"; }

require_env() {
  if [ ! -f .env.production ]; then
    echo "ERROR: .env.production not found."
    echo "       cp .env.production.example .env.production  then fill in secrets."
    exit 1
  fi
}

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_init() {
  require_env

  log "=== INIT: First deployment of $DOMAIN ==="

  # 1. Build application images
  log "→ Building Docker images (this takes a few minutes)..."
  $COMPOSE build api web

  # 2. Start all services
  log "→ Starting all services..."
  $COMPOSE up -d

  # 3. Wait for DB and run migrations
  log "→ Waiting for database to be ready (15 s)..."
  sleep 15
  log "→ Running database migrations..."
  $COMPOSE exec api npx prisma migrate deploy --schema=./prisma/schema.prisma

  log ""
  log "✓ TérangaTable containers are up!"
  log "  Web listens on : 127.0.0.1:3000"
  log "  API listens on : 127.0.0.1:3001"
  log ""
  log "  Next step: configure your host nginx vhosts and obtain SSL certs."
  log "  See infrastructure/nginx/nginx.vhost.conf for the template."
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

# ── Dispatch ─────────────────────────────────────────────────────────────────

case "${1:-help}" in
  init)    cmd_init ;;
  update)  cmd_update ;;
  migrate) cmd_migrate ;;
  logs)    cmd_logs "$@" ;;
  status)  cmd_status ;;
  down)    cmd_down ;;
  *)
    echo "TérangaTable deploy script"
    echo ""
    echo "Usage: ./deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  init     Build images, start services, run migrations"
    echo "  update   Pull code, rebuild images, restart app, migrate"
    echo "  migrate  Run pending Prisma migrations only"
    echo "  logs     Tail logs (default: api web)"
    echo "  status   Show container status"
    echo "  down     Stop all containers (data volumes preserved)"
    ;;
esac
