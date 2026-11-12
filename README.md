# Subiwaza

Plataforma web para conectar clientes con especialistas de oficios. Los clientes publican trabajos y reciben propuestas; los participantes pueden calificarse después de completar un trabajo.

## Ejecutar localmente

Requisitos: Node.js 20 o posterior y una base de datos MongoDB.

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env` y configura `MONGODB_URI` y `MONGODB_DATABASE`.
3. Inicia el sitio con `npm run dev`.
4. Para compilar, ejecuta `npm run build`; para iniciar el servidor compilado, usa `npm start`.

## Funciones incluidas

- Registro e inicio de sesión con perfiles de cliente, especialista o ambos.
- Datos de cuentas y trabajos almacenados en MongoDB.
- Publicación de trabajos, propuestas, selección de especialista, finalización y calificaciones en ambas direcciones.
- Acceso a datos limitado por cuenta y visualización de teléfonos para las partes del trabajo asignado cuando dieron su consentimiento.
- Perfiles editables y navegación adaptable a móvil.

## Datos guardados en MongoDB

La base predeterminada se llama `subiwaza`. Cuando el servidor recibe su primera solicitud con `MONGODB_URI` configurada, crea las colecciones y sus índices; no hace falta crearlas a mano. MongoDB valida los documentos al guardarlos.

- `users`: nombre, correo, teléfono, hash de contraseña, roles, oficio, zona, consentimiento, verificación y resumen de calificaciones.
- `sessions`: hash del token de sesión, cuenta asociada, creación y vencimiento. El token original no se guarda.
- `jobs`: dueño (`clientId`), descripción, categoría, zona, presupuesto, urgencia y estado. Las propuestas se guardan dentro de `offers` en el mismo trabajo.
- `reviews`: trabajo, autor, destinatario, estrellas y fecha. Un índice evita que una persona califique dos veces el mismo trabajo.

Las contraseñas se guardan como hashes, los teléfonos no se muestran públicamente y las rutas de servidor limitan consultas y cambios a los participantes autorizados.

## Configuración pendiente para producción

El archivo `.env.example` no contiene secretos. Nunca publiques `.env` ni credenciales. Antes de usar el sitio públicamente configura MongoDB y un servicio de alojamiento compatible con Node.js, dominio/HTTPS, correo para verificar cuentas y recuperar contraseñas, límites contra intentos de inicio de sesión, privacidad y soporte para moderación y reportes. La identidad y los teléfonos todavía no tienen verificación automática; la plataforma no procesa pagos ni sube fotos de trabajos.

## Pruebas y calidad

Ejecuta `npm test`, `npm run lint` y `npm run build` antes de publicar cambios.
