// Response messages in Spanish
export const MISSING_TIME_MESSAGE = "Entiendo tu mensaje, pero necesito que me indiques la hora.";
export const MISSING_DATE_MESSAGE = "Entiendo tu mensaje, pero necesito que me indiques el día.";
export const MISSING_PHONE_MESSAGE = "Necesito que me indiques el número de teléfono con código de país para poder agendar el mensaje (ejemplo: +56912345678).";
export const INVALID_MESSAGE = "No pude entender el mensaje. Por favor, intenta de nuevo con un mensaje que incluya la fecha y el contenido.";
export const UNAUTHORIZED_NUMBER = "Lo siento, este número no está autorizado para usar el bot.";

// View messages related constants
export const NO_MESSAGES = "No tienes mensajes programados pendientes.";
export const NO_MORE_MESSAGES = "No hay más mensajes programados para mostrar.";
export const INVALID_VIEW_REQUEST = "No pude entender tu solicitud. Puedes preguntarme 'qué mensajes tengo?' para ver tus mensajes programados.";
export const MORE_MESSAGES_AVAILABLE = "➕ Hay {count} mensajes más. Puedes decirme 'ver más' para continuar.";
export const ERROR_FETCHING_MESSAGES = "Lo siento, hubo un error al obtener tus mensajes. Por favor, intenta de nuevo más tarde.";
export const SHOWING_MESSAGES_HEADER = "📬 Estos son tus mensajes programados:";
export const SHOWING_MORE_MESSAGES_HEADER = "📬 Aquí tienes más mensajes:";
export const TOTAL_MESSAGES_SUMMARY = "📊 Total de mensajes programados: {count}";

// Database error messages
export const DATABASE_CONNECTION_ERROR = "Lo siento, hay un problema con la conexión a la base de datos. Por favor, intenta de nuevo más tarde.";
export const DATABASE_QUERY_ERROR = "Lo siento, hubo un error al consultar tus mensajes. Por favor, intenta de nuevo más tarde."; 