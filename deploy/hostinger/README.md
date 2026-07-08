# Despliegue en Hostinger VPS

Este despliegue sirve la version web estatica con Nginx y publica la API Node.js
en la misma URL bajo `/api`. Los datos locales viven en volumenes Docker:
`ticket_order_data` para la base JSON y `ticket_order_uploads` para evidencias.

## Requisitos

- VPS Linux en Hostinger.
- Docker y Docker Compose instalados.
- Dominio apuntando al VPS.
- Archivo `deploy/hostinger/.env` creado a partir de `.env.example`.

## Build web

Desde la raiz del proyecto:

```bash
EXPO_PUBLIC_API_URL=/api npm run build:mobile:web
```

Expo genera `dist/`, que esta ignorado por git porque es un artefacto de build.

## Variables sensibles

No subas `.env` al repositorio. Configura como minimo:

- `JWT_SECRET`: secreto largo y aleatorio.
- `SEED_ADMIN_PASSWORD`: contrasena inicial fuerte.
- `CORS_ORIGIN`: dominio final de la app.

## Arranque

```bash
cd deploy/hostinger
cp .env.example .env
docker compose up -d --build
```

Despues de levantar el servicio por primera vez, entra con el usuario semilla
configurado en `.env` y cambia las credenciales desde una tarea administrativa
posterior cuando exista gestion completa de usuarios.
