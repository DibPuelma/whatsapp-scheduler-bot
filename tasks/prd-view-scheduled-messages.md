# PRD: Ver Mensajes Programados por WhatsApp

## Introducción/Resumen
Esta funcionalidad permite a los usuarios consultar sus mensajes programados pendientes directamente a través de WhatsApp mediante lenguaje natural. Los usuarios podrán ver sus próximos mensajes programados de una manera fácil y conversacional, con la opción de ver más mensajes si tienen más de 10 programados.

## Objetivos
1. Permitir a los usuarios ver sus mensajes programados pendientes de manera sencilla
2. Mantener una experiencia conversacional natural en español
3. Proporcionar información clara y concisa sobre cada mensaje programado
4. Gestionar eficientemente la visualización de múltiples mensajes

## Historias de Usuario
- Como usuario del bot, quiero poder ver mis mensajes programados pendientes para saber qué mensajes tengo planificados
- Como usuario del bot, quiero poder preguntar por mis mensajes de forma natural para no tener que recordar comandos específicos
- Como usuario del bot, quiero poder ver más mensajes si tengo más de 10 programados para tener una vista completa de mis programaciones

## Requerimientos Funcionales
1. El sistema debe reconocer preguntas en lenguaje natural sobre mensajes programados
   - Ejemplos: "¿Qué mensajes tengo programados?", "Muéstrame mis mensajes", "Ver mensajes pendientes"

2. El sistema debe mostrar solo los mensajes pendientes del usuario que realiza la consulta
   - Filtrar por número de teléfono del remitente
   - Mostrar solo mensajes con estado "pending"

3. Para cada mensaje, el sistema debe mostrar:
   - Fecha y hora programada
   - Número de teléfono del destinatario
   - Contenido del mensaje

4. El sistema debe limitar la visualización inicial a 10 mensajes
   - Ordenar mensajes por fecha de envío (más próximos primero)
   - Indicar si existen más mensajes además de los mostrados

5. El sistema debe permitir solicitar más mensajes
   - Reconocer peticiones de "ver más" o similares
   - Mostrar los siguientes 10 mensajes en orden

6. El sistema debe proporcionar respuestas apropiadas cuando:
   - No hay mensajes programados
   - No hay más mensajes para mostrar
   - Se produce un error en la consulta

## No Incluido (Fuera de Alcance)
- Edición o cancelación de mensajes desde la vista de mensajes
- Filtros por fecha o destinatario
- Soporte para otros idiomas además del español
- Visualización de mensajes ya enviados o fallidos
- Interacción directa con los mensajes mostrados

## Consideraciones de Diseño
- Los mensajes deben mostrarse en un formato claro y fácil de leer
- Ejemplo de formato para cada mensaje:
  ```
  📅 [Fecha y Hora]
  📱 Para: [Número de teléfono]
  💬 Mensaje: [Contenido]
  ```
- Si hay más mensajes disponibles, agregar al final:
  ```
  ➕ Hay X mensajes más. Puedes pedirme "ver más" para continuar.
  ```

## Consideraciones Técnicas
- Integrar con el sistema existente de procesamiento de lenguaje natural
- Utilizar la base de datos actual de mensajes programados
- Mantener un registro de la última página vista por usuario para la paginación
- Asegurar que las consultas a la base de datos estén optimizadas para grandes volúmenes de mensajes

## Métricas de Éxito
1. Los usuarios pueden ver sus mensajes programados en el primer intento (tasa de éxito > 90%)
2. El tiempo de respuesta para mostrar los mensajes es menor a 2 segundos
3. Los usuarios entienden cuando hay más mensajes disponibles y cómo verlos
4. Reducción en consultas de soporte sobre "cómo ver mensajes programados"

## Preguntas Abiertas
1. ¿Debería implementarse un comando de ayuda específico para esta funcionalidad?
2. ¿Cómo manejar mensajes muy largos en la visualización?
3. ¿Deberíamos agregar un resumen inicial (ej: "Tienes X mensajes programados")? 