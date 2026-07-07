import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { pickEvidence } from "../services/evidencePicker";
import {
  addTicketCommentRequest,
  addTicketEvidenceRequest,
  acceptInvitationRequest,
  createCompanyRequest,
  changeTicketStatusRequest,
  createApplicationRequest,
  createTicketRequest,
  createUserRequest,
  getCurrentSessionRequest,
  listUsersRequest,
  loadWorkspaceRequest,
  loginRequest,
  registerAccountRequest,
  registerPushTokenRequest,
  rejectInvitationRequest,
  signOutRequest,
  updateApplicationRequest,
  updateUserRequest,
} from "../services/ticketApi";
import { registerForPushNotificationsAsync } from "../services/notificationService";
import {
  clearSession,
  loadActiveCompanyId,
  loadWorkspaceCache,
  saveActiveCompanyId,
  saveWorkspaceCache,
} from "../services/sessionStorage";
import { getTicketStats, validateTicketInput } from "../utils/ticketUtils";
import { TICKET_STATUS } from "../utils/ticketLabels";

export const TicketContext = createContext(null);

const initialState = {
  session: null,
  company: null,
  memberships: [],
  invitations: [],
  activeCompanyId: "",
  applications: [],
  selectedApplicationId: "",
  tickets: [],
  users: [],
  isReady: false,
  isSyncing: false,
  storageError: "",
};

const sortTickets = (tickets) =>
  [...tickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const replaceTicket = (tickets, nextTicket) => {
  const exists = tickets.some((ticket) => ticket.id === nextTicket.id);
  const nextTickets = exists
    ? tickets.map((ticket) => (ticket.id === nextTicket.id ? nextTicket : ticket))
    : [nextTicket, ...tickets];

  return sortTickets(nextTickets);
};

const reducer = (state, action) => {
  switch (action.type) {
    case "BOOT_START":
      return {
        ...state,
        isReady: false,
        isSyncing: true,
        storageError: "",
      };

    case "BOOT_GUEST":
      return {
        ...initialState,
        isReady: true,
      };

    case "WORKSPACE_SUCCESS": {
      const applications = action.payload.applications || [];
      const currentApplicationStillAvailable = applications.some(
        (application) =>
          application.id === state.selectedApplicationId &&
          application.isActive !== false
      );
      const nextSelectedApplicationId = currentApplicationStillAvailable
        ? state.selectedApplicationId
        : action.payload.selectedApplicationId ||
          applications.find((application) => application.isActive !== false)?.id ||
          applications[0]?.id ||
          "";

      return {
        ...state,
        ...action.payload,
        activeCompanyId: action.payload.activeCompanyId || "",
        selectedApplicationId: nextSelectedApplicationId,
        tickets: sortTickets(action.payload.tickets || []),
        isReady: true,
        isSyncing: false,
        storageError: "",
      };
    }

    case "WORKSPACE_CACHE":
      return {
        ...state,
        ...action.payload.cache,
        session: action.payload.session,
        tickets: sortTickets(action.payload.cache?.tickets || []),
        isReady: true,
        isSyncing: false,
        storageError:
          "No se pudo conectar con Supabase. Mostrando la ultima cache local.",
      };

    case "WORKSPACE_ERROR":
      return {
        ...state,
        isReady: true,
        isSyncing: false,
        storageError: action.payload,
      };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        session: action.payload,
        isReady: true,
        storageError: "",
      };

    case "LOGOUT":
      return {
        ...initialState,
        isReady: true,
      };

    case "SET_SYNCING":
      return {
        ...state,
        isSyncing: action.payload,
      };

    case "SET_SELECTED_APPLICATION":
      return {
        ...state,
        selectedApplicationId: action.payload,
      };

    case "UPSERT_TICKET":
      return {
        ...state,
        tickets: replaceTicket(state.tickets, action.payload),
        storageError: "",
      };

    case "SET_ERROR":
      return {
        ...state,
        storageError: action.payload,
      };

    default:
      return state;
  }
};

export const TicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadWorkspace = useCallback(async (session, companyId = "") => {
    const workspace = await loadWorkspaceRequest(companyId);
    const nextSession = {
      ...session,
      user: workspace.user || session.user,
    };

    await saveActiveCompanyId(workspace.activeCompanyId || "");

    dispatch({
      type: "WORKSPACE_SUCCESS",
      payload: {
        ...workspace,
        session: nextSession,
      },
    });

    return {
      ...workspace,
      session: nextSession,
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      dispatch({ type: "BOOT_START" });

      try {
        const currentSession = await getCurrentSessionRequest();

        if (!currentSession) {
          if (isMounted) dispatch({ type: "BOOT_GUEST" });
          return;
        }

        try {
          const activeCompanyId = await loadActiveCompanyId();
          const workspace = await loadWorkspaceRequest(activeCompanyId || "");
          const session = {
            ...currentSession,
            user: workspace.user || currentSession.user,
          };

          if (isMounted) {
            await saveActiveCompanyId(workspace.activeCompanyId || "");
            dispatch({
              type: "WORKSPACE_SUCCESS",
              payload: {
                ...workspace,
                session,
              },
            });
          }
        } catch (error) {
          const cachedWorkspace = await loadWorkspaceCache();

          if (isMounted && cachedWorkspace) {
            dispatch({
              type: "WORKSPACE_CACHE",
              payload: {
                session: currentSession,
                cache: cachedWorkspace,
              },
            });
            return;
          }

          throw error;
        }
      } catch (error) {
        if (isMounted) {
          dispatch({
            type: "WORKSPACE_ERROR",
            payload:
              error.message ||
              "No se pudo iniciar la aplicacion con Supabase configurado.",
          });
        }
      }
    };

    boot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.session || !state.isReady) return;

    saveWorkspaceCache({
      company: state.company,
      memberships: state.memberships,
      invitations: state.invitations,
      activeCompanyId: state.activeCompanyId,
      applications: state.applications,
      selectedApplicationId: state.selectedApplicationId,
      tickets: state.tickets,
    }).catch(() => {});
  }, [
    state.applications,
    state.activeCompanyId,
    state.company,
    state.invitations,
    state.isReady,
    state.memberships,
    state.selectedApplicationId,
    state.session,
    state.tickets,
  ]);

  useEffect(() => {
    if (!state.session?.user?.id || !state.activeCompanyId) return;

    let isMounted = true;

    const registerNotifications = async () => {
      try {
        const registration = await registerForPushNotificationsAsync();

        if (!isMounted || !registration?.token) return;

        await registerPushTokenRequest({
          ...registration,
          companyId: state.activeCompanyId,
        });
      } catch {
        // Notifications are optional; the core ticket flow must keep working.
      }
    };

    registerNotifications();

    return () => {
      isMounted = false;
    };
  }, [state.activeCompanyId, state.session?.user?.id]);

  const login = useCallback(
    async (email, password) => {
      dispatch({ type: "SET_SYNCING", payload: true });

      try {
        const result = await loginRequest({ email, password });
        const session = {
          token: result.token,
          user: result.user,
        };

        dispatch({ type: "LOGIN_SUCCESS", payload: session });
        await loadWorkspace(session);

        return { ok: true };
      } catch (error) {
        const message = error.message || "No se pudo iniciar sesion.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false });
      }
    },
    [loadWorkspace]
  );

  const registerAccount = useCallback(
    async (payload) => {
      dispatch({ type: "SET_SYNCING", payload: true });

      try {
        const result = await registerAccountRequest(payload);
        const session = {
          token: result.token,
          user: result.user,
        };

        dispatch({ type: "LOGIN_SUCCESS", payload: session });
        await loadWorkspace(session);

        return { ok: true };
      } catch (error) {
        const message = error.message || "No se pudo crear la cuenta.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false });
      }
    },
    [loadWorkspace]
  );

  const createCompany = useCallback(
    async (payload) => {
      dispatch({ type: "SET_SYNCING", payload: true });

      try {
        const registration = await createCompanyRequest({
          ...payload,
          adminName: payload.adminName || state.session?.user?.name || "",
        });
        const companyId = registration?.company?.id || "";
        await loadWorkspace(state.session, companyId);

        return {
          ok: true,
          registration,
        };
      } catch (error) {
        const message = error.message || "No se pudo crear la empresa.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false });
      }
    },
    [loadWorkspace, state.session]
  );

  const logout = useCallback(async () => {
    await signOutRequest();
    await clearSession();
    await saveActiveCompanyId("");
    dispatch({ type: "LOGOUT" });
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!state.session) return;

    dispatch({ type: "SET_SYNCING", payload: true });

    try {
      await loadWorkspace(state.session, state.activeCompanyId);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "No se pudo sincronizar con el servidor.",
      });
    } finally {
      dispatch({ type: "SET_SYNCING", payload: false });
    }
  }, [loadWorkspace, state.activeCompanyId, state.session]);

  const switchCompany = useCallback(
    async (companyId) => {
      if (!state.session || companyId === state.activeCompanyId) return { ok: true };

      dispatch({ type: "SET_SYNCING", payload: true });

      try {
        await loadWorkspace(state.session, companyId);
        return { ok: true };
      } catch (error) {
        const message = error.message || "No se pudo cambiar de empresa.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false });
      }
    },
    [loadWorkspace, state.activeCompanyId, state.session]
  );

  const setSelectedApplicationId = useCallback((applicationId) => {
    dispatch({ type: "SET_SELECTED_APPLICATION", payload: applicationId });
  }, []);

  const createApplication = useCallback(
    async (payload) => {
      try {
        const result = await createApplicationRequest(payload, state.activeCompanyId);
        await refreshWorkspace();
        return { ok: true, application: result.application };
      } catch (error) {
        const message = error.message || "No se pudo crear la aplicacion.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      }
    },
    [refreshWorkspace, state.activeCompanyId]
  );

  const updateApplication = useCallback(
    async (applicationId, payload) => {
      try {
        const result = await updateApplicationRequest(applicationId, payload);
        await refreshWorkspace();
        return { ok: true, application: result.application };
      } catch (error) {
        const message = error.message || "No se pudo actualizar la aplicacion.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      }
    },
    [refreshWorkspace]
  );

  const listUsers = useCallback(async () => {
    try {
      const result = await listUsersRequest(state.activeCompanyId);
      return { ok: true, users: result.users };
    } catch (error) {
      const message = error.message || "No se pudieron cargar los usuarios.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { ok: false, message, users: [] };
    }
  }, [state.activeCompanyId]);

  const createUser = useCallback(async (payload) => {
    try {
      const result = await createUserRequest(payload, state.activeCompanyId);
      await refreshWorkspace();
      return { ok: true, invitation: result.invitation };
    } catch (error) {
      const message = error.message || "No se pudo crear el usuario.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { ok: false, message };
    }
  }, [refreshWorkspace, state.activeCompanyId]);

  const updateUser = useCallback(async (userId, payload) => {
    try {
      const result = await updateUserRequest(userId, payload);
      return { ok: true, user: result.user };
    } catch (error) {
      const message = error.message || "No se pudo actualizar el usuario.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { ok: false, message };
    }
  }, []);

  const acceptInvitation = useCallback(
    async (invitationId) => {
      if (!state.session) return { ok: false, message: "Debes iniciar sesion." };

      dispatch({ type: "SET_SYNCING", payload: true });

      try {
        const result = await acceptInvitationRequest(invitationId);
        await loadWorkspace(state.session, result.membership.companyId);
        return { ok: true, membership: result.membership };
      } catch (error) {
        const message = error.message || "No se pudo aceptar la invitacion.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false });
      }
    },
    [loadWorkspace, state.session]
  );

  const rejectInvitation = useCallback(
    async (invitationId) => {
      if (!state.session) return { ok: false, message: "Debes iniciar sesion." };

      dispatch({ type: "SET_SYNCING", payload: true });

      try {
        const result = await rejectInvitationRequest(invitationId);
        await loadWorkspace(state.session, state.activeCompanyId);
        return { ok: true, invitation: result.invitation };
      } catch (error) {
        const message = error.message || "No se pudo rechazar la invitacion.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false });
      }
    },
    [loadWorkspace, state.activeCompanyId, state.session]
  );

  const addTicket = useCallback(
    async (title, description, priority) => {
      const validation = validateTicketInput(title, description);

      if (!validation.ok) {
        return validation;
      }

      if (!state.selectedApplicationId) {
        return {
          ok: false,
          message: "Selecciona una aplicacion para registrar el ticket.",
        };
      }

      try {
        const result = await createTicketRequest({
          applicationId: state.selectedApplicationId,
          title: validation.value.title,
          description: validation.value.description,
          priority,
        });
        dispatch({ type: "UPSERT_TICKET", payload: result.ticket });
        return { ok: true, ticket: result.ticket };
      } catch (error) {
        const message = error.message || "No se pudo crear el ticket.";
        dispatch({ type: "SET_ERROR", payload: message });
        return { ok: false, message };
      }
    },
    [state.selectedApplicationId]
  );

  const changeTicketStatus = useCallback(async (ticketId, status, note = "") => {
    try {
      const result = await changeTicketStatusRequest(ticketId, { status, note });
      dispatch({ type: "UPSERT_TICKET", payload: result.ticket });
      return { ok: true, ticket: result.ticket };
    } catch (error) {
      const message = error.message || "No se pudo cambiar el estado.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { ok: false, message };
    }
  }, []);

  const completeTicket = useCallback(
    (ticketId) => changeTicketStatus(ticketId, TICKET_STATUS.COMPLETED),
    [changeTicketStatus]
  );

  const reopenTicket = useCallback(
    (ticketId) => changeTicketStatus(ticketId, TICKET_STATUS.PENDING),
    [changeTicketStatus]
  );

  const attachEvidence = useCallback(async (ticketId) => {
    try {
      const evidence = await pickEvidence();

      if (!evidence) {
        return { ok: false, cancelled: true };
      }

      const result = await addTicketEvidenceRequest(ticketId, evidence);
      dispatch({ type: "UPSERT_TICKET", payload: result.ticket });
      return { ok: true, ticket: result.ticket };
    } catch (error) {
      const message = error.message || "No se pudo adjuntar la evidencia.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { ok: false, message };
    }
  }, []);

  const addComment = useCallback(async (ticketId, body) => {
    try {
      const result = await addTicketCommentRequest(ticketId, { body });
      dispatch({ type: "UPSERT_TICKET", payload: result.ticket });
      return { ok: true, ticket: result.ticket };
    } catch (error) {
      const message = error.message || "No se pudo registrar el comentario.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { ok: false, message };
    }
  }, []);

  const activeTickets = useMemo(
    () => state.tickets.filter((ticket) => ticket.status !== TICKET_STATUS.COMPLETED),
    [state.tickets]
  );
  const history = useMemo(
    () => state.tickets.filter((ticket) => ticket.status === TICKET_STATUS.COMPLETED),
    [state.tickets]
  );

  const value = useMemo(
    () => ({
      session: state.session,
      user: state.session?.user || null,
      company: state.company,
      memberships: state.memberships,
      invitations: state.invitations,
      activeCompanyId: state.activeCompanyId,
      applications: state.applications,
      selectedApplicationId: state.selectedApplicationId,
      tickets: activeTickets,
      allTickets: state.tickets,
      history,
      isReady: state.isReady,
      isSyncing: state.isSyncing,
      storageError: state.storageError,
      stats: getTicketStats(activeTickets, history, state.tickets),
      login,
      registerAccount,
      createCompany,
      logout,
      refreshWorkspace,
      switchCompany,
      setSelectedApplicationId,
      createApplication,
      updateApplication,
      listUsers,
      createUser,
      updateUser,
      acceptInvitation,
      rejectInvitation,
      addTicket,
      changeTicketStatus,
      completeTicket,
      reopenTicket,
      attachEvidence,
      addComment,
    }),
    [
      activeTickets,
      addComment,
      addTicket,
      attachEvidence,
      changeTicketStatus,
      completeTicket,
      createCompany,
      createApplication,
      createUser,
      history,
      acceptInvitation,
      login,
      listUsers,
      logout,
      refreshWorkspace,
      registerAccount,
      rejectInvitation,
      reopenTicket,
      setSelectedApplicationId,
      switchCompany,
      updateApplication,
      updateUser,
      state,
    ]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};
