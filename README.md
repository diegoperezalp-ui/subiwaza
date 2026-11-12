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

## Configuración pendiente para producción

El archivo `.env.example` no contiene secretos. Nunca publiques `.env` ni credenciales. Antes de usar el sitio públicamente configura MongoDB y un servicio de alojamiento compatible con Node.js, dominio/HTTPS, correo para verificar cuentas y recuperar contraseñas, límites contra intentos de inicio de sesión, privacidad y soporte para moderación y reportes. La identidad y los teléfonos todavía no tienen verificación automática; la plataforma no procesa pagos ni sube fotos de trabajos.

## Pruebas y calidad

Ejecuta `npm test`, `npm run lint` y `npm run build` antes de publicar cambios.
