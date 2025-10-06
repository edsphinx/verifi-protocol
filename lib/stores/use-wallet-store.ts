/**
 * @file Wallet Store
 * @description Zustand store for wallet persistence and reconnection
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface WalletStore {
  // Persisted State
  lastConnectedAddress: string | null;
  lastConnectedWalletName: string | null;
  autoReconnectAttempted: boolean;

  // Session State
  isConnecting: boolean;
  connectionError: string | null;

  // Actions
  setWalletConnected: (address: string, walletName: string) => void;
  setWalletDisconnected: () => void;
  setConnectionError: (error: string | null) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  markReconnectAttempted: () => void;
  resetReconnectFlag: () => void;

  // Helpers
  shouldAttemptReconnect: () => boolean;
}

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        lastConnectedAddress: null,
        lastConnectedWalletName: null,
        autoReconnectAttempted: false,
        isConnecting: false,
        connectionError: null,

        // Actions
        setWalletConnected: (address, walletName) =>
          set((state) => {
            state.lastConnectedAddress = address;
            state.lastConnectedWalletName = walletName;
            state.isConnecting = false;
            state.connectionError = null;
            state.autoReconnectAttempted = false;
          }),

        setWalletDisconnected: () =>
          set((state) => {
            // Clear persisted data when user manually disconnects
            state.lastConnectedAddress = null;
            state.lastConnectedWalletName = null;
            state.isConnecting = false;
            state.connectionError = null;
            state.autoReconnectAttempted = false;
          }),

        setConnectionError: (error) =>
          set((state) => {
            state.connectionError = error;
            state.isConnecting = false;
          }),

        setIsConnecting: (isConnecting) =>
          set((state) => {
            state.isConnecting = isConnecting;
          }),

        markReconnectAttempted: () =>
          set((state) => {
            state.autoReconnectAttempted = true;
          }),

        resetReconnectFlag: () =>
          set((state) => {
            state.autoReconnectAttempted = false;
          }),

        // Helpers
        shouldAttemptReconnect: () => {
          const { lastConnectedAddress, autoReconnectAttempted } = get();
          return !!lastConnectedAddress && !autoReconnectAttempted;
        },
      })),
      {
        name: "wallet-storage",
        partialize: (state) => ({
          lastConnectedAddress: state.lastConnectedAddress,
          lastConnectedWalletName: state.lastConnectedWalletName,
        }),
      },
    ),
    { name: "WalletStore" },
  ),
);
