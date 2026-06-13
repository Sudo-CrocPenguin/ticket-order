# API REST

Base local:

```text
http://localhost:4000/api
```

En Hostinger, Nginx publica la API bajo:

```text
/api
```

## Autenticacion

### POST `/auth/login`

Inicia sesion.

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

Respuesta:

```json
{
  "token": "jwt-firmado",
  "user": {
    "id": "usr_...",
    "companyId": "cmp_...",
    "name": "Administrador",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

Usa el token en endpoints privados:

```text
Authorization: Bearer <token>
```

## Sesion

### GET `/me`

Devuelve el usuario autenticado.

## Empresa y aplicaciones

### GET `/companies/current`

Devuelve empresa actual y aplicaciones visibles.

### GET `/applications`

Devuelve solo aplicaciones.

## Tickets

### GET `/tickets`

Lista tickets de la empresa.

Query params opcionales:

- `search`
- `status`
- `applicationId`

### POST `/tickets`

Crea un ticket.

```json
{
  "applicationId": "app_...",
  "title": "Error al subir evidencia",
  "description": "Pasos para reproducir...",
  "priority": "high"
}
```

Prioridades:

- `low`
- `medium`
- `high`
- `critical`

### GET `/tickets/:id`

Devuelve un ticket por id.

### PATCH `/tickets/:id/status`

Cambia estado y registra auditoria.

```json
{
  "status": "in_progress",
  "note": "Tomado por desarrollo."
}
```

Estados:

- `pending`
- `in_progress`
- `completed`

### POST `/tickets/:id/comments`

Agrega comentario.

```json
{
  "body": "Se reproduce en Android 14."
}
```

### POST `/tickets/:id/evidences`

Adjunta evidencia en base64.

```json
{
  "fileName": "captura.png",
  "mimeType": "image/png",
  "contentBase64": "..."
}
```

Tipos soportados:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`
- `text/plain`
- `text/csv`
- documentos Word y Excel comunes.

Tamano maximo: 10 MB.

### GET `/evidences/:id/download`

Descarga una evidencia. Requiere token Bearer.

## Health

### GET `/health`

Endpoint publico para verificar disponibilidad.

```json
{
  "ok": true,
  "service": "ticket-order-api",
  "timestamp": "2026-06-13T00:00:00.000Z"
}
```
