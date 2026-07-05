import { decode } from "base64-arraybuffer";
import {
  createEphemeralSupabaseClient,
  supabase,
} from "./supabaseClient";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const sanitizeFileName = (fileName) =>
  String(fileName || "evidencia")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

const throwIfError = (error, fallbackMessage) => {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
};

const mapCompany = (company) =>
  company
    ? {
        id: company.id,
        name: company.name,
        slug: company.slug,
        createdAt: company.created_at || company.createdAt,
        updatedAt: company.updated_at || company.updatedAt,
      }
    : null;

const mapApplication = (application) => ({
  id: application.id,
  companyId: application.company_id || application.companyId,
  name: application.name,
  description: application.description || "",
  isActive: application.is_active ?? application.isActive ?? true,
  createdAt: application.created_at || application.createdAt,
  updatedAt: application.updated_at || application.updatedAt,
});

const mapUser = (profile) => ({
  id: profile.id,
  companyId: profile.company_id || profile.companyId,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  isActive: profile.is_active ?? profile.isActive ?? true,
  createdAt: profile.created_at || profile.createdAt,
  updatedAt: profile.updated_at || profile.updatedAt,
});

const mapEvidence = (evidence) => ({
  id: evidence.id,
  ticketId: evidence.ticket_id || evidence.ticketId,
  companyId: evidence.company_id || evidence.companyId,
  uploadedById: evidence.uploaded_by_id || evidence.uploadedById,
  fileName: evidence.file_name || evidence.fileName,
  mimeType: evidence.mime_type || evidence.mimeType,
  type: evidence.type,
  size: evidence.size,
  storagePath: evidence.storage_path || evidence.storagePath,
  publicUrl: evidence.public_url || evidence.publicUrl || "",
  createdAt: evidence.created_at || evidence.createdAt,
  updatedAt: evidence.updated_at || evidence.updatedAt,
});

const mapComment = (comment) => ({
  id: comment.id,
  ticketId: comment.ticket_id || comment.ticketId,
  authorId: comment.author_id || comment.authorId,
  body: comment.body,
  createdAt: comment.created_at || comment.createdAt,
});

const mapStatusLog = (log) => ({
  id: log.id,
  ticketId: log.ticket_id || log.ticketId,
  fromStatus: log.from_status ?? log.fromStatus ?? null,
  toStatus: log.to_status || log.toStatus,
  changedById: log.changed_by_id || log.changedById,
  note: log.note || "",
  createdAt: log.created_at || log.createdAt,
});

const sortByCreatedAtDesc = (items) =>
  [...(items || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const mapTicket = (ticket) => ({
  id: ticket.id,
  companyId: ticket.company_id || ticket.companyId,
  applicationId: ticket.application_id || ticket.applicationId,
  createdById: ticket.created_by_id || ticket.createdById,
  title: ticket.title,
  description: ticket.description || "",
  status: ticket.status,
  priority: ticket.priority,
  completedAt: ticket.completed_at || ticket.completedAt || null,
  createdAt: ticket.created_at || ticket.createdAt,
  updatedAt: ticket.updated_at || ticket.updatedAt,
  evidences: sortByCreatedAtDesc(
    (ticket.evidences || []).map((item) => mapEvidence(item))
  ),
  comments: sortByCreatedAtDesc(
    (ticket.comments || ticket.ticket_comments || []).map((item) => mapComment(item))
  ),
  statusHistory: sortByCreatedAtDesc(
    (ticket.statusHistory || ticket.ticket_status_logs || []).map((item) =>
      mapStatusLog(item)
    )
  ),
});

const fetchCurrentProfile = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwIfError(authError, "No se pudo validar la sesion.");

  if (!authData.user) {
    throw new Error("Debes iniciar sesion.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, company_id, name, email, role, is_active, created_at, updated_at"
    )
    .eq("id", authData.user.id)
    .maybeSingle();

  throwIfError(error, "No se pudo cargar el perfil del usuario.");

  if (!data) {
    throw new Error("Este usuario no tiene un perfil de empresa configurado.");
  }

  if (data.is_active === false) {
    throw new Error("Este usuario esta inactivo.");
  }

  return mapUser(data);
};

export const getCurrentSessionRequest = async () => {
  const { data, error } = await supabase.auth.getSession();
  throwIfError(error, "No se pudo cargar la sesion.");

  if (!data.session) return null;

  const user = await fetchCurrentProfile();

  return {
    token: data.session.access_token,
    user,
  };
};

export const loginRequest = async (credentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(credentials.email),
    password: credentials.password,
  });

  throwIfError(error, "Correo o contrasena incorrectos.");

  try {
    const user = await fetchCurrentProfile();

    return {
      token: data.session?.access_token || "",
      user,
    };
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
};

export const signOutRequest = () => supabase.auth.signOut();

export const registerPushTokenRequest = async ({ token, platform }) => {
  if (!token) return null;

  const { data, error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: platform || "unknown",
  });

  throwIfError(error, "No se pudo activar las notificaciones.");
  return data;
};

export const registerCompanyRequest = async (payload) => {
  const { error: signUpError } = await supabase.auth.signUp({
    email: normalizeEmail(payload.adminEmail),
    password: payload.adminPassword,
    options: {
      data: {
        name: payload.adminName,
      },
    },
  });

  throwIfError(signUpError, "No se pudo crear el usuario administrador.");

  const { data, error } = await supabase.rpc("register_company", {
    p_company_name: payload.companyName,
    p_application_name: payload.applicationName || "Aplicacion Principal",
    p_admin_name: payload.adminName,
  });

  throwIfError(error, "No se pudo registrar la empresa.");
  return data;
};

export const loadWorkspaceRequest = async () => {
  const user = await fetchCurrentProfile();

  const [companyResult, applicationsResult, ticketsResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, slug, created_at, updated_at")
      .eq("id", user.companyId)
      .single(),
    supabase
      .from("applications")
      .select("id, company_id, name, description, is_active, created_at, updated_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("tickets")
      .select(
        `
        id,
        company_id,
        application_id,
        created_by_id,
        title,
        description,
        status,
        priority,
        completed_at,
        created_at,
        updated_at,
        evidences (*),
        comments:ticket_comments (*),
        statusHistory:ticket_status_logs (*)
      `
      )
      .order("updated_at", { ascending: false }),
  ]);

  throwIfError(companyResult.error, "No se pudo cargar la empresa.");
  throwIfError(applicationsResult.error, "No se pudieron cargar las aplicaciones.");
  throwIfError(ticketsResult.error, "No se pudieron cargar los tickets.");

  return {
    company: mapCompany(companyResult.data),
    applications: (applicationsResult.data || []).map(mapApplication),
    tickets: (ticketsResult.data || []).map(mapTicket),
  };
};

export const createApplicationRequest = async (payload) => {
  const user = await fetchCurrentProfile();
  const { data, error } = await supabase
    .from("applications")
    .insert({
      company_id: user.companyId,
      name: payload.name,
      description: payload.description || "",
    })
    .select("id, company_id, name, description, is_active, created_at, updated_at")
    .single();

  throwIfError(error, "No se pudo crear la aplicacion.");
  return { application: mapApplication(data) };
};

export const updateApplicationRequest = async (applicationId, payload) => {
  const updates = {};

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.isActive !== undefined) updates.is_active = Boolean(payload.isActive);

  const { data, error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", applicationId)
    .select("id, company_id, name, description, is_active, created_at, updated_at")
    .single();

  throwIfError(error, "No se pudo actualizar la aplicacion.");
  return { application: mapApplication(data) };
};

export const listUsersRequest = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, name, email, role, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  throwIfError(error, "No se pudieron cargar los usuarios.");
  return { users: (data || []).map(mapUser) };
};

export const createUserRequest = async (payload) => {
  const currentUser = await fetchCurrentProfile();
  const authClient = createEphemeralSupabaseClient();
  const email = normalizeEmail(payload.email);

  const { data: authData, error: authError } = await authClient.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
      },
    },
  });

  throwIfError(authError, "No se pudo crear el acceso del usuario.");

  if (!authData.user?.id) {
    throw new Error("No se pudo obtener el usuario creado.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: authData.user.id,
      company_id: currentUser.companyId,
      name: payload.name,
      email,
      role: payload.role || "developer",
    })
    .select("id, company_id, name, email, role, is_active, created_at, updated_at")
    .single();

  throwIfError(error, "No se pudo crear el perfil del usuario.");
  return { user: mapUser(data) };
};

export const updateUserRequest = async (userId, payload) => {
  const { data: currentProfile, error: currentError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  throwIfError(currentError, "No se pudo cargar el usuario.");

  if (
    payload.email !== undefined &&
    normalizeEmail(payload.email) !== normalizeEmail(currentProfile.email)
  ) {
    throw new Error(
      "El correo de acceso no se puede cambiar desde esta version sin un backend privado."
    );
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.isActive !== undefined) updates.is_active = Boolean(payload.isActive);

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, company_id, name, email, role, is_active, created_at, updated_at")
    .single();

  throwIfError(error, "No se pudo actualizar el usuario.");
  return { user: mapUser(data) };
};

export const createTicketRequest = async (payload) => {
  const { data, error } = await supabase.rpc("create_ticket", {
    p_application_id: payload.applicationId,
    p_title: payload.title,
    p_description: payload.description || "",
    p_priority: payload.priority || "medium",
  });

  throwIfError(error, "No se pudo crear el ticket.");
  return { ticket: mapTicket(data) };
};

export const changeTicketStatusRequest = async (ticketId, payload) => {
  const { data, error } = await supabase.rpc("change_ticket_status", {
    p_ticket_id: ticketId,
    p_status: payload.status,
    p_note: payload.note || "",
  });

  throwIfError(error, "No se pudo cambiar el estado.");
  return { ticket: mapTicket(data) };
};

export const addTicketCommentRequest = async (ticketId, payload) => {
  const { data, error } = await supabase.rpc("add_ticket_comment", {
    p_ticket_id: ticketId,
    p_body: payload.body,
  });

  throwIfError(error, "No se pudo registrar el comentario.");
  return { ticket: mapTicket(data) };
};

export const addTicketEvidenceRequest = async (ticketId, payload) => {
  const user = await fetchCurrentProfile();
  const fileData = decode(payload.contentBase64);
  const size = payload.size || fileData.byteLength;
  const storagePath = `${user.companyId}/${ticketId}/${Date.now()}-${sanitizeFileName(
    payload.fileName
  )}`;

  const { error: uploadError } = await supabase.storage
    .from("evidences")
    .upload(storagePath, fileData, {
      contentType: payload.mimeType,
      upsert: false,
    });

  throwIfError(uploadError, "No se pudo subir la evidencia.");

  const { data, error } = await supabase.rpc("add_ticket_evidence", {
    p_ticket_id: ticketId,
    p_file_name: payload.fileName,
    p_mime_type: payload.mimeType,
    p_size: size,
    p_storage_path: storagePath,
  });

  if (error) {
    await supabase.storage.from("evidences").remove([storagePath]);
    throwIfError(error, "No se pudo registrar la evidencia.");
  }

  return { ticket: mapTicket(data) };
};
