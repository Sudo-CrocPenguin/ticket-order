# Arquitectura

Ticket Order usa una arquitectura cliente-servidor modular con separacion de
dominio, aplicacion e infraestructura.

## Capas

```text
Cliente Expo
  Pantallas -> Contexto -> Servicios HTTP/cache/evidencias

API Node
  HTTP -> Casos de uso -> Dominio -> Persistencia/archivos

Dominio compartido
  Entidades, value objects ligeros, constantes, validaciones y errores
```

## DDD y POO

El dominio vive en `shared/domain` y se modela con clases:

- `Company`: empresa propietaria de aplicaciones y usuarios.
- `Application`: producto o app que recibe tickets.
- `User`: usuario con rol y permisos.
- `Ticket`: agregado principal del bug.
- `Evidence`: archivo adjunto a un ticket.
- `TicketStatusLog`: auditoria de cambios de estado.
- `TicketComment`: nota de seguimiento.

Las reglas importantes estan dentro de estas clases:

- Un ticket requiere empresa, aplicacion, creador y titulo.
- Un ticket inicia en `pending`.
- Cambiar estado crea un registro de auditoria.
- Las evidencias validan tipo MIME y tamano.
- Los usuarios solo pueden operar sobre su empresa.
- Una empresa debe conservar al menos un administrador activo.

## API

La API esta en `server/src`.

- `application/`: casos de uso como login, bootstrapping, tickets y empresa.
- `infrastructure/http/`: routing REST, CORS, auth Bearer y errores.
- `infrastructure/persistence/`: base JSON local.
- `infrastructure/security/`: hash PBKDF2 y token firmado HMAC.
- `infrastructure/storage/`: escritura/lectura de evidencias locales.

La API no depende de Express ni NestJS en esta version. Esto reduce peso para
Hostinger y mantiene control total del runtime. Si el proyecto crece, los casos
de uso y dominio pueden migrarse a NestJS sin reescribir reglas de negocio.

## Persistencia local

El servidor guarda:

```text
data/ticket-order.json
uploads/<companyId>/<ticketId>/<evidenceId>-archivo.ext
```

Estas rutas estan ignoradas por git. En Docker se montan como volumenes para que
los datos sobrevivan a despliegues.

## Cliente

El cliente usa `TicketContext` como fachada de aplicacion:

- Carga sesion desde AsyncStorage.
- Configura el token Bearer en `apiClient`.
- Carga workspace remoto.
- Guarda cache local de empresa, aplicaciones y tickets.
- Expone acciones asincronas para pantallas.
- Expone onboarding de empresa y acciones administrativas para usuarios y
  aplicaciones.

La app compila tanto para mobile como para web. Los contenedores de pantalla
usan `maxWidth` y layouts con wrap para funcionar en movil y desktop.

## Seguridad

- `.env` no se versiona.
- `JWT_SECRET` es obligatorio y largo en produccion.
- `SEED_ADMIN_PASSWORD` es obligatorio en produccion.
- Las evidencias tienen limite de 10 MB.
- La descarga de evidencias requiere token.
- CORS se configura con `CORS_ORIGIN`.

## Limites actuales

- La persistencia JSON es suficiente para MVP y demos, pero PostgreSQL es mejor
  para concurrencia alta, reportes y auditoria avanzada.
- La gestion de usuarios y aplicaciones existe para administradores, incluyendo
  edicion y activacion/desactivacion. Aun falta reseteo de contrasenas.
- No hay migraciones de base de datos porque no hay DB relacional todavia.
