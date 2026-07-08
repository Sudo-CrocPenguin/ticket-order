import { supabase } from "@/lib/supabase";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

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

const mapProfile = (profile, membership = null) => ({
  id: profile.id,
  companyId: membership?.company_id || membership?.companyId || profile.company_id || null,
  membershipId: membership?.id || membership?.membershipId || null,
  name: profile.name,
  email: profile.email,
  role: membership?.role || profile.role || "viewer",
  isActive:
    membership?.is_active ??
    membership?.isActive ??
    profile.is_active ??
    profile.isActive ??
    true,
  createdAt: profile.created_at || profile.createdAt,
  updatedAt: profile.updated_at || profile.updatedAt,
});

const mapMembership = (membership) => {
  const profile = membership.profile || membership.profiles || membership.user || null;

  return {
    id: membership.id,
    companyId: membership.company_id || membership.companyId,
    userId: membership.user_id || membership.userId,
    role: membership.role,
    isActive: membership.is_active ?? membership.isActive ?? true,
    acceptedAt: membership.accepted_at || membership.acceptedAt,
    createdAt: membership.created_at || membership.createdAt,
    updatedAt: membership.updated_at || membership.updatedAt,
    company: mapCompany(membership.company || membership.companies),
    user: profile ? mapProfile(profile, membership) : null,
  };
};

const mapInvitation = (invitation) => ({
  id: invitation.id,
  companyId: invitation.company_id || invitation.companyId,
  email: invitation.email,
  role: invitation.role,
  status: invitation.status,
  createdAt: invitation.created_at || invitation.createdAt,
  updatedAt: invitation.updated_at || invitation.updatedAt,
  respondedAt: invitation.responded_at || invitation.respondedAt || null,
  company: mapCompany(invitation.company || invitation.companies),
});

const mapApplication = (application) => ({
  id: application.id,
  companyId: application.company_id || application.companyId,
  name: application.name,
  description: application.description || "",
  isActive: application.is_active ?? application.isActive ?? true,
  createdAt: application.created_at || application.createdAt,
  updatedAt: application.updated_at || application.updatedAt,
});

const sanitizeFileName = (fileName) =>
  String(fileName || "evidencia")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

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

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  throwIfError(error, "No se pudo cargar la sesion.");
  return data.session || null;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  throwIfError(error, "Correo o contrasena incorrectos.");
  return data.session || null;
};

export const signUp = async ({ name, email, password }) => {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: { name },
    },
  });

  throwIfError(error, "No se pudo crear la cuenta.");

  if (data.session) {
    await supabase.rpc("upsert_user_profile", { p_name: name });
  }

  return data.session || null;
};

export const signOut = () => supabase.auth.signOut();

export const fetchCurrentProfile = async (fallbackName = "") => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwIfError(authError, "No se pudo validar la sesion.");

  if (!authData.user) {
    throw new Error("Debes iniciar sesion.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, name, email, role, is_active, created_at, updated_at")
    .eq("id", authData.user.id)
    .maybeSingle();

  throwIfError(error, "No se pudo cargar el perfil.");

  if (data) {
    return mapProfile(data);
  }

  const { data: createdProfile, error: rpcError } = await supabase.rpc(
    "upsert_user_profile",
    {
      p_name: fallbackName || authData.user.user_metadata?.name || "",
    }
  );

  throwIfError(rpcError, "No se pudo preparar el perfil.");
  return mapProfile(createdProfile);
};

export const loadWorkspace = async (activeCompanyId = "") => {
  const profile = await fetchCurrentProfile();

  const [membershipsResult, invitationsResult] = await Promise.all([
    supabase
      .from("company_memberships")
      .select(
        `
        id,
        company_id,
        user_id,
        role,
        is_active,
        accepted_at,
        created_at,
        updated_at,
        company:companies (id, name, slug, created_at, updated_at)
      `
      )
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("company_invitations")
      .select(
        `
        id,
        company_id,
        email,
        role,
        status,
        responded_at,
        created_at,
        updated_at,
        company:companies (id, name, slug, created_at, updated_at)
      `
      )
      .eq("email", profile.email)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  throwIfError(membershipsResult.error, "No se pudieron cargar las empresas.");
  throwIfError(invitationsResult.error, "No se pudieron cargar las invitaciones.");

  const memberships = (membershipsResult.data || []).map(mapMembership);
  const invitations = (invitationsResult.data || []).map(mapInvitation);
  const activeMembership =
    memberships.find((membership) => membership.companyId === activeCompanyId) ||
    memberships[0] ||
    null;

  if (!activeMembership?.companyId) {
    return {
      user: mapProfile(profile),
      company: null,
      memberships,
      invitations,
      activeCompanyId: "",
      applications: [],
      tickets: [],
    };
  }

  const [applicationsResult, ticketsResult] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company_id, name, description, is_active, created_at, updated_at")
      .eq("company_id", activeMembership.companyId)
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
      .eq("company_id", activeMembership.companyId)
      .order("updated_at", { ascending: false }),
  ]);

  throwIfError(applicationsResult.error, "No se pudieron cargar las aplicaciones.");
  throwIfError(ticketsResult.error, "No se pudieron cargar los tickets.");

  return {
    user: mapProfile(profile, {
      id: activeMembership.id,
      company_id: activeMembership.companyId,
      role: activeMembership.role,
      is_active: activeMembership.isActive,
    }),
    company: activeMembership.company,
    memberships,
    invitations,
    activeCompanyId: activeMembership.companyId,
    applications: (applicationsResult.data || []).map(mapApplication),
    tickets: (ticketsResult.data || []).map(mapTicket),
  };
};

export const createCompany = async ({ companyName, applicationName, adminName }) => {
  const { data, error } = await supabase.rpc("register_company", {
    p_company_name: companyName,
    p_application_name: applicationName || "Aplicacion Principal",
    p_admin_name: adminName,
  });

  throwIfError(error, "No se pudo crear la empresa.");
  return data;
};

export const createApplication = async (payload, companyId) => {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      company_id: companyId,
      name: payload.name,
      description: payload.description || "",
    })
    .select("id, company_id, name, description, is_active, created_at, updated_at")
    .single();

  throwIfError(error, "No se pudo crear la aplicacion.");
  return mapApplication(data);
};

export const updateApplication = async (applicationId, payload) => {
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
  return mapApplication(data);
};

export const createTicket = async (payload) => {
  const { data, error } = await supabase.rpc("create_ticket", {
    p_application_id: payload.applicationId,
    p_title: payload.title,
    p_description: payload.description || "",
    p_priority: payload.priority || "medium",
  });

  throwIfError(error, "No se pudo crear el ticket.");
  return mapTicket(data);
};

export const changeTicketStatus = async (ticketId, status) => {
  const { data, error } = await supabase.rpc("change_ticket_status", {
    p_ticket_id: ticketId,
    p_status: status,
    p_note: "",
  });

  throwIfError(error, "No se pudo cambiar el estado.");
  return mapTicket(data);
};

export const addTicketComment = async (ticketId, body) => {
  const { data, error } = await supabase.rpc("add_ticket_comment", {
    p_ticket_id: ticketId,
    p_body: body,
  });

  throwIfError(error, "No se pudo registrar el comentario.");
  return mapTicket(data);
};

export const addTicketEvidence = async (ticketId, file) => {
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("company_id")
    .eq("id", ticketId)
    .single();

  throwIfError(ticketError, "No se pudo validar la empresa del ticket.");

  const storagePath = `${ticket.company_id}/${ticketId}/${Date.now()}-${sanitizeFileName(
    file.name
  )}`;

  const { error: uploadError } = await supabase.storage
    .from("evidences")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  throwIfError(uploadError, "No se pudo subir la evidencia.");

  const { data, error } = await supabase.rpc("add_ticket_evidence", {
    p_ticket_id: ticketId,
    p_file_name: file.name,
    p_mime_type: file.type || "application/octet-stream",
    p_size: file.size,
    p_storage_path: storagePath,
  });

  if (error) {
    await supabase.storage.from("evidences").remove([storagePath]);
    throwIfError(error, "No se pudo registrar la evidencia.");
  }

  return mapTicket(data);
};

export const createEvidenceDownloadUrl = async (storagePath) => {
  const { data, error } = await supabase.storage
    .from("evidences")
    .createSignedUrl(storagePath, 60);

  throwIfError(error, "No se pudo abrir la evidencia.");
  return data.signedUrl;
};

export const listMembers = async (companyId) => {
  if (!companyId) return [];

  const { data, error } = await supabase
    .from("company_memberships")
    .select(
      `
      id,
      company_id,
      user_id,
      role,
      is_active,
      accepted_at,
      created_at,
      updated_at,
      profile:profiles!company_memberships_user_id_fkey (
        id,
        name,
        email,
        is_active,
        created_at,
        updated_at
      )
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  throwIfError(error, "No se pudieron cargar los miembros.");

  return (data || []).map((membership) => {
    const mapped = mapMembership(membership);
    return {
      ...mapped.user,
      id: mapped.id,
      membershipId: mapped.id,
      userId: mapped.userId,
      companyId: mapped.companyId,
      role: mapped.role,
      isActive: mapped.isActive,
    };
  });
};

export const inviteMember = async ({ companyId, email, role }) => {
  const { data, error } = await supabase.rpc("invite_company_member", {
    p_company_id: companyId,
    p_email: normalizeEmail(email),
    p_role: role || "developer",
  });

  throwIfError(error, "No se pudo enviar la invitacion.");
  return mapInvitation(data);
};

export const updateMember = async (membershipId, payload) => {
  const updates = {};
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.isActive !== undefined) updates.is_active = Boolean(payload.isActive);

  const { data, error } = await supabase
    .from("company_memberships")
    .update(updates)
    .eq("id", membershipId)
    .select(
      `
      id,
      company_id,
      user_id,
      role,
      is_active,
      accepted_at,
      created_at,
      updated_at,
      profile:profiles!company_memberships_user_id_fkey (
        id,
        name,
        email,
        is_active,
        created_at,
        updated_at
      )
    `
    )
    .single();

  throwIfError(error, "No se pudo actualizar el miembro.");
  const mapped = mapMembership(data);

  return {
    ...mapped.user,
    id: mapped.id,
    membershipId: mapped.id,
    userId: mapped.userId,
    companyId: mapped.companyId,
    role: mapped.role,
    isActive: mapped.isActive,
  };
};

export const acceptInvitation = async (invitationId) => {
  const { data, error } = await supabase.rpc("accept_company_invitation", {
    p_invitation_id: invitationId,
  });

  throwIfError(error, "No se pudo aceptar la invitacion.");
  return mapMembership(data);
};

export const rejectInvitation = async (invitationId) => {
  const { data, error } = await supabase.rpc("reject_company_invitation", {
    p_invitation_id: invitationId,
  });

  throwIfError(error, "No se pudo rechazar la invitacion.");
  return mapInvitation(data);
};
