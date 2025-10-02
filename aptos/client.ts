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

    const config: any = {
      network: NETWORK,
    };

    // API key must be in clientConfig, not in the root
    if (APTOS_API_KEY) {
      config.clientConfig = {
        API_KEY: APTOS_API_KEY,
      };
    }

    aptos = new Aptos(new AptosConfig(config));

    console.log('[aptos/client] Aptos client created successfully');
  }

  return aptos;
}
