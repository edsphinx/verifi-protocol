#!/bin/bash

# Automated VPS Webhook Setup
# This script SSHs to the VPS and sets up webhook integration

set -e

VPS_IP="198.144.183.32"
VPS_USER="root"
WEBHOOK_URL="https://verifi.wtf/api/webhooks/nodit"

echo "🚀 Setting up webhook integration on VPS ${VPS_IP}"
echo ""

# Step 1: Add WEBHOOK_URL to .env
echo "📝 Step 1: Adding WEBHOOK_URL to environment..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF1'
# Check if WEBHOOK_URL already exists
if grep -q "WEBHOOK_URL" /opt/verifi-indexer/.env; then
    echo "⚠️  WEBHOOK_URL already exists in .env"
else
    echo "WEBHOOK_URL=https://verifi.wtf/api/webhooks/nodit" >> /opt/verifi-indexer/.env
    echo "✅ Added WEBHOOK_URL to .env"
fi
EOF1

# Step 2: Create webhook client package
echo ""
echo "📝 Step 2: Creating webhook client package..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF2'
# Create webhook directory
mkdir -p /root/repos/verifi-services/indexer-service/internal/webhook

# Create webhook client
cat > /root/repos/verifi-services/indexer-service/internal/webhook/client.go << 'WEBHOOK_EOF'
package webhook

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type WebhookClient struct {
	URL    string
	Client *http.Client
}

type WebhookPayload struct {
	Event       EventData       `json:"event"`
	Transaction TransactionData `json:"transaction"`
}

type EventData struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

type TransactionData struct {
	Hash      string `json:"hash"`
	Sender    string `json:"sender"`
	Timestamp string `json:"timestamp"`
}

func NewWebhookClient(url string) *WebhookClient {
	return &WebhookClient{
		URL: url,
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (w *WebhookClient) SendEvent(eventType string, eventData map[string]interface{}, txHash string, sender string) error {
	payload := WebhookPayload{
		Event: EventData{
			Type: eventType,
			Data: eventData,
		},
		Transaction: TransactionData{
			Hash:      txHash,
			Sender:    sender,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	log.Printf("🔔 Sending webhook to %s for event %s", w.URL, eventType)

	req, err := http.NewRequest("POST", w.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create webhook request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := w.Client.Do(req)
	if err != nil {
		log.Printf("⚠️  Webhook request failed (non-critical): %v", err)
		return nil
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("✅ Webhook delivered successfully: %s", string(body))
	} else {
		log.Printf("⚠️  Webhook returned non-success status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
WEBHOOK_EOF

echo "✅ Webhook client created at /root/repos/verifi-services/indexer-service/internal/webhook/client.go"
EOF2

# Step 3: Upload VPS setup guide
echo ""
echo "📝 Step 3: Uploading setup guide to VPS..."
scp docs/VPS_WEBHOOK_SETUP.md ${VPS_USER}@${VPS_IP}:/root/WEBHOOK_SETUP_GUIDE.md

echo ""
echo "✅ Preparation complete!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 NEXT STEPS - Manual Code Updates Required"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "The webhook client has been created on the VPS."
echo "Now you need to integrate it into the indexer code."
echo ""
echo "Option 1: Use Claude on the VPS"
echo "───────────────────────────────────"
echo "1. SSH to VPS:"
echo "   ssh ${VPS_USER}@${VPS_IP}"
echo ""
echo "2. Share this guide with Claude:"
echo "   cat /root/WEBHOOK_SETUP_GUIDE.md"
echo ""
echo "3. Ask Claude to:"
echo "   - Update listener.go to use webhook client"
echo "   - Update main.go to initialize webhook client"
echo "   - Rebuild and redeploy the service"
echo ""
echo "Option 2: Manual Updates"
echo "────────────────────────"
echo "Follow the guide at: /root/WEBHOOK_SETUP_GUIDE.md on the VPS"
echo ""
echo "Key files to edit:"
echo "  • /root/repos/verifi-services/indexer-service/internal/indexer/listener.go"
echo "  • /root/repos/verifi-services/indexer-service/cmd/server/main.go"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "💡 TIP: The webhook client is ready. You just need to wire it up!"
echo ""
