# Ticket Order

Ticket Order es una aplicacion cliente-servidor para equipos de desarrollo que
necesitan registrar bugs, adjuntar evidencias y dar seguimiento al estado de
cada problema por empresa y por aplicacion.

El proyecto nacio como una app Expo con persistencia local. Ahora esta preparado
como una aplicacion completa:

- Cliente Expo para mobile y web.
- API Node.js modular.
- Persistencia local del servidor en JSON.
- Evidencias locales en disco.
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
- Node.js HTTP API sin framework externo.
- Persistencia local JSON en el servidor.
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

1. El servidor arranca, lee `.env` y crea datos semilla si no existe estado.
2. El cliente inicia sesion contra `POST /api/auth/login`.
3. La API emite un token firmado y el cliente lo guarda en AsyncStorage.
4. El cliente carga empresa, aplicaciones y tickets desde la API.
5. Las acciones de crear ticket, cambiar estado, comentar o adjuntar evidencia
   se ejecutan en el servidor.
6. El cliente guarda una cache local de workspace para mostrar la ultima copia
   disponible si falla la conexion.
7. El servidor guarda datos en `data/` y evidencias en `uploads/`; ambas rutas
   estan ignoradas por git.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Crea `.env` desde el ejemplo:

```bash
cp .env.example .env
```

Levanta la API:

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

En un dispositivo fisico, cambia `EXPO_PUBLIC_API_URL` por la IP LAN de tu
maquina, por ejemplo `http://192.168.1.10:4000/api`.

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
- [API REST](docs/API.md)
- [Despliegue Hostinger](deploy/hostinger/README.md)

## Estado actual

Implementado:

- API con login, empresa actual, aplicaciones, tickets, estados, comentarios y
  evidencias.
- Dominio DDD/POO compartido.
- Cliente Expo conectado a API.
- Version web responsive compilable.
- Cache local del cliente.
- Docker/Nginx para Hostinger VPS.
- Pruebas basicas del dominio y servicios.

Siguientes mejoras naturales:

- Administracion completa de usuarios y aplicaciones.
- Base PostgreSQL para produccion de mayor escala.
- Notificaciones y asignaciones.
- Dashboard por prioridad, estado y aplicacion.
- Descarga/preview avanzada de evidencias desde mobile.
