# Ticket Order

Ticket Order es una aplicacion cliente-servidor para equipos de desarrollo que
necesitan registrar bugs, adjuntar evidencias y dar seguimiento al estado de
cada problema por empresa y por aplicacion.

El proyecto nacio como una app Expo con persistencia local. Ahora esta preparado
como una aplicacion completa:

- Cliente Expo movil en `apps/mobile`.
- Dashboard web Next.js en `apps/web`.
- Supabase como backend central con Postgres, Auth y Storage.
- Cuentas globales con membresias en multiples empresas.
- Invitaciones para agregar usuarios existentes a una empresa.
- Selector de empresa activa dentro de la app.
- Actualizaciones OTA con Expo EAS Update.
- Pantalla de conectividad cuando no hay internet.
- Notificaciones push para nuevos tickets y cambios de estado.
- Pantalla de estadisticas por estado, prioridad y aplicacion.
- API Node.js modular conservada como legado local.
- Persistencia local del servidor en JSON conservada solo para desarrollo legado.
- Cache local del cliente para tolerar fallos de conexion.
- Configuracion legacy de Docker/Nginx para Hostinger, conservada como referencia.

## Para que sirve

Sirve para centralizar tickets tecnicos de una empresa de desarrollo. Un equipo
puede crear tickets asociados a una aplicacion, adjuntar imagenes o documentos
como evidencia, y mover el ticket por estos estados:

- `pending`: pendiente.
- `in_progress`: en progreso.
- `completed`: completado.

Cada cambio de estado queda registrado en el historial del ticket.

## Stack

- Expo SDK 54 para la app movil en `apps/mobile`.
- Next.js para la web en `apps/web`.
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
apps/
  mobile/               App Expo / React Native
    App.js
    app.json
    eas.json
    src/
    assets/
  web/                  Dashboard web Next.js
    app/
    components/
    lib/
server/                 API Node.js
  src/application/      Casos de uso
  src/config/           Entorno y carga .env
  src/infrastructure/   HTTP, seguridad, persistencia y archivos
shared/domain/          Entidades y reglas DDD/POO
deploy/hostinger/       Docker, Nginx y guia VPS
docs/                   Arquitectura y API
```

La raiz del repositorio funciona como orquestador. Las aplicaciones reales viven
en `apps/`:

- `apps/mobile`: proyecto Expo completo. Desde aqui se ejecutan EAS Build y EAS
  Update.
- `apps/web`: proyecto Next.js completo. Desde aqui se despliega la web en
  Vercel, Netlify u otro hosting compatible con Next.js.

Las carpetas `shared/`, `supabase/`, `docs/` y `server/` se mantienen fuera de
`apps/` porque no son frontends desplegables. Son dominio compartido,
infraestructura, documentacion y API legacy.

## Como funciona

1. El cliente inicia sesion con Supabase Auth.
2. Cada cuenta tiene un perfil global y puede pertenecer a varias empresas.
3. El cliente carga la empresa activa, sus aplicaciones y tickets desde Supabase Postgres.
4. Las reglas multiempresa se protegen con Row Level Security y membresias.
5. Las acciones de crear ticket, cambiar estado, comentar o adjuntar evidencia
   usan funciones RPC y Supabase Storage.
6. Los administradores invitan correos ya registrados; el usuario acepta o rechaza
   desde Perfil.
7. El cliente guarda una cache local de workspace para mostrar la ultima copia
   disponible si falla la conexion.

## Flujo de usuarios y empresas

- `Crear cuenta` registra una cuenta global de Supabase Auth.
- `Perfil` permite crear empresas nuevas, ver invitaciones pendientes y cambiar
  entre empresas.
- `Admin` permite gestionar aplicaciones y enviar invitaciones a usuarios que ya
  tienen cuenta.
- Un usuario puede estar en varias empresas con roles distintos.
- El boton de empresa en la cabecera de Tickets cambia la empresa activa sin
  cerrar sesion.

## Desarrollo local

Instala dependencias:

```bash
npm install
npm --prefix apps/mobile install
npm --prefix apps/web install
```

Crea los `.env` desde los ejemplos y configura Supabase:

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env.local
```

Los dos clientes usan el mismo proyecto Supabase. La app movil lee variables
`EXPO_PUBLIC_*` desde `apps/mobile/.env`; la web lee variables `NEXT_PUBLIC_*`
desde `apps/web/.env.local`.

Ejecuta el SQL de Supabase:

```text
docs/supabase-schema.sql
```

La API local queda como legado. Solo levantala si quieres probar el servidor JSON
anterior:

```bash
npm run api
```

Levanta la app movil Expo:

```bash
npm start
```

Levanta la web Next.js:

```bash
npm run web
```

Tambien puedes ejecutar cada app desde su carpeta:

```bash
cd apps/mobile
npm install
npm start

cd apps/web
npm install
npm run dev
```

Tambien puedes ejecutarlas desde la raiz despues de instalar sus dependencias:

```bash
npm run mobile:start
npm run web:app:dev
```

En un dispositivo fisico no necesitas IP LAN para la base central: la app se
conecta a `EXPO_PUBLIC_SUPABASE_URL`.

## Comandos

```bash
npm run api        # API Node local
npm start          # Expo movil
npm run android    # Expo Android
npm run ios        # Expo iOS
npm run mobile:web # Expo Web legacy/dev
npm run web        # Next.js web app
npm run web:app:dev    # Next.js web app
npm run web:app:build  # build de la web Next.js
npm run web:app:start  # servir build Next.js
npm run build:web        # build de la web Next.js
npm run build:mobile:web # export Expo web estatica
npm test           # pruebas Node del dominio y servicios
```

Para publicar cambios OTA despues de tener una build con `expo-updates`:

```bash
cd apps/mobile
eas update --branch preview --platform android --environment preview --message "Descripcion del cambio"
```

Para producción:

```bash
cd apps/mobile
eas update --channel production --message "Descripcion del cambio"
```

Para desplegar la web Next.js, usa `apps/web` como directorio del proyecto y
configura estas variables en el hosting:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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

La app Expo solo usa variables publicas de Supabase:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Nunca pongas `service_role` ni keys secretas dentro del cliente Expo.

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
- Perfil global de usuario con membresias en multiples empresas.
- Cambio de empresa activa desde la cabecera de Tickets.
- Pantalla Perfil para empresas, invitaciones y sesion.
- Invitaciones de empresa para usuarios ya registrados.
- API legado con login, empresa actual, aplicaciones, tickets, estados,
  comentarios y evidencias.
- Creacion de empresas desde Perfil.
- Pantalla Admin para crear/editar aplicaciones, invitar usuarios y administrar
  membresias.
- Pantalla de estadisticas por estado, prioridad, criticidad y aplicacion.
- Dominio DDD/POO compartido.
- Cliente Expo en `apps/mobile` conectado a Supabase.
- Version web responsive compilable.
- Dashboard web Next.js inicial en `apps/web`.
- Cache local del cliente.
- Docker/Nginx para Hostinger VPS.
- Pruebas basicas del dominio y servicios.

Siguientes mejoras naturales:

- Reseteo seguro de contrasenas.
- Asignacion de tickets.
- Notificaciones para invitaciones pendientes.
- Descarga/preview avanzada de evidencias desde mobile.
