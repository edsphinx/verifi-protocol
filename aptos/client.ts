import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { APTOS_API_KEY, NETWORK } from "./constants";

let aptos: Aptos | null = null;

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  if (!aptos) {
    // Only include API_KEY if it's defined
    const clientConfig = APTOS_API_KEY ? { API_KEY: APTOS_API_KEY } : undefined;

    console.log('[aptos/client] Creating Aptos client (lazy):', {
      network: NETWORK,
      hasApiKey: !!APTOS_API_KEY,
      hasClientConfig: !!clientConfig,
      apiKeyPreview: APTOS_API_KEY ? APTOS_API_KEY.substring(0, 15) + '...' : 'NOT_SET',
    });

    aptos = new Aptos(
      new AptosConfig({
        network: NETWORK,
        ...(clientConfig && { clientConfig }),
      }),
    );

    console.log('[aptos/client] Aptos client created successfully');
  }

  return aptos;
}
