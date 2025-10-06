#!/bin/bash

# Deploy Updated Indexer to VPS
# Pulls latest code from GitHub and rebuilds the service

set -e

VPS_IP="198.144.183.32"
VPS_USER="root"

echo "🚀 Deploying updated indexer to VPS ${VPS_IP}"
echo ""

ssh ${VPS_USER}@${VPS_IP} << 'EOF'
set -e

echo "📥 Step 1: Pulling latest code from GitHub..."
cd /root/repos/verifi-services
git pull origin main

echo ""
echo "🔧 Step 2: Adding WEBHOOK_URL to environment..."
if grep -q "WEBHOOK_URL" /opt/verifi-indexer/.env; then
    echo "✅ WEBHOOK_URL already exists"
else
    echo "WEBHOOK_URL=https://verifi.wtf/api/webhooks/nodit" >> /opt/verifi-indexer/.env
    echo "✅ WEBHOOK_URL added"
fi

echo ""
echo "🔨 Step 3: Building indexer service..."
cd /root/repos/verifi-services/indexer-service
/usr/local/go/bin/go mod tidy
/usr/local/go/bin/go build -o indexer ./cmd/server

echo ""
echo "🛑 Step 4: Stopping current service..."
sudo systemctl stop verifi-indexer

echo ""
echo "📦 Step 5: Deploying new binary..."
cp /root/repos/verifi-services/indexer-service/indexer /opt/verifi-indexer/
chmod +x /opt/verifi-indexer/indexer

echo ""
echo "🚀 Step 6: Starting service..."
sudo systemctl start verifi-indexer

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service status:"
sudo systemctl status verifi-indexer --no-pager | head -20

echo ""
echo "📝 Recent logs (last 20 lines):"
sudo journalctl -u verifi-indexer -n 20 --no-pager

EOF

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Monitor logs with:"
echo "  ssh root@${VPS_IP}"
echo "  sudo journalctl -u verifi-indexer -f | grep -E 'webhook|🔔|✅'"
echo ""
echo "Test by creating a market on verifi.wtf and watching for:"
echo "  🔔 Sending webhook to https://verifi.wtf/api/webhooks/nodit"
echo "  ✅ Webhook delivered successfully"
echo ""
