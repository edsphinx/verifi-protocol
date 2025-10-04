/**
 * @file Wallet Sync Component
 * @description Syncs Aptos Wallet Adapter with Zustand store for persistence
 */

'use client';

import { useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useWalletStore } from '@/lib/stores';

export function WalletSync() {
  const {
    connected,
    account,
    wallet,
    disconnect,
  } = useWallet();

  const {
    setWalletConnected,
    setWalletDisconnected,
    shouldAttemptReconnect,
    markReconnectAttempted,
    lastConnectedAddress,
  } = useWalletStore();

  // Sync wallet connection to store
  useEffect(() => {
    if (connected && account?.address) {
      const address = account.address.toString();
      const walletName = wallet?.name || 'Unknown';

      // Only update if address changed (prevent infinite loops)
      if (address !== lastConnectedAddress) {
        setWalletConnected(address, walletName);
        console.log('[WalletSync] Wallet connected:', { address, walletName });
      }
    } else if (!connected) {
      // Only clear if we had a connection before
      if (lastConnectedAddress && !shouldAttemptReconnect()) {
        setWalletDisconnected();
        console.log('[WalletSync] Wallet disconnected');
      }
    }
  }, [
    connected,
    account,
    wallet,
    lastConnectedAddress,
    setWalletConnected,
    setWalletDisconnected,
    shouldAttemptReconnect,
  ]);

  // Auto-reconnect on mount if we have a saved address
  useEffect(() => {
    if (shouldAttemptReconnect() && !connected) {
      console.log('[WalletSync] Attempting auto-reconnect...');
      markReconnectAttempted();

      // The wallet adapter's autoConnect should handle this
      // We just mark the attempt to prevent infinite loops
    }
  }, [shouldAttemptReconnect, connected, markReconnectAttempted]);

  // Manual disconnect handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear on page refresh, only on manual disconnect
      // The persist middleware will handle page refreshes
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // This component doesn't render anything, it just syncs state
  return null;
}
