'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { ConnectedInstructions } from './ConnectedInstructions';

export function QRCodeDisplay() {
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Ensure this only runs on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // First, get connection status to determine if we need QR polling
  const statusQuery = api.whatsapp.getConnectionStatus.useQuery(undefined, {
    refetchInterval: isConnected ? false : 10000, // Stop polling once connected
    refetchOnWindowFocus: !isConnected, // Don't refetch on window focus if connected
    enabled: isClient,
  });

  // Update connection state when status changes - do this immediately
  useEffect(() => {
    if (statusQuery.data?.isConnected && !isConnected) {
      console.log('🟢 Connection detected, stopping QR polling');
      setIsConnected(true);
    }
  }, [statusQuery.data?.isConnected, isConnected]);

  // Only poll for QR code if not connected AND client-side ready
  const shouldPollQR = isClient && !isConnected && !statusQuery.data?.isConnected;
  
  const qrQuery = api.whatsapp.getQRCode.useQuery(undefined, {
    refetchInterval: shouldPollQR ? 8000 : false, // Poll every 8 seconds when trying to connect, stop when connected
    refetchOnWindowFocus: shouldPollQR,
    refetchOnMount: shouldPollQR,
    staleTime: 0,
    enabled: shouldPollQR, // Only enabled if not connected
  });

  // Debug logging with more details about polling state
  console.log('QRCodeDisplay render:', {
    isClient,
    isConnected,
    statusConnected: statusQuery.data?.isConnected,
    shouldPollQR,
    qrQuery: {
      isLoading: qrQuery.isLoading,
      isError: qrQuery.isError,
      hasData: !!qrQuery.data,
      enabled: shouldPollQR,
    },
    statusQuery: {
      isLoading: statusQuery.isLoading,
      isConnected: statusQuery.data?.isConnected,
    }
  });

  useEffect(() => {
    if (qrQuery.error) {
      // Don't show error if it's just because WhatsApp is already connected
      if (qrQuery.error.message?.includes('already connected')) {
        console.log('🟢 QR query stopped - WhatsApp already connected');
        setError(null);
        if (!isConnected) {
          setIsConnected(true);
        }
      } else {
        setError('Failed to generate QR code. Please try again.');
      }
    } else if (!qrQuery.data?.success && !qrQuery.data?.isConnected && shouldPollQR) {
      setError(qrQuery.data?.error || 'No QR code available. Please try again.');
    } else {
      setError(null);
    }
  }, [qrQuery.data, qrQuery.error, shouldPollQR, isConnected]);

  // If not on client-side yet, show loading
  if (!isClient) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg"></div>
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  // Check both queries for connection status (prioritize state variable)
  const finalIsConnected = isConnected || qrQuery.data?.isConnected || statusQuery.data?.isConnected;

  // Show instructions if WhatsApp is connected
  if (finalIsConnected) {
    return <ConnectedInstructions />;
  }

  if (qrQuery.isLoading) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg"></div>
        <p className="text-gray-500">Cargando código QR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-64 h-64 bg-red-50 flex items-center justify-center rounded-lg">
          <p className="text-red-500 text-center px-4">{error}</p>
        </div>
        <button
          onClick={() => qrQuery.refetch()}
          className="px-4 py-2 bg-[#0A2463] text-white rounded hover:bg-[#0A2463]/90 transition-colors"
        >
          Intentar de Nuevo
        </button>
      </div>
    );
  }

  if (!qrQuery.data?.qrCode) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-64 h-64 bg-yellow-50 flex items-center justify-center rounded-lg">
          <p className="text-yellow-700 text-center px-4">
            Esperando código QR...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <QRCode value={qrQuery.data.qrCode} size={256} />
      </div>
      
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold text-[#0A2463]">
          Para vincular tu WhatsApp:
        </h2>
        <ol className="space-y-2 text-left">
          <li>1. Abre WhatsApp en tu teléfono</li>
          <li>2. Toca Menú o Configuración y selecciona Dispositivos Vinculados</li>
          <li>3. Toca en &quot;Vincular un Dispositivo&quot;</li>
          <li>4. Apunta tu teléfono hacia esta pantalla para capturar el código QR</li>
        </ol>
      </div>
    </div>
  );
} 