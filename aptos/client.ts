import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { APTOS_API_KEY, NETWORK } from "./constants";

let aptos: Aptos | null = null;

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  if (!aptos) {
    console.log('[aptos/client] Creating Aptos client (lazy):', {
      network: NETWORK,
      hasApiKey: !!APTOS_API_KEY,
      apiKeyPreview: APTOS_API_KEY ? APTOS_API_KEY.substring(0, 15) + '...' : 'NOT_SET',
    });

    // Create config with API key in clientConfig
    const aptosConfig = new AptosConfig({
      network: NETWORK,
      clientConfig: APTOS_API_KEY ? {
        API_KEY: APTOS_API_KEY,
      } : undefined,
    });

    aptos = new Aptos(aptosConfig);

    console.log('[aptos/client] Aptos client created successfully');
  }

  return aptos;
}
