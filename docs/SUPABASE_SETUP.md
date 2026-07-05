# Supabase setup

Este proyecto ahora usa Supabase como backend central para la app Expo.

## 1. Auth

En Supabase:

```text
Authentication > Sign In / Providers > Email
```

Para el MVP, deja desactivado `Confirm email`.

## 2. Variables Expo

El cliente usa solo variables publicas:

```env
EXPO_PUBLIC_SUPABASE_URL=https://djpwdvmxmcmfdpjdtxal.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_s8BMBdHY4H5EwaNpqdQ8oA_nx_vwk3W
```

No uses `secret` ni `service_role` en Expo.

## 3. Base de datos

Abre Supabase SQL Editor y ejecuta completo:

```text
docs/supabase-schema.sql
```

Ese SQL crea:

- Tablas de empresas, perfiles, aplicaciones, tickets, comentarios, historial y evidencias.
- Tipos enum para roles, estados y prioridades.
- Funciones RPC usadas por la app.
- Politicas RLS por empresa.
- Bucket privado `evidences` para archivos.

## 4. Probar local

Despues de ejecutar el SQL:

```bash
npm start
```

En la pantalla inicial usa `Registrar empresa`. Ese flujo crea:

- Usuario Auth en Supabase.
- Empresa.
- Aplicacion inicial.
- Perfil admin asociado a la empresa.

## Limitacion actual

La app puede crear usuarios con email y contrasena inicial, pero no puede cambiar el
correo de acceso de usuarios existentes desde Expo sin un backend privado. Por eso
la pantalla Admin bloquea el correo al editar usuarios.
