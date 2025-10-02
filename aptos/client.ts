import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { NETWORK } from "./constants";

let aptos: Aptos | null = null;

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  if (!aptos) {
    console.log('[aptos/client] Creating Aptos client:', {
      network: NETWORK,
    });

    const aptosConfig = new AptosConfig({
      network: NETWORK,
    });

    aptos = new Aptos(aptosConfig);

    console.log('[aptos/client] Aptos client created successfully');
  }

  return aptos;
}
