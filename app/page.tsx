"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AccountInfo } from "@/components/AccountInfo";
import { Header } from "@/components/Header";
import { NetworkInfo } from "@/components/NetworkInfo";
import { TransferAPT } from "@/components/TransferAPT";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletDetails } from "@/components/WalletDetails";
import { MessageBoard } from "../components/MessageBoard";

function PlaceholderForMarketCreator() {
  return (
    <p className="text-muted-foreground">
      Aquí irá nuestro dashboard para crear mercados de VeriFi Protocol.
    </p>
  );
}

export default function HomePage() {
  const { connected } = useWallet();

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        {connected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna 1 */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletDetails />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Red</CardTitle>
                </CardHeader>
                <CardContent>
                  <NetworkInfo />
                </CardContent>
              </Card>
            </div>

            {/* Columna 2 */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Cuenta</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountInfo />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Transferir APT</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* SIGUIENTE PASO: Añadimos TransferAPT */}
                  <TransferAPT />
                </CardContent>
              </Card>
            </div>

            {/* Componente de Ancho Completo */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tablón de Mensajes</CardTitle>
                </CardHeader>
                <CardContent>
                  <MessageBoard />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <CardTitle>Conecta una wallet para empezar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Por favor, conecta tu wallet usando el botón en la esquina
                  superior derecha.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
