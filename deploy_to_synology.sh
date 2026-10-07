#!/bin/bash
# ==============================================================================
# Cyber Arcade -> Synology NAS Deployment Script
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

COMMON_ENV="/Users/kiefer/Desktop/Github/common-element/credentials_combined.env"

echo "=================================================="
echo " 🕹️  Cyber Arcade -> Synology NAS Container Deployer"
echo "=================================================="

# Load credentials from common-element if exists
if [ -f "$COMMON_ENV" ]; then
    echo "[+] Loading credentials from common-element..."
    SYNOLOGY_HOST=$(grep -E '^SYNOLOGY_HOST=' "$COMMON_ENV" | head -n1 | cut -d '=' -f 2 | tr -d ' "' | tr -d '\r')
    SYNOLOGY_SSH_PORT=$(grep -E '^SYNOLOGY_SSH_PORT=' "$COMMON_ENV" | head -n1 | cut -d '=' -f 2 | tr -d ' "' | tr -d '\r')
    SYNOLOGY_USER=$(grep -E '^SYNOLOGY_USER=' "$COMMON_ENV" | head -n1 | cut -d '=' -f 2 | tr -d ' "' | tr -d '\r')
    SYNOLOGY_PASSWORD=$(grep -E '^SYNOLOGY_PASSWORD=' "$COMMON_ENV" | head -n1 | cut -d '=' -f 2- | sed 's/^"//;s/"$//' | tr -d '\r')
fi

SYNOLOGY_HOST=${SYNOLOGY_HOST:-"192.168.0.250"}
SYNOLOGY_SSH_PORT=${SYNOLOGY_SSH_PORT:-22}
SYNOLOGY_USER=${SYNOLOGY_USER:-"antigravity"}
SYNOLOGY_PASSWORD=${SYNOLOGY_PASSWORD:-"AY^#!n0O!mCegbxmJ5ea"}
REMOTE_PROJECT_DIR="/volume1/docker/projects/cyber-arcade"
PORT="8090"

echo "[+] Target Host: $SYNOLOGY_USER@$SYNOLOGY_HOST (Port: $SYNOLOGY_SSH_PORT)"
echo "[+] Remote Destination: $REMOTE_PROJECT_DIR"
echo "[+] Target HTTP Port: $PORT"

# Non-interactive SSH askpass helper
ASKPASS_SCRIPT=$(mktemp /tmp/arcade_askpass.XXXXXX.sh)
cat << 'EOF' > "$ASKPASS_SCRIPT"
#!/bin/sh
cat << 'PWEOD'
EOF
echo "$SYNOLOGY_PASSWORD" >> "$ASKPASS_SCRIPT"
cat << 'EOF' >> "$ASKPASS_SCRIPT"
PWEOD
EOF
chmod +x "$ASKPASS_SCRIPT"

cleanup() {
    rm -f "$ASKPASS_SCRIPT"
}
trap cleanup EXIT

run_ssh() {
    SSH_ASKPASS_REQUIRE=force SSH_ASKPASS="$ASKPASS_SCRIPT" DISPLAY=:0 \
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SYNOLOGY_SSH_PORT" "$SYNOLOGY_USER@$SYNOLOGY_HOST" "$@"
}

run_sudo() {
    local cmd="$1"
    run_ssh "echo '$SYNOLOGY_PASSWORD' | sudo -S sh -c '$cmd'" </dev/null
}

echo ""
echo "[Step 1/5] Testing SSH connection to Synology NAS..."
if run_ssh "echo '[✓] SSH Connection successful. Host: \$(uname -n)'"; then
    echo "[+] Synology reachable."
else
    echo "[-] Error: Could not connect to Synology NAS at $SYNOLOGY_HOST"
    exit 1
fi

echo ""
echo "[Step 2/5] Preparing remote project directories on Synology..."
run_sudo "mkdir -p $REMOTE_PROJECT_DIR"
run_sudo "chown -R $SYNOLOGY_USER:users $REMOTE_PROJECT_DIR"
run_sudo "chmod -R 775 $REMOTE_PROJECT_DIR"

echo ""
echo "[Step 3/5] Packaging and streaming arcade files to Synology..."
STAGING_DIR=$(mktemp -d /tmp/arcade_deploy.XXXXXX)

# Copy project files
cp "$REPO_ROOT/index.html" "$STAGING_DIR/"
cp "$REPO_ROOT/favicon.svg" "$STAGING_DIR/"
cp "$REPO_ROOT/package.json" "$STAGING_DIR/"
cp "$REPO_ROOT/Dockerfile" "$STAGING_DIR/"
cp "$REPO_ROOT/docker-compose.yml" "$STAGING_DIR/"

# Copy directories
cp -r "$REPO_ROOT/css" "$STAGING_DIR/"
cp -r "$REPO_ROOT/js" "$STAGING_DIR/"
cp -r "$REPO_ROOT/games" "$STAGING_DIR/"

tar -czf - -C "$STAGING_DIR" . | run_ssh "tar -xzf - -C $REMOTE_PROJECT_DIR"
rm -rf "$STAGING_DIR"

# Ensure all transferred files have world-readable permissions for Nginx container
run_sudo "chmod -R 755 $REMOTE_PROJECT_DIR"

echo ""
echo "[Step 4/5] Starting Cyber Arcade container via Docker Compose on Synology..."
run_sudo "cd $REMOTE_PROJECT_DIR && (/usr/local/bin/docker compose down 2>/dev/null || true)"
run_sudo "cd $REMOTE_PROJECT_DIR && /usr/local/bin/docker compose up -d"

echo ""
echo "[Step 5/5] Verifying container status..."
sleep 3
run_sudo "cd $REMOTE_PROJECT_DIR && /usr/local/bin/docker compose ps"

echo ""
echo "=================================================="
echo " 🎉 Cyber Arcade Successfully Deployed to Synology NAS!"
echo "=================================================="
echo " - Local URL: http://$SYNOLOGY_HOST:$PORT"
echo " - Remote Dir: $REMOTE_PROJECT_DIR"
echo "=================================================="
