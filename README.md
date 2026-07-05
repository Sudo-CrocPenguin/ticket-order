# Ticket Order

Ticket Order es una aplicacion cliente-servidor para equipos de desarrollo que
necesitan registrar bugs, adjuntar evidencias y dar seguimiento al estado de
cada problema por empresa y por aplicacion.

El proyecto nacio como una app Expo con persistencia local. Ahora esta preparado
como una aplicacion completa:

- Cliente Expo para mobile y web.
- Supabase como backend central con Postgres, Auth y Storage.
- Actualizaciones OTA con Expo EAS Update.
- Pantalla de conectividad cuando no hay internet.
- Notificaciones push para nuevos tickets y cambios de estado.
- Pantalla de estadisticas por estado, prioridad y aplicacion.
- API Node.js modular conservada como legado local.
- Persistencia local del servidor en JSON conservada solo para desarrollo legado.
- Cache local del cliente para tolerar fallos de conexion.
- Despliegue web + API en Hostinger VPS con Docker y Nginx.

## Para que sirve

Sirve para centralizar tickets tecnicos de una empresa de desarrollo. Un equipo
puede crear tickets asociados a una aplicacion, adjuntar imagenes o documentos
como evidencia, y mover el ticket por estos estados:

- `pending`: pendiente.
- `in_progress`: en progreso.
- `completed`: completado.

Cada cambio de estado queda registrado en el historial del ticket.

## Stack

- Expo SDK 54.
- React Native 0.81.
- React 19.
- React Navigation 7.
- AsyncStorage para sesion/cache del cliente.
- Expo Document Picker y File System para evidencias.
- Supabase Auth, Postgres, Row Level Security y Storage.
- Node.js HTTP API sin framework externo conservada como legado.
- Docker + Nginx para despliegue Hostinger.

## Estructura

```text
App.js
src/                    Cliente Expo mobile/web
  components/           UI reutilizable
  context/              Estado cliente-servidor
  navigation/           Login gate y tabs
  screens/              Pantallas de producto
  services/             API, sesion, cache y evidencias
  styles/               Tokens visuales
  utils/                Formato, busqueda y etiquetas UI
server/                 API Node.js
  src/application/      Casos de uso
  src/config/           Entorno y carga .env
  src/infrastructure/   HTTP, seguridad, persistencia y archivos
shared/domain/          Entidades y reglas DDD/POO
deploy/hostinger/       Docker, Nginx y guia VPS
docs/                   Arquitectura y API
```

## Como funciona

1. El cliente inicia sesion con Supabase Auth.
2. El cliente carga empresa, aplicaciones y tickets desde Supabase Postgres.
3. Las reglas multiempresa se protegen con Row Level Security.
4. Las acciones de crear ticket, cambiar estado, comentar o adjuntar evidencia
   usan funciones RPC y Supabase Storage.
5. El cliente guarda una cache local de workspace para mostrar la ultima copia
   disponible si falla la conexion.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Crea `.env` desde el ejemplo y configura Supabase:

```bash
cp .env.example .env
```

Ejecuta el SQL de Supabase:

```text
docs/supabase-schema.sql
```

La API local queda como legado. Solo levantala si quieres probar el servidor JSON
anterior:

```bash
npm run api
```

Levanta el cliente:

```bash
npm start
```

Para web:

```bash
npm run web
```

En un dispositivo fisico no necesitas IP LAN para la base central: la app se
conecta a `EXPO_PUBLIC_SUPABASE_URL`.

## Comandos

```bash
npm run api        # API Node local
npm start          # Expo
npm run android    # Expo Android
npm run ios        # Expo iOS
npm run web        # Expo Web dev
npm run build:web  # export web estatica a dist/
npm test           # pruebas Node del dominio y servicios
```

Para publicar cambios OTA despues de tener una build con `expo-updates`:

```bash
eas update --channel production --message "Descripcion del cambio"
```

## Seguridad de secretos

No se versionan `.env`, datos locales, uploads ni builds. Revisa:

- `.gitignore`
- `.env.example`
- `deploy/hostinger/.env.example`

En produccion cambia obligatoriamente:

- `JWT_SECRET`
- `SEED_ADMIN_PASSWORD`
- `CORS_ORIGIN`

## Documentacion adicional

- [Arquitectura](docs/ARCHITECTURE.md)
- [Supabase setup](docs/SUPABASE_SETUP.md)
- [Expo updates](docs/EXPO_UPDATES.md)
- [Push notifications](docs/PUSH_NOTIFICATIONS.md)
- [API REST legado](docs/API.md)
- [Despliegue Hostinger](deploy/hostinger/README.md)

## Estado actual

Implementado:

- Cliente conectado a Supabase Auth, Postgres y Storage.
- API legado con login, empresa actual, aplicaciones, tickets, estados,
  comentarios y evidencias.
- Registro de nuevas empresas con administrador inicial.
- Pantalla Admin para crear, editar y activar/desactivar aplicaciones y usuarios.
- Pantalla de estadisticas por estado, prioridad, criticidad y aplicacion.
- Dominio DDD/POO compartido.
- Cliente Expo conectado a API.
- Version web responsive compilable.
- Cache local del cliente.
- Docker/Nginx para Hostinger VPS.
- Pruebas basicas del dominio y servicios.

Siguientes mejoras naturales:

- Base PostgreSQL para produccion de mayor escala.
- Reseteo seguro de contrasenas.
- Asignacion de tickets.
- Descarga/preview avanzada de evidencias desde mobile.
