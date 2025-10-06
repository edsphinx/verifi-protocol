"use client";

import {
  AboutAptosConnect,
  type AboutAptosConnectEducationScreen,
  type AdapterNotDetectedWallet,
  type AdapterWallet,
  APTOS_CONNECT_ACCOUNT_URL,
  AptosPrivacyPolicy,
  groupAndSortWallets,
  isAptosConnectWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
  WalletItem,
} from "@aptos-labs/wallet-adapter-react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  LogOut,
  User,
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NETWORK } from "@/aptos/constants";
// import { useSIWAAuth } from "@/lib/hooks/use-siwa-auth"; // Excluded from production build
// import { UnifiedAuthButton } from "@/components/UnifiedAuthButton"; // Excluded from production build

export function WalletSelector() {
  const { account, connected, disconnect, wallet } = useWallet();
  // const { signIn, signOut, isAuthenticating, isAuthenticated } = useSIWAAuth(); // Excluded from production build
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [hasTriggeredSignIn, setHasTriggeredSignIn] = useState(false);

  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  // SIWA auto-trigger disabled - users must manually sign in
  // useEffect(() => {
  //   if (connected && account?.address && !isAuthenticated && !hasTriggeredSignIn && !isAuthenticating) {
  //     setHasTriggeredSignIn(true);
  //     // Small delay to ensure wallet is fully connected
  //     setTimeout(() => {
  //       signIn().catch((error) => {
  //         console.error("Auto sign-in failed:", error);
  //         setHasTriggeredSignIn(false); // Allow retry
  //       });
  //     }, 500);
  //   }

  //   // Reset trigger when wallet disconnects
  //   if (!connected) {
  //     setHasTriggeredSignIn(false);
  //   }
  // }, [connected, account?.address, isAuthenticated, hasTriggeredSignIn, isAuthenticating, signIn]);

  // Set timeout if wallet address doesn't load within 5 seconds
  useEffect(() => {
    if (connected && !account?.address) {
      const timer = setTimeout(() => setLoadingTimeout(true), 5000);
      return () => clearTimeout(timer);
    }
    setLoadingTimeout(false);
  }, [connected, account?.address]);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    const address = account?.address?.toString();
    if (!address) return;

    try {
      await navigator.clipboard.writeText(account.address.toString());
      toast.success("Success", {
        description: "Copied wallet address to clipboard.",
      });
    } catch (error: any) {
      console.error(`Failed to fetch message content: ${error.message}`);
    }
  }, [account?.address]);

  const getNetworkDisplay = () => {
    const networkName = `Aptos ${NETWORK.charAt(0).toUpperCase() + NETWORK.slice(1).toLowerCase()}`;
    const networkColor =
      NETWORK === "mainnet"
        ? "bg-green-500"
        : NETWORK === "testnet"
          ? "bg-yellow-500"
          : "bg-blue-500";

    return { name: networkName, color: networkColor };
  };

  const networkInfo = getNetworkDisplay();

  return connected ? (
    <div className="flex items-center gap-2">
      {/* <UnifiedAuthButton /> - Excluded from production build */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 font-mono text-sm border-border/40 hover:border-primary/40"
          >
            <div
              className={`h-2 w-2 rounded-full ${connected && account?.address ? "bg-green-400" : loadingTimeout ? "bg-red-400" : "bg-yellow-400"}`}
            />
            {account?.ansName ||
              (account?.address
                ? truncateAddress(account.address.toString())
                : loadingTimeout
                  ? "Error"
                  : "Loading...")}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Connected Wallet
              </p>
              <p className="font-mono text-xs truncate">
                {account?.address?.toString()}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div
                className={`h-1.5 w-1.5 rounded-full ${networkInfo.color}`}
              />
              <p className="text-xs text-muted-foreground">
                {networkInfo.name}
              </p>
            </div>
          </div>
          <DropdownMenuItem onSelect={copyAddress} className="gap-2">
            <Copy className="h-4 w-4" /> Copy Address
          </DropdownMenuItem>
          {wallet && isAptosConnectWallet(wallet) && (
            <DropdownMenuItem asChild>
              <a
                href={APTOS_CONNECT_ACCOUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2"
              >
                <User className="h-4 w-4" /> View Account
              </a>
            </DropdownMenuItem>
          )}
          {/* {isAuthenticated && (
            <DropdownMenuItem onSelect={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          )} - Excluded from production build */}
          <DropdownMenuItem
            onSelect={disconnect}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <User className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <ConnectWalletDialog close={closeDialog} />
    </Dialog>
  );
}

interface ConnectWalletDialogProps {
  close: () => void;
}

function ConnectWalletDialog({ close }: ConnectWalletDialogProps) {
  const { wallets = [], notDetectedWallets = [] } = useWallet();
  const { aptosConnectWallets, availableWallets, installableWallets } =
    groupAndSortWallets([...wallets, ...notDetectedWallets]);

  const hasAptosConnectWallets = !!aptosConnectWallets.length;

  return (
    <DialogContent className="max-h-screen overflow-auto">
      <AboutAptosConnect renderEducationScreen={renderEducationScreen}>
        <DialogHeader>
          <DialogTitle className="flex flex-col text-center leading-snug">
            {hasAptosConnectWallets ? (
              <>
                <span>Log in or sign up</span>
                <span>with Social + Aptos Connect</span>
              </>
            ) : (
              "Connect Wallet"
            )}
          </DialogTitle>
        </DialogHeader>

        {hasAptosConnectWallets && (
          <div className="flex flex-col gap-2 pt-3">
            {aptosConnectWallets.map((wallet) => (
              <AptosConnectWalletRow
                key={wallet.name}
                wallet={wallet}
                onConnect={close}
              />
            ))}
            <p className="flex gap-1 justify-center items-center text-muted-foreground text-sm">
              Learn more about{" "}
              <AboutAptosConnect.Trigger className="flex gap-1 py-3 items-center text-foreground">
                Aptos Connect <ArrowRight size={16} />
              </AboutAptosConnect.Trigger>
            </p>
            <AptosPrivacyPolicy className="flex flex-col items-center py-1">
              <p className="text-xs leading-5">
                <AptosPrivacyPolicy.Disclaimer />{" "}
                <AptosPrivacyPolicy.Link className="text-muted-foreground underline underline-offset-4" />
                <span className="text-muted-foreground">.</span>
              </p>
              <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-muted-foreground" />
            </AptosPrivacyPolicy>
            <div className="flex items-center gap-3 pt-4 text-muted-foreground">
              <div className="h-px w-full bg-secondary" />
              Or
              <div className="h-px w-full bg-secondary" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-3">
          {availableWallets.map((wallet) => (
            <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
          ))}
          {!!installableWallets.length && (
            <Collapsible className="flex flex-col gap-3">
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-2">
                  More wallets <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-3">
                {installableWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.name}
                    wallet={wallet}
                    onConnect={close}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </AboutAptosConnect>
    </DialogContent>
  );
}

interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border rounded-md"
    >
      <div className="flex items-center gap-4">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-base font-normal" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button size="sm" variant="ghost" asChild>
          <WalletItem.InstallLink />
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button size="sm">Connect</Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect}>
      <WalletItem.ConnectButton asChild>
        <Button size="lg" variant="outline" className="w-full gap-4">
          <WalletItem.Icon className="h-5 w-5" />
          <WalletItem.Name className="text-base font-normal" />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}

function renderEducationScreen(screen: AboutAptosConnectEducationScreen) {
  return (
    <>
      <DialogHeader className="grid grid-cols-[1fr_4fr_1fr] items-center space-y-0">
        <Button variant="ghost" size="icon" onClick={screen.cancel}>
          <ArrowLeft />
        </Button>
        <DialogTitle className="leading-snug text-base text-center">
          About Aptos Connect
        </DialogTitle>
      </DialogHeader>

      <div className="flex h-[162px] pb-3 items-end justify-center">
        <screen.Graphic />
      </div>
      <div className="flex flex-col gap-2 text-center pb-4">
        <screen.Title className="text-xl" />
        <screen.Description className="text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a]:text-foreground" />
      </div>

      <div className="grid grid-cols-3 items-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.back}
          className="justify-self-start"
        >
          Back
        </Button>
        <div className="flex items-center gap-2 place-self-center">
          {screen.screenIndicators.map((ScreenIndicator, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Using index as key is acceptable here because the list of screen indicators is static and its order does not change.
            <ScreenIndicator key={i} className="py-4">
              <div className="h-0.5 w-6 transition-colors bg-muted [[data-active]>&]:bg-foreground" />
            </ScreenIndicator>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={screen.next}
          className="gap-2 justify-self-end"
        >
          {screen.screenIndex === screen.totalScreens - 1 ? "Finish" : "Next"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
