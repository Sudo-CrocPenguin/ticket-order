# Plan de desarrollo

## Fase 1: Base segura

- Limpiar `.gitignore`.
- Ignorar `.env`, uploads, data y builds.
- Agregar `.env.example`.

## Fase 2: Dominio

- Modelar empresas, aplicaciones, usuarios, tickets y evidencias.
- Implementar reglas con clases.
- Centralizar estados, prioridades y errores de dominio.

## Fase 3: API

- Login con token firmado.
- Datos semilla.
- CRUD inicial de tickets.
- Cambio de estado con auditoria.
- Comentarios.
- Evidencias en disco.
- Persistencia JSON local.

## Fase 4: Cliente

- Login.
- Conexion a API.
- Cache local.
- Pantallas responsive.
- Selector de aplicacion y prioridad.
- Acciones de estado.
- Adjuntar evidencias.

## Fase 5: Web y despliegue

- Build web con `EXPO_PUBLIC_API_URL=/api`.
- Nginx sirve web y proxya API.
- Docker Compose para Hostinger VPS.
- Volumenes persistentes para data y uploads.

## Fase 6: Calidad

- Pruebas unitarias de dominio.
- Pruebas de servicios de aplicacion.
- Validacion de build web.
- Documentacion de arquitectura, API y despliegue.

## Fase 7: Proximas iteraciones

- Gestion completa de usuarios.
- Gestion de aplicaciones desde UI.
- Migracion a PostgreSQL.
- Asignacion de tickets.
- Notificaciones.
- Panel de metricas.
- Previsualizacion avanzada de evidencias.
