'use client';

import { QRCodeDisplay } from '@/components/features/whatsapp-linking/QRCodeDisplay';
import { api } from '@/utils/api';

export default function LinkWhatsAppPage() {
  const qrQuery = api.whatsapp.getQRCode.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const isConnected = qrQuery.data?.isConnected;
  const title = isConnected 
    ? 'Bot Programador de WhatsApp - Cómo Usar' 
    : 'Vincular tu Cuenta de WhatsApp';

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className={`w-full px-8 ${isConnected ? 'max-w-6xl mx-auto' : 'max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen'}`}>
        <h1 className="text-3xl font-bold text-center mb-8 text-[#0A2463]">
          {title}
        </h1>
        <QRCodeDisplay />
      </div>
    </main>
  );
} 