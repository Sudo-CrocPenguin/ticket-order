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

### POST `/companies/register`

Registra una empresa, crea su aplicacion inicial y genera el usuario admin.

```json
{
  "companyName": "Nueva Empresa",
  "applicationName": "Portal Clientes",
  "adminName": "Admin Principal",
  "adminEmail": "admin@empresa.com",
  "adminPassword": "Admin123!"
}
```

Respuesta:

```json
{
  "company": {
    "id": "cmp_...",
    "name": "Nueva Empresa",
    "slug": "nueva-empresa"
  },
  "application": {
    "id": "app_...",
    "companyId": "cmp_...",
    "name": "Portal Clientes"
  },
  "user": {
    "id": "usr_...",
    "companyId": "cmp_...",
    "name": "Admin Principal",
    "email": "admin@empresa.com",
    "role": "admin"
  }
}
```

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

### POST `/applications`

Crea una aplicacion dentro de la empresa autenticada. Requiere rol `admin`.

```json
{
  "name": "Backoffice",
  "description": "Gestion interna."
}
```

### PATCH `/applications/:id`

Edita nombre, descripcion o estado activo de una aplicacion. Requiere rol
`admin`.

```json
{
  "name": "Backoffice Operaciones",
  "description": "Gestion interna actualizada.",
  "isActive": true
}
```

## Usuarios

### GET `/users`

Lista usuarios de la empresa autenticada. Requiere rol `admin`.

### POST `/users`

Crea un usuario dentro de la empresa autenticada. Requiere rol `admin`.

```json
{
  "name": "Desarrollador Uno",
  "email": "dev@empresa.com",
  "password": "Developer123!",
  "role": "developer"
}
```

Roles:

- `admin`: gestiona empresa, aplicaciones, usuarios y tickets.
- `developer`: gestiona tickets.
- `viewer`: solo consulta.

### PATCH `/users/:id`

Edita nombre, correo, rol o estado activo de un usuario. Requiere rol `admin`.
La API impide dejar una empresa sin al menos un administrador activo.

```json
{
  "name": "Desarrollador Principal",
  "email": "dev.principal@empresa.com",
  "role": "developer",
  "isActive": true
}
```

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
