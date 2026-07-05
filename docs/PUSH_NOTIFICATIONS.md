# Push notifications

La app registra Expo push tokens despues de iniciar sesion y los guarda en
Supabase con la RPC `register_push_token`.

## Flujo

1. La app solicita permiso de notificaciones.
2. Expo entrega un push token.
3. La app guarda el token en `public.push_tokens`.
4. Supabase crea registros en `public.notification_events` cuando:
   - Se crea un ticket.
   - Un ticket cambia de estado.
5. La Edge Function `send-ticket-notifications` lee el evento y llama al Expo
   Push Service.

## Configurar Supabase

Ejecuta de nuevo:

```text
docs/supabase-schema.sql
```

Esto agrega tablas, triggers y RPC de notificaciones.

## Variables de la Edge Function

En Supabase configura:

```env
SUPABASE_URL=https://djpwdvmxmcmfdpjdtxal.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NOTIFICATION_WEBHOOK_SECRET=un-secreto-largo-para-el-webhook
```

La `service_role` solo se usa dentro de la Edge Function, nunca en Expo.

## Desplegar funcion

```bash
supabase functions deploy send-ticket-notifications
```

## Disparar automaticamente

Crea un Database Webhook en Supabase:

```text
Database > Webhooks > Create webhook
```

Configuracion:

- Table: `notification_events`
- Events: `INSERT`
- Type: `Supabase Edge Functions`
- Function: `send-ticket-notifications`
- Header: `x-webhook-secret`
- Value: el mismo valor de `NOTIFICATION_WEBHOOK_SECRET`

## Limitaciones

Las push notifications remotas requieren build con EAS. Expo indica que en
Android, desde SDK 53, push notifications remotas no funcionan en Expo Go; usa
development build o release build.
