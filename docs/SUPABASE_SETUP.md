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
- Tablas de membresias e invitaciones para que una cuenta pueda pertenecer a varias empresas.
- Tipos enum para roles, estados y prioridades.
- Funciones RPC usadas por la app.
- Politicas RLS por empresa.
- Bucket privado `evidences` para archivos.

Al terminar, el SQL fuerza la recarga del schema cache de la API con:

```sql
notify pgrst, 'reload schema';
```

## 4. Probar local

Despues de ejecutar el SQL:

```bash
npm start
```

En la pantalla inicial usa `Crear cuenta`. Ese flujo crea:

- Usuario Auth en Supabase.
- Perfil global del usuario.

Despues entra a `Perfil` para:

- Crear una empresa nueva.
- Cambiar entre empresas donde tienes membresia.
- Aceptar o rechazar invitaciones.

En `Admin`, una empresa ya no crea contrasenas para otros usuarios. El admin
invita correos que ya tengan cuenta registrada; la persona invitada acepta desde
`Perfil`.

## Limitacion actual

La app no puede crear cuentas Auth para otras personas desde Admin sin usar una
clave privada. Por eso Admin envia invitaciones a cuentas que ya existen. Si un
correo todavia no tiene cuenta, esa persona debe usar `Crear cuenta` primero.

## Recuperar error `register_company`

Si la app muestra:

```text
Could not find the function public.register_company(...) in the schema cache
```

significa que la funcion RPC no existe en Supabase o que PostgREST no recargo su
schema. En Supabase SQL Editor ejecuta `docs/supabase-schema.sql` completo otra
vez. Luego valida:

```sql
select
  n.nspname as schema,
  p.proname as function,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'register_company';
```

Debe aparecer:

```text
p_company_name text, p_application_name text, p_admin_name text
```

Si ya intentaste registrar una empresa antes de instalar la funcion, puede existir
el usuario en Auth pero sin perfil. Despues de ejecutar el SQL, vuelve a
`Registrar empresa` con el mismo correo y contrasena; la app iniciara sesion con
ese usuario y terminara de crear empresa, aplicacion y perfil admin.
