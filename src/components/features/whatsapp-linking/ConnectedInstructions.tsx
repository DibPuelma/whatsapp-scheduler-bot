'use client';

import { CheckCircleIcon, ClockIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { api } from '@/utils/api';

export function ConnectedInstructions() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A2463]">
          🎉 ¡WhatsApp Conectado Exitosamente!
        </h2>
        <p className="text-gray-600">
          Tu WhatsApp ya está vinculado. Puedes comenzar a programar mensajes a cualquier contacto.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <h3 className="text-xl font-semibold text-[#0A2463] flex items-center">
          <ClockIcon className="h-6 w-6 mr-2" />
          Cómo Programar Mensajes
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Envíate un mensaje a ti mismo en WhatsApp con el siguiente formato para programar mensajes:
          </p>
          
          {/* Command Examples */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#0A2463]">
              <h4 className="font-medium text-[#0A2463] mb-2">📅 Programar para fecha y hora específica:</h4>
              <code className="bg-gray-800 text-green-400 p-2 rounded block text-sm">
                /schedule +1234567890 &quot;2024-12-25 10:30&quot; &quot;¡Feliz Navidad! 🎄&quot;
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Envía &quot;¡Feliz Navidad! 🎄&quot; a +1234567890 el 25 de diciembre de 2024 a las 10:30 AM
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-600 mb-2">⏰ Programar para más tarde hoy:</h4>
              <code className="bg-gray-800 text-green-400 p-2 rounded block text-sm">
                /schedule +1234567890 &quot;18:00&quot; &quot;¡No olvides nuestra reunión!&quot;
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Envía el mensaje hoy a las 6:00 PM
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-medium text-purple-600 mb-2">📱 Programar usando nombre de contacto:</h4>
              <code className="bg-gray-800 text-green-400 p-2 rounded block text-sm">
                /schedule &quot;Juan Pérez&quot; &quot;mañana 9:00&quot; &quot;¡Buenos días! ¿Listo para nuestra llamada?&quot;
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Usa el nombre del contacto desde tus contactos de WhatsApp
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-medium text-orange-600 mb-2">🔄 Programar mensajes recurrentes:</h4>
              <code className="bg-gray-800 text-green-400 p-2 rounded block text-sm">
                /schedule +1234567890 &quot;cada lunes 9:00&quot; &quot;¡Hora del seguimiento semanal!&quot;
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Envía el mensaje cada lunes a las 9:00 AM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-[#0A2463] flex items-center mb-4">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Formatos de Tiempo Soportados
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <code className="bg-gray-100 px-1 rounded">2024-12-25 10:30</code> - Fecha y hora específica</li>
            <li>• <code className="bg-gray-100 px-1 rounded">mañana 15:00</code> - Fechas relativas</li>
            <li>• <code className="bg-gray-100 px-1 rounded">próximo viernes 9:00</code> - Nombres de días</li>
            <li>• <code className="bg-gray-100 px-1 rounded">en 2 horas</code> - Tiempo relativo</li>
            <li>• <code className="bg-gray-100 px-1 rounded">cada lunes 9:00</code> - Recurrente</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-[#0A2463] flex items-center mb-4">
            <UserIcon className="h-5 w-5 mr-2" />
            Formatos de Contacto
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <code className="bg-gray-100 px-1 rounded">+1234567890</code> - Formato internacional</li>
            <li>• <code className="bg-gray-100 px-1 rounded">&quot;Juan Pérez&quot;</code> - Nombre de contacto</li>
            <li>• <code className="bg-gray-100 px-1 rounded">1234567890</code> - Número local</li>
            <li>• ¡Los nombres de grupo también funcionan!</li>
          </ul>
        </div>
      </div>

      {/* Management Commands */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-[#0A2463] mb-4">
          📋 Comandos de Gestión
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <code className="bg-gray-800 text-green-400 p-2 rounded block mb-2">/list</code>
            <p className="text-gray-600">Ver todos tus mensajes programados</p>
          </div>
          <div>
            <code className="bg-gray-800 text-green-400 p-2 rounded block mb-2">/cancel [id]</code>
            <p className="text-gray-600">Cancelar un mensaje programado por ID</p>
          </div>
          <div>
            <code className="bg-gray-800 text-green-400 p-2 rounded block mb-2">/help</code>
            <p className="text-gray-600">Obtener ayuda y ver todos los comandos</p>
          </div>
          <div>
            <code className="bg-gray-800 text-green-400 p-2 rounded block mb-2">/status</code>
            <p className="text-gray-600">Verificar el estado de conexión del bot</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-[#0A2463] mb-3">
          💡 Consejos Útiles
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Los mensajes se envían en tu zona horaria local</li>
          <li>• Usa comillas alrededor de nombres de contactos con espacios</li>
          <li>• El bot funciona 24/7, por lo que los mensajes programados se enviarán incluso cuando estés desconectado</li>
          <li>• Puedes programar mensajes hasta con 1 año de anticipación</li>
          <li>• Los emojis y caracteres especiales son totalmente compatibles</li>
        </ul>
      </div>

      {/* Quick Start */}
      <div className="text-center bg-[#0A2463] text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">🚀 ¿Listo para comenzar?</h3>
        <p className="text-sm opacity-90 mb-4">
          ¡Abre WhatsApp y envíate un mensaje con el formato de arriba para programar tu primer mensaje!
        </p>
        
        {/* Disconnect Button */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <DisconnectButton />
        </div>
      </div>
    </div>
  );
}

function DisconnectButton() {
  const utils = api.useUtils();
  const resetMutation = api.whatsapp.resetConnection.useMutation({
    onSuccess: () => {
      // Invalidate the QR code query to trigger a refresh
      utils.whatsapp.getQRCode.invalidate();
    },
  });

  return (
    <button
      onClick={() => resetMutation.mutate()}
      disabled={resetMutation.isPending}
      className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition-colors disabled:opacity-50 text-sm"
    >
      {resetMutation.isPending ? 'Desconectando...' : 'Desconectar y Mostrar Código QR Nuevamente'}
    </button>
  );
} 