import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type NotificationEvent = {
  id: string;
  company_id: string;
  ticket_id: string | null;
  actor_id: string | null;
  kind: "ticket_created" | "ticket_status_changed";
  title: string;
  body: string;
  payload: Record<string, unknown>;
};

type PushToken = {
  token: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("NOTIFICATION_WEBHOOK_SECRET") || "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const assertAuthorized = (request: Request) => {
  if (!webhookSecret) return;

  const receivedSecret = request.headers.get("x-webhook-secret") || "";

  if (receivedSecret !== webhookSecret) {
    throw new Error("Unauthorized notification webhook.");
  }
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const loadEvents = async (eventId?: string) => {
  let query = supabase
    .from("notification_events")
    .select("id, company_id, ticket_id, actor_id, kind, title, body, payload")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(20);

  if (eventId) {
    query = query.eq("id", eventId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as NotificationEvent[];
};

const loadTokens = async (companyId: string, actorId: string | null) => {
  let query = supabase
    .from("push_tokens")
    .select("token")
    .eq("company_id", companyId)
    .eq("is_active", true);

  if (actorId) {
    query = query.neq("user_id", actorId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as PushToken[];
};

const markEvent = async (
  eventId: string,
  payload: { sent_at?: string; error?: string | null }
) => {
  const { error } = await supabase
    .from("notification_events")
    .update(payload)
    .eq("id", eventId);

  if (error) throw error;
};

const sendExpoNotifications = async (
  event: NotificationEvent,
  tokens: PushToken[]
) => {
  const messages = tokens.map((item) => ({
    to: item.token,
    sound: "default",
    channelId: "tickets",
    title: event.title,
    body: event.body,
    data: {
      ...event.payload,
      eventId: event.id,
      kind: event.kind,
      ticketId: event.ticket_id,
    },
  }));

  for (const batch of chunk(messages, 100)) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      throw new Error(`Expo Push Service respondio ${response.status}.`);
    }
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    assertAuthorized(request);

    const body = await request.json().catch(() => ({}));
    const eventId = body?.record?.id || body?.id;
    const events = await loadEvents(eventId);

    for (const event of events) {
      try {
        const tokens = await loadTokens(event.company_id, event.actor_id);

        if (!tokens.length) {
          await markEvent(event.id, {
            sent_at: new Date().toISOString(),
            error: "No hay tokens activos para esta empresa.",
          });
          continue;
        }

        await sendExpoNotifications(event, tokens);
        await markEvent(event.id, {
          sent_at: new Date().toISOString(),
          error: null,
        });
      } catch (error) {
        await markEvent(event.id, {
          error: error instanceof Error ? error.message : "Error desconocido.",
        });
      }
    }

    return Response.json(
      {
        ok: true,
        processed: events.length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido.",
      },
      {
        headers: corsHeaders,
        status: 401,
      }
    );
  }
});
