#!/bin/bash

# Deploy Webhook Integration to VPS
# This script updates the indexer service to trigger webhooks

set -e  # Exit on error

VPS_IP="198.144.183.32"
VPS_USER="root"
WEBHOOK_URL="https://verifi.wtf/api/webhooks/nodit"

echo "🚀 Starting Webhook Integration Deployment"
echo "VPS: ${VPS_IP}"
echo "Webhook URL: ${WEBHOOK_URL}"
echo ""

# Function to run commands on VPS
run_on_vps() {
    ssh ${VPS_USER}@${VPS_IP} "$@"
}

echo "📝 Step 1: Adding WEBHOOK_URL to environment"
run_on_vps "echo 'WEBHOOK_URL=${WEBHOOK_URL}' >> /opt/verifi-indexer/.env"
echo "✅ Environment updated"
echo ""

echo "📝 Step 2: Creating webhook client package on VPS"
run_on_vps 'cat > /root/repos/verifi-services/indexer-service/internal/webhook/client.go << '"'"'WEBHOOK_CLIENT_EOF'"'"'
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
WEBHOOK_CLIENT_EOF'
echo "✅ Webhook client created"
echo ""

echo "📝 Step 3: Instructions for manual code updates"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "You need to SSH into the VPS and update these files:"
echo ""
echo "1. SSH to VPS:"
echo "   ssh root@${VPS_IP}"
echo ""
echo "2. Edit /root/repos/verifi-services/indexer-service/internal/indexer/listener.go"
echo "   Add these changes:"
echo ""
echo "   a) Add import:"
echo '      import "indexer-service/internal/webhook"'
echo ""
echo "   b) Add webhookClient field to EventListener struct:"
echo "      type EventListener struct {"
echo "          client        *aptos.Client"
echo "          db            *sql.DB"
echo "          moduleAddress string"
echo "          lastVersion   uint64"
echo "          webhookClient *webhook.WebhookClient  // Add this"
echo "      }"
echo ""
echo "   c) Update NewEventListener function:"
echo "      func NewEventListener(client *aptos.Client, db *sql.DB, moduleAddress string, webhookURL string) *EventListener {"
echo "          return &EventListener{"
echo "              client:        client,"
echo "              db:            db,"
echo "              moduleAddress: moduleAddress,"
echo "              lastVersion:   0,"
echo "              webhookClient: webhook.NewWebhookClient(webhookURL),"
echo "          }"
echo "      }"
echo ""
echo "   d) In your event processing function, after saving to DB, add:"
echo "      // Trigger webhook"
echo "      if l.webhookClient != nil {"
echo "          eventData := make(map[string]interface{})"
echo "          // Convert your event data to map[string]interface{}"
echo "          // eventData[\"market_address\"] = ..."
echo "          // eventData[\"creator\"] = ..."
echo "          err := l.webhookClient.SendEvent(eventType, eventData, txHash, sender)"
echo "          if err != nil {"
echo "              log.Printf(\"Warning: webhook trigger failed: %v\", err)"
echo "          }"
echo "      }"
echo ""
echo "3. Edit /root/repos/verifi-services/indexer-service/cmd/server/main.go"
echo "   Update to pass webhookURL:"
echo ""
echo "      webhookURL := os.Getenv(\"WEBHOOK_URL\")"
echo "      if webhookURL == \"\" {"
echo "          log.Fatal(\"WEBHOOK_URL environment variable is required\")"
echo "      }"
echo ""
echo "      listener := indexer.NewEventListener("
echo "          aptosClient,"
echo "          db,"
echo "          moduleAddress,"
echo "          webhookURL,"
echo "      )"
echo ""
echo "4. Rebuild and deploy:"
echo "   cd /root/repos/verifi-services/indexer-service"
echo "   /usr/local/go/bin/go mod tidy"
echo "   /usr/local/go/bin/go build -o indexer ./cmd/server"
echo "   sudo systemctl stop verifi-indexer"
echo "   cp indexer /opt/verifi-indexer/"
echo "   chmod +x /opt/verifi-indexer/indexer"
echo "   sudo systemctl start verifi-indexer"
echo "   sudo journalctl -u verifi-indexer -f"
echo ""
echo "💡 TIP: You mentioned Claude is on the VPS - you can ask Claude to help with these edits!"
echo ""
echo "Would you like me to create a detailed guide that you can share with Claude on the VPS?"
