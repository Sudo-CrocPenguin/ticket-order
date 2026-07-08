import { decode } from "base64-arraybuffer";
import { supabase } from "./supabaseClient";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const printableAsciiNoSpacesPattern = /^[\x21-\x7E]+$/;

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

const validateEmail = (email) => {
  if (!emailPattern.test(email)) {
    throw new Error(
      "Usa un correo valido sin tildes ni espacios. Ejemplo: nombre@empresa.com."
    );
  }
};

const validatePassword = (password) => {
  if (String(password || "").length < 8) {
    throw new Error("La contrasena debe tener minimo 8 caracteres.");
  }

  if (!printableAsciiNoSpacesPattern.test(password)) {
    throw new Error(
      "La contrasena no debe tener tildes ni espacios. Puedes usar letras, numeros y simbolos como @, #, $, %."
    );
  }
};

const validateNewAuthCredentials = ({ email, password }) => {
  validateEmail(email);
  validatePassword(password);
};

const isAlreadyRegisteredAuthError = (error) => {
  if (!error) return false;

  const code = String(error.code || "").toLowerCase();
  const message = String(error.message || "").toLowerCase();

  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    (message.includes("already") &&
      (message.includes("registered") || message.includes("exists"))) ||
    message.includes("user already registered")
  );
};

const isInvalidCredentialsAuthError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    message.includes("invalid login credentials")
  );
};

const isEmailNotConfirmedAuthError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return code === "email_not_confirmed" || message.includes("email not confirmed");
};

const isObfuscatedExistingAuthUser = (user) =>
  Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);

const isMissingRegisterCompanyRpcError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("register_company") &&
    (message.includes("schema cache") || message.includes("could not find"))
  );
};

const ensureRegistrationSession = async (payload) => {
  const email = normalizeEmail(payload.adminEmail);
  const password = payload.adminPassword;

  validateNewAuthCredentials({ email, password });

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  throwIfError(sessionError, "No se pudo validar la sesion actual.");

  const currentEmail = normalizeEmail(sessionData.session?.user?.email);
  if (sessionData.session && currentEmail === email) {
    return sessionData.session;
  }

  if (sessionData.session) {
    await supabase.auth.signOut();
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: payload.adminName,
      },
    },
  });

  if (signUpError && !isAlreadyRegisteredAuthError(signUpError)) {
    throw new Error(
      signUpError.message || "No se pudo crear el usuario administrador."
    );
  }

  if (!signUpError && signUpData.session) {
    return signUpData.session;
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError) {
    const userAlreadyExists =
      isAlreadyRegisteredAuthError(signUpError) ||
      isObfuscatedExistingAuthUser(signUpData?.user);

    if (isInvalidCredentialsAuthError(signInError)) {
      throw new Error(
        userAlreadyExists
          ? "Ese correo ya existe en Supabase Auth, pero la contrasena no coincide. Usa la contrasena original o elimina ese usuario en Supabase > Authentication > Users y registra de nuevo."
          : "Supabase no pudo iniciar sesion con ese correo y contrasena. Revisa que Confirm email este desactivado o confirma/elimina ese usuario en Supabase Auth."
      );
    }

    if (isEmailNotConfirmedAuthError(signInError)) {
      throw new Error(
        "Ese usuario existe, pero el correo no esta confirmado. Desactiva Confirm email en Supabase o confirma/elimina ese usuario en Authentication > Users."
      );
    }

    const message = userAlreadyExists
      ? "Este correo ya existe. Ingresa la contrasena correcta para terminar el registro de la empresa."
      : "El usuario se creo, pero no se pudo iniciar sesion. Verifica que Confirm email este desactivado en Supabase.";

    throw new Error(signInError.message || message);
  }

  if (!signInData.session) {
    throw new Error("No se pudo iniciar sesion para terminar el registro.");
  }

  return signInData.session;
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

const mapUser = mapProfile;

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

const upsertCurrentProfile = async (name = "") => {
  const { data, error } = await supabase.rpc("upsert_user_profile", {
    p_name: name,
  });

  throwIfError(error, "No se pudo preparar el perfil del usuario.");
  return mapProfile(data);
};

const fetchCurrentProfile = async (fallbackName = "") => {
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
    return upsertCurrentProfile(
      fallbackName || authData.user.user_metadata?.name || ""
    );
  }

  if (data.is_active === false) {
    throw new Error("Este usuario esta inactivo.");
  }

  return mapProfile(data);
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

export const registerPushTokenRequest = async ({ token, platform, companyId }) => {
  if (!token) return null;
  if (!companyId) return null;

  const { data, error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: platform || "unknown",
    p_company_id: companyId,
  });

  throwIfError(error, "No se pudo activar las notificaciones.");
  return data;
};

export const registerAccountRequest = async (payload) => {
  const email = normalizeEmail(payload.email);
  const password = payload.password;

  validateNewAuthCredentials({ email, password });

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: payload.name,
      },
    },
  });

  if (signUpError) {
    if (isAlreadyRegisteredAuthError(signUpError)) {
      throw new Error(
        "Ese correo ya existe. Inicia sesion con la contrasena original."
      );
    }

    throw new Error(signUpError.message || "No se pudo crear la cuenta.");
  }

  if (isObfuscatedExistingAuthUser(signUpData.user)) {
    throw new Error(
      "Ese correo ya existe. Inicia sesion con la contrasena original."
    );
  }

  if (!signUpData.session) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      if (isInvalidCredentialsAuthError(signInError)) {
        throw new Error(
          "La cuenta se creo, pero Supabase no permitio iniciar sesion. Revisa Confirm email o elimina ese usuario en Authentication > Users y vuelve a intentarlo."
        );
      }

      throw new Error(signInError.message || "No se pudo iniciar sesion.");
    }

    if (!signInData.session) {
      throw new Error("No se pudo iniciar sesion despues de crear la cuenta.");
    }
  }

  const user = await upsertCurrentProfile(payload.name);
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  throwIfError(sessionError, "No se pudo cargar la sesion.");

  return {
    token: sessionData.session?.access_token || "",
    user,
  };
};

export const createCompanyRequest = async (payload) => {
  const profile = await fetchCurrentProfile(payload.adminName || "");

  const { data, error } = await supabase.rpc("register_company", {
    p_company_name: payload.companyName,
    p_application_name: payload.applicationName || "Aplicacion Principal",
    p_admin_name: payload.adminName || profile.name,
  });

  if (error && isMissingRegisterCompanyRpcError(error)) {
    throw new Error(
      "Falta instalar la funcion register_company en Supabase. Ejecuta docs/supabase-schema.sql completo en SQL Editor y vuelve a intentar."
    );
  }

  throwIfError(error, "No se pudo registrar la empresa.");
  return data;
};

export const registerCompanyRequest = createCompanyRequest;

export const loadWorkspaceRequest = async (activeCompanyId = "") => {
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

export const createApplicationRequest = async (payload, companyId) => {
  if (!companyId) {
    throw new Error("Selecciona una empresa antes de crear aplicaciones.");
  }

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

export const listUsersRequest = async (companyId) => {
  if (!companyId) {
    return { users: [] };
  }

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

  throwIfError(error, "No se pudieron cargar los usuarios.");
  return {
    users: (data || []).map((membership) => {
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
    }),
  };
};

export const createUserRequest = async (payload, companyId) => {
  const email = normalizeEmail(payload.email);

  validateEmail(email);

  const { data, error } = await supabase.rpc("invite_company_member", {
    p_company_id: companyId,
    p_email: email,
    p_role: payload.role || "developer",
  });

  throwIfError(error, "No se pudo enviar la invitacion.");
  return { invitation: mapInvitation(data) };
};

export const updateUserRequest = async (membershipId, payload) => {
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

  throwIfError(error, "No se pudo actualizar el usuario.");
  const mapped = mapMembership(data);

  return {
    user: {
      ...mapped.user,
      id: mapped.id,
      membershipId: mapped.id,
      userId: mapped.userId,
      companyId: mapped.companyId,
      role: mapped.role,
      isActive: mapped.isActive,
    },
  };
};

export const acceptInvitationRequest = async (invitationId) => {
  const { data, error } = await supabase.rpc("accept_company_invitation", {
    p_invitation_id: invitationId,
  });

  throwIfError(error, "No se pudo aceptar la invitacion.");
  return { membership: mapMembership(data) };
};

export const rejectInvitationRequest = async (invitationId) => {
  const { data, error } = await supabase.rpc("reject_company_invitation", {
    p_invitation_id: invitationId,
  });

  throwIfError(error, "No se pudo rechazar la invitacion.");
  return { invitation: mapInvitation(data) };
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
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("company_id")
    .eq("id", ticketId)
    .single();

  throwIfError(ticketError, "No se pudo validar la empresa del ticket.");

  const fileData = decode(payload.contentBase64);
  const size = payload.size || fileData.byteLength;
  const storagePath = `${ticket.company_id}/${ticketId}/${Date.now()}-${sanitizeFileName(
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
