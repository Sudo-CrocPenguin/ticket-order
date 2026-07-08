"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  LogOut,
  Paperclip,
  Plus,
  RefreshCcw,
  Settings,
  Shield,
  Ticket,
  Upload,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import AuthPanel from "@/components/AuthPanel";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import {
  acceptInvitation,
  addTicketEvidence,
  addTicketComment,
  changeTicketStatus,
  createApplication,
  createCompany,
  createEvidenceDownloadUrl,
  createTicket,
  getSession,
  inviteMember,
  listMembers,
  loadWorkspace,
  rejectInvitation,
  signOut,
  updateApplication,
  updateMember,
} from "@/lib/ticketApi";
import {
  ROLES,
  TICKET_PRIORITY,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS,
  priorityLabel,
  roleLabel,
  statusLabel,
} from "@/lib/constants";

const navItems = [
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "history", label: "Historial", icon: Archive },
  { id: "stats", label: "Estadisticas", icon: BarChart3 },
  { id: "admin", label: "Admin", icon: Settings },
  { id: "profile", label: "Perfil", icon: UserCircle },
];

const statusOrder = [
  TICKET_STATUS.PENDING,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.COMPLETED,
];

const priorityOrder = [
  TICKET_PRIORITY.CRITICAL,
  TICKET_PRIORITY.HIGH,
  TICKET_PRIORITY.MEDIUM,
  TICKET_PRIORITY.LOW,
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Sin fecha";

const statusIcon = (status) => {
  if (status === TICKET_STATUS.COMPLETED) return CheckCircle2;
  if (status === TICKET_STATUS.IN_PROGRESS) return Clock3;
  return CircleDot;
};

const percent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

const countBy = (items, key) =>
  items.reduce((accumulator, item) => {
    const value = item[key] || "unknown";
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

const getClosedAverageHours = (tickets) => {
  const durations = tickets
    .filter((ticketItem) => ticketItem.completedAt && ticketItem.createdAt)
    .map((ticketItem) => new Date(ticketItem.completedAt) - new Date(ticketItem.createdAt))
    .filter((duration) => Number.isFinite(duration) && duration >= 0);

  if (!durations.length) return null;

  const averageMs =
    durations.reduce((total, duration) => total + duration, 0) / durations.length;

  return Math.round(averageMs / 36_000) / 100;
};

const formatHours = (value) => (value === null ? "Sin datos" : `${value} h`);

const applicationName = (applications, applicationId) =>
  applications.find((application) => application.id === applicationId)?.name ||
  "Sin aplicacion";

const emptyWorkspace = {
  user: null,
  company: null,
  memberships: [],
  invitations: [],
  activeCompanyId: "",
  applications: [],
  tickets: [],
};

export default function WebApp() {
  const [session, setSession] = useState(null);
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [view, setView] = useState("tickets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(
    async (companyId = activeCompanyId) => {
      if (!hasSupabaseConfig || !session) return;

      setIsSyncing(true);
      setError("");

      try {
        const nextWorkspace = await loadWorkspace(companyId);
        setWorkspace(nextWorkspace);
        setActiveCompanyId(nextWorkspace.activeCompanyId);
        setSelectedTicketId((currentId) =>
          nextWorkspace.tickets.some((ticketItem) => ticketItem.id === currentId)
            ? currentId
            : ""
        );

        if (nextWorkspace.user?.role === "admin" && nextWorkspace.activeCompanyId) {
          const nextMembers = await listMembers(nextWorkspace.activeCompanyId);
          setMembers(nextMembers);
        } else {
          setMembers([]);
        }
      } catch (refreshError) {
        setError(refreshError.message || "No se pudo sincronizar la informacion.");
      } finally {
        setIsSyncing(false);
        setIsReady(true);
      }
    },
    [activeCompanyId, session]
  );

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      if (!hasSupabaseConfig) {
        setIsReady(true);
        return;
      }

      try {
        const currentSession = await getSession();
        if (!isMounted) return;
        setSession(currentSession);
        if (!currentSession) {
          setIsReady(true);
        }
      } catch (bootError) {
        setError(bootError.message || "No se pudo iniciar la web.");
        setIsReady(true);
      }
    };

    boot();

    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription?.data?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      refresh(activeCompanyId);
    }
  }, [session, refresh, activeCompanyId]);

  useEffect(() => {
    if (view === "tickets" && statusFilter === TICKET_STATUS.COMPLETED) {
      setStatusFilter("all");
    }
  }, [statusFilter, view]);

  useEffect(() => {
    if (
      applicationFilter !== "all" &&
      !workspace.applications.some((application) => application.id === applicationFilter)
    ) {
      setApplicationFilter("all");
    }
  }, [applicationFilter, workspace.applications]);

  const selectedTicket = useMemo(
    () =>
      selectedTicketId
        ? workspace.tickets.find((ticketItem) => ticketItem.id === selectedTicketId) ||
          null
        : null,
    [selectedTicketId, workspace.tickets]
  );

  const canWriteTickets = ["admin", "developer"].includes(workspace.user?.role);
  const canManageCompany = workspace.user?.role === "admin";

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workspace.tickets.filter((ticketItem) => {
      const matchesStatus =
        statusFilter === "all" || ticketItem.status === statusFilter;
      const matchesApplication =
        applicationFilter === "all" || ticketItem.applicationId === applicationFilter;
      const matchesSearch =
        !query ||
        ticketItem.title.toLowerCase().includes(query) ||
        ticketItem.description.toLowerCase().includes(query) ||
        String(ticketItem.id).toLowerCase().includes(query);

      return matchesStatus && matchesApplication && matchesSearch;
    });
  }, [applicationFilter, search, statusFilter, workspace.tickets]);

  const activeFilteredTickets = useMemo(
    () =>
      filteredTickets.filter(
        (ticketItem) => ticketItem.status !== TICKET_STATUS.COMPLETED
      ),
    [filteredTickets]
  );

  const historyTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workspace.tickets.filter((ticketItem) => {
      const matchesApplication =
        applicationFilter === "all" || ticketItem.applicationId === applicationFilter;
      const matchesSearch =
        !query ||
        ticketItem.title.toLowerCase().includes(query) ||
        ticketItem.description.toLowerCase().includes(query) ||
        String(ticketItem.id).toLowerCase().includes(query);

      return (
        ticketItem.status === TICKET_STATUS.COMPLETED &&
        matchesApplication &&
        matchesSearch
      );
    });
  }, [applicationFilter, search, workspace.tickets]);

  const stats = useMemo(() => {
    const total = workspace.tickets.length;
    const pending = workspace.tickets.filter(
      (ticketItem) => ticketItem.status === TICKET_STATUS.PENDING
    ).length;
    const inProgress = workspace.tickets.filter(
      (ticketItem) => ticketItem.status === TICKET_STATUS.IN_PROGRESS
    ).length;
    const completed = workspace.tickets.filter(
      (ticketItem) => ticketItem.status === TICKET_STATUS.COMPLETED
    ).length;
    const critical = workspace.tickets.filter(
      (ticketItem) => ticketItem.priority === TICKET_PRIORITY.CRITICAL
    ).length;

    return { total, pending, inProgress, completed, critical };
  }, [workspace.tickets]);

  const runAction = async (action, successMessage = "") => {
    setError("");
    setMessage("");
    setIsSyncing(true);

    try {
      await action();
      if (successMessage) setMessage(successMessage);
      await refresh(activeCompanyId);
    } catch (actionError) {
      setError(actionError.message || "No se pudo completar la accion.");
    } finally {
      setIsSyncing(false);
    }
  };

  const openEvidence = async (evidence) => {
    setError("");

    try {
      const url =
        evidence.publicUrl || (await createEvidenceDownloadUrl(evidence.storagePath));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (openError) {
      setError(openError.message || "No se pudo abrir la evidencia.");
    }
  };

  if (!session) {
    return <AuthPanel onAuthenticated={setSession} />;
  }

  if (!isReady) {
    return (
      <main className="loading-screen">
        <div className="spinner" />
        <p>Sincronizando Ticket Order</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img alt="Ticket Order" src="/logo.png" />
          <div>
            <strong>Ticket Order</strong>
            <span>Web dashboard</span>
          </div>
        </div>

        <label className="sidebar-select">
          Empresa activa
          <select
            onChange={(event) => setActiveCompanyId(event.target.value)}
            value={workspace.activeCompanyId}
          >
            {workspace.memberships.length ? (
              workspace.memberships.map((membership) => (
                <option key={membership.id} value={membership.companyId}>
                  {membership.company?.name || "Empresa"}
                </option>
              ))
            ) : (
              <option value="">Sin empresa</option>
            )}
          </select>
        </label>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={view === item.id ? "active" : ""}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          className="sidebar-exit"
          onClick={async () => {
            await signOut();
            setSession(null);
            setWorkspace(emptyWorkspace);
          }}
          type="button"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{workspace.company?.name || "Sin empresa"}</p>
            <h1>{titleForView(view)}</h1>
          </div>
          <div className="topbar-actions">
            <span className="role-chip">{roleLabel(workspace.user?.role)}</span>
            <button className="icon-button" onClick={() => refresh()} type="button">
              <RefreshCcw size={18} className={isSyncing ? "spin-icon" : ""} />
            </button>
          </div>
        </header>

        {error ? <div className="notice danger">{error}</div> : null}
        {message ? <div className="notice success">{message}</div> : null}

        {!workspace.activeCompanyId ? (
          <NoCompanyState
            invitations={workspace.invitations}
            onAccept={(invitationId) =>
              runAction(() => acceptInvitation(invitationId), "Invitacion aceptada.")
            }
            onCreate={(payload) =>
              runAction(() => createCompany(payload), "Empresa creada.")
            }
            onReject={(invitationId) =>
              runAction(() => rejectInvitation(invitationId), "Invitacion rechazada.")
            }
            user={workspace.user}
          />
        ) : null}

        {workspace.activeCompanyId && view === "tickets" ? (
          <TicketsView
            applications={workspace.applications}
            activeCompanyId={workspace.activeCompanyId}
            canWriteTickets={canWriteTickets}
            company={workspace.company}
            filteredTickets={activeFilteredTickets}
            memberships={workspace.memberships}
            onCompanyChange={setActiveCompanyId}
            onCreateTicket={(payload) =>
              runAction(() => createTicket(payload), "Ticket creado.")
            }
            onSelectTicket={setSelectedTicketId}
            search={search}
            applicationFilter={applicationFilter}
            selectedTicketId={selectedTicketId}
            setApplicationFilter={setApplicationFilter}
            setSearch={setSearch}
            setStatusFilter={setStatusFilter}
            statusFilter={statusFilter}
          />
        ) : null}

        {workspace.activeCompanyId && view === "history" ? (
          <HistoryView
            applicationFilter={applicationFilter}
            applications={workspace.applications}
            historyTickets={historyTickets}
            onSelectTicket={setSelectedTicketId}
            search={search}
            setApplicationFilter={setApplicationFilter}
            setSearch={setSearch}
          />
        ) : null}

        {workspace.activeCompanyId && view === "stats" ? (
          <StatsView
            applications={workspace.applications}
            company={workspace.company}
            stats={stats}
            tickets={workspace.tickets}
          />
        ) : null}

        {workspace.activeCompanyId && view === "admin" ? (
          <AdminView
            applications={workspace.applications}
            canManageCompany={canManageCompany}
            companyId={workspace.activeCompanyId}
            members={members}
            onCreateApplication={(payload) =>
              runAction(
                () => createApplication(payload, workspace.activeCompanyId),
                "Aplicacion creada."
              )
            }
            onUpdateApplication={(applicationId, payload) =>
              runAction(
                () => updateApplication(applicationId, payload),
                "Aplicacion actualizada."
              )
            }
            onInvite={(payload) =>
              runAction(
                () => inviteMember({ ...payload, companyId: workspace.activeCompanyId }),
                "Invitacion enviada."
              )
            }
            onUpdateMember={(membershipId, payload) =>
              runAction(
                () => updateMember(membershipId, payload),
                "Miembro actualizado."
              )
            }
          />
        ) : null}

        {workspace.activeCompanyId && view === "profile" ? (
          <ProfileView
            invitations={workspace.invitations}
            memberships={workspace.memberships}
            onAccept={(invitationId) =>
              runAction(() => acceptInvitation(invitationId), "Invitacion aceptada.")
            }
            onCreateCompany={(payload) =>
              runAction(() => createCompany(payload), "Empresa creada.")
            }
            onReject={(invitationId) =>
              runAction(() => rejectInvitation(invitationId), "Invitacion rechazada.")
            }
            user={workspace.user}
          />
        ) : null}

        {selectedTicket ? (
          <TicketModal
            applications={workspace.applications}
            canWriteTickets={canWriteTickets}
            onAddEvidence={(file) =>
              runAction(() => addTicketEvidence(selectedTicket.id, file), "Evidencia subida.")
            }
            onAddComment={(body) =>
              runAction(
                () => addTicketComment(selectedTicket.id, body),
                "Comentario agregado."
              )
            }
            onClose={() => setSelectedTicketId("")}
            onOpenEvidence={openEvidence}
            onStatusChange={(status) =>
              runAction(
                () => changeTicketStatus(selectedTicket.id, status),
                "Estado actualizado."
              )
            }
            ticket={selectedTicket}
          />
        ) : null}
      </section>
    </main>
  );
}

function titleForView(view) {
  if (view === "history") return "Historial";
  if (view === "stats") return "Estadisticas";
  if (view === "admin") return "Administracion";
  if (view === "profile") return "Perfil";
  return "Tickets";
}

function TicketsView({
  applications,
  activeCompanyId,
  applicationFilter,
  canWriteTickets,
  company,
  filteredTickets,
  memberships,
  onCompanyChange,
  onCreateTicket,
  onSelectTicket,
  search,
  setApplicationFilter,
  selectedTicketId,
  setSearch,
  setStatusFilter,
  statusFilter,
}) {
  const activeApplications = useMemo(
    () => applications.filter((application) => application.isActive !== false),
    [applications]
  );
  const [form, setForm] = useState({
    applicationId: activeApplications[0]?.id || "",
    title: "",
    description: "",
    priority: TICKET_PRIORITY.MEDIUM,
  });
  const canCreateTicket = canWriteTickets && activeApplications.length > 0;

  useEffect(() => {
    const currentApplicationIsActive = activeApplications.some(
      (application) => application.id === form.applicationId
    );

    if (!currentApplicationIsActive) {
      setForm((current) => ({
        ...current,
        applicationId: activeApplications[0]?.id || "",
      }));
    }
  }, [activeApplications, form.applicationId]);

  const submit = (event) => {
    event.preventDefault();
    onCreateTicket(form);
    setForm((current) => ({ ...current, title: "", description: "" }));
  };

  return (
    <div className="content-grid">
      <section className="main-column">
        <CompanyTicketStrip
          activeCompanyId={activeCompanyId}
          company={company}
          memberships={memberships}
          onCompanyChange={onCompanyChange}
          tickets={filteredTickets}
        />

        <div className="toolbar">
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titulo, descripcion o ID"
            value={search}
          />
          <select
            onChange={(event) => setApplicationFilter(event.target.value)}
            value={applicationFilter}
          >
            <option value="all">Todas las aplicaciones</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.name}
              </option>
            ))}
          </select>
          <select
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">Todos los estados</option>
            {Object.values(TICKET_STATUS)
              .filter((status) => status !== TICKET_STATUS.COMPLETED)
              .map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
          </select>
        </div>

        <div className="ticket-table">
          <div className="ticket-table-head">
            <span>Ticket</span>
            <span>Aplicacion</span>
            <span>Prioridad</span>
            <span>Estado</span>
            <span>Actualizado</span>
          </div>
          {filteredTickets.length ? (
            filteredTickets.map((ticketItem) => {
              const StatusIcon = statusIcon(ticketItem.status);
              return (
                <button
                  className={`ticket-row ${
                    selectedTicketId === ticketItem.id ? "selected" : ""
                  }`}
                  key={ticketItem.id}
                  onClick={() => onSelectTicket(ticketItem.id)}
                  type="button"
                >
                  <span>
                    <strong>{ticketItem.title}</strong>
                    <small>{String(ticketItem.id).slice(0, 8)}</small>
                  </span>
                  <span>{applicationName(applications, ticketItem.applicationId)}</span>
                  <span>{priorityLabel(ticketItem.priority)}</span>
                  <span className="status-pill">
                    <StatusIcon size={15} />
                    {statusLabel(ticketItem.status)}
                  </span>
                  <span>{formatDate(ticketItem.updatedAt)}</span>
                </button>
              );
            })
          ) : (
            <div className="empty-panel">No hay tickets con estos filtros.</div>
          )}
        </div>
      </section>

      <aside className="side-column">
        <section className="panel">
          <h2>Nuevo ticket</h2>
          {!canWriteTickets ? (
            <p className="muted">Tu rol actual solo permite observar tickets.</p>
          ) : null}
          <form className="form-stack" onSubmit={submit}>
            <label>
              Aplicacion
              <select
                disabled={!canCreateTicket}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    applicationId: event.target.value,
                  }))
                }
                required
                value={form.applicationId}
              >
                {activeApplications.length ? (
                  activeApplications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.name}
                    </option>
                  ))
                ) : (
                  <option value="">No hay aplicaciones activas</option>
                )}
              </select>
            </label>
            {!activeApplications.length ? (
              <p className="muted">
                Activa o crea una aplicacion desde Admin para poder crear tickets.
              </p>
            ) : null}
            <label>
              Titulo
              <input
                disabled={!canCreateTicket}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                required
                value={form.title}
              />
            </label>
            <label>
              Descripcion
              <textarea
                disabled={!canCreateTicket}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                value={form.description}
              />
            </label>
            <label>
              Prioridad
              <select
                disabled={!canCreateTicket}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priority: event.target.value }))
                }
                value={form.priority}
              >
                {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              disabled={!canCreateTicket || !form.applicationId || !form.title.trim()}
            >
              <Plus size={17} />
              Crear ticket
            </button>
          </form>
        </section>
      </aside>
    </div>
  );
}

function CompanyTicketStrip({
  activeCompanyId,
  company,
  memberships,
  onCompanyChange,
  tickets,
}) {
  const pendingTickets = tickets.filter(
    (ticketItem) => ticketItem.status !== TICKET_STATUS.COMPLETED
  ).length;

  return (
    <section className="company-strip">
      <div className="company-strip-header">
        <div>
          <p className="eyebrow">Empresas</p>
          <h2>{company?.name || "Sin empresa seleccionada"}</h2>
        </div>
        <span className="role-chip">
          {tickets.length} tickets · {pendingTickets} abiertos
        </span>
      </div>

      <div className="company-card-row">
        {memberships.map((membership) => {
          const selected = membership.companyId === activeCompanyId;
          return (
            <button
              className={`company-card ${selected ? "selected" : ""}`}
              key={membership.id}
              onClick={() => onCompanyChange(membership.companyId)}
              type="button"
            >
              <Building2 size={19} />
              <span>
                <strong>{membership.company?.name || "Empresa"}</strong>
                <small>
                  {roleLabel(membership.role)}
                  {selected
                    ? ` · ${tickets.length} tickets visibles`
                    : " · cambiar empresa"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HistoryView({
  applicationFilter,
  applications,
  historyTickets,
  onSelectTicket,
  search,
  setApplicationFilter,
  setSearch,
}) {
  return (
    <section className="main-column">
      <div className="history-header panel">
        <Archive size={26} />
        <div>
          <h2>Tickets completados</h2>
          <p className="muted">
            Consulta tickets cerrados, evidencias y el historial de cambios.
          </p>
        </div>
      </div>

      <div className="toolbar history-toolbar">
        <input
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar tickets cerrados"
          value={search}
        />
        <select
          onChange={(event) => setApplicationFilter(event.target.value)}
          value={applicationFilter}
        >
          <option value="all">Todas las aplicaciones</option>
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.name}
            </option>
          ))}
        </select>
      </div>

      <div className="ticket-table">
        <div className="ticket-table-head history-table-head">
          <span>Ticket</span>
          <span>Aplicacion</span>
          <span>Prioridad</span>
          <span>Cerrado</span>
        </div>
        {historyTickets.length ? (
          historyTickets.map((ticketItem) => (
            <button
              className="ticket-row history-ticket-row"
              key={ticketItem.id}
              onClick={() => onSelectTicket(ticketItem.id)}
              type="button"
            >
              <span>
                <strong>{ticketItem.title}</strong>
                <small>#{String(ticketItem.id).slice(0, 8).toUpperCase()}</small>
              </span>
              <span>{applicationName(applications, ticketItem.applicationId)}</span>
              <span>{priorityLabel(ticketItem.priority)}</span>
              <span>{formatDate(ticketItem.completedAt || ticketItem.updatedAt)}</span>
            </button>
          ))
        ) : (
          <div className="empty-panel">No hay tickets cerrados para mostrar.</div>
        )}
      </div>
    </section>
  );
}

function TicketModal({
  applications,
  canWriteTickets,
  onAddComment,
  onAddEvidence,
  onClose,
  onOpenEvidence,
  onStatusChange,
  ticket,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!ticket) {
    return null;
  }

  const ticketNumber = String(ticket.id).slice(0, 8).toUpperCase();

  const uploadEvidence = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onAddEvidence(file);
      event.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const body = commentBody.trim();
    if (!body) return;

    await onAddComment(body);
    setCommentBody("");
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-label={`Detalle del ticket ${ticketNumber}`}
        aria-modal="true"
        className="ticket-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Ticket #{ticketNumber}</p>
            <h2>{ticket.title}</h2>
          </div>
          <button
            aria-label="Cerrar detalle"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="modal-grid">
          <section className="modal-main">
            <div className="modal-section">
              <h3>Descripcion</h3>
              <p>{ticket.description || "Sin descripcion."}</p>
            </div>

            <div className="modal-section">
              <h3>Evidencias</h3>
              {canWriteTickets ? (
                <label className="upload-box">
                  <Upload size={18} />
                  <span>{isUploading ? "Subiendo evidencia" : "Subir evidencia"}</span>
                  <input disabled={isUploading} onChange={uploadEvidence} type="file" />
                </label>
              ) : null}

              {ticket.evidences?.length ? (
                <div className="evidence-list">
                  {ticket.evidences.map((evidence) => (
                    <button
                      className="evidence-row"
                      key={evidence.id}
                      onClick={() => onOpenEvidence(evidence)}
                      type="button"
                    >
                      <Paperclip size={17} />
                      <span>
                        <strong>{evidence.fileName}</strong>
                        <small>
                          {evidence.mimeType || "Archivo"} ·{" "}
                          {Math.max(Math.round((evidence.size || 0) / 1024), 1)} KB
                        </small>
                      </span>
                      <ExternalLink size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted">Este ticket no tiene evidencias adjuntas.</p>
              )}
            </div>

            <div className="modal-section">
              <h3>Historial de estado</h3>
              <div className="history-list modal-history">
                {ticket.statusHistory?.length ? (
                  ticket.statusHistory.map((log) => (
                    <div key={log.id}>
                      <strong>
                        {log.fromStatus ? `${statusLabel(log.fromStatus)} -> ` : ""}
                        {statusLabel(log.toStatus)}
                      </strong>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Sin historial disponible.</p>
                )}
              </div>
            </div>

            <div className="modal-section">
              <h3>Comentarios</h3>
              {ticket.comments?.length ? (
                <div className="comment-list">
                  {ticket.comments.map((comment) => (
                    <article className="comment-row" key={comment.id}>
                      <p>{comment.body}</p>
                      <span>{formatDate(comment.createdAt)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No hay comentarios en este ticket.</p>
              )}

              {canWriteTickets ? (
                <form className="comment-form" onSubmit={submitComment}>
                  <textarea
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Agregar comentario"
                    rows={3}
                    value={commentBody}
                  />
                  <button className="secondary-action" disabled={!commentBody.trim()}>
                    Agregar comentario
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          <aside className="modal-side">
            <section className="modal-section">
              <h3>Estado</h3>
              <select
                disabled={!canWriteTickets}
                onChange={(event) => onStatusChange(event.target.value)}
                value={ticket.status}
              >
                {Object.values(TICKET_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </section>

            <section className="modal-section">
              <h3>Datos del ticket</h3>
              <dl>
                <div>
                  <dt>Numero</dt>
                  <dd>#{ticketNumber}</dd>
                </div>
                <div>
                  <dt>ID completo</dt>
                  <dd className="mono-value">{ticket.id}</dd>
                </div>
                <div>
                  <dt>Aplicacion</dt>
                  <dd>{applicationName(applications, ticket.applicationId)}</dd>
                </div>
                <div>
                  <dt>Prioridad</dt>
                  <dd>{priorityLabel(ticket.priority)}</dd>
                </div>
                <div>
                  <dt>Estado actual</dt>
                  <dd>{statusLabel(ticket.status)}</dd>
                </div>
                <div>
                  <dt>Creado</dt>
                  <dd>{formatDate(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt>Actualizado</dt>
                  <dd>{formatDate(ticket.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Completado</dt>
                  <dd>
                    {ticket.completedAt ? formatDate(ticket.completedAt) : "No completado"}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function StatsView({ applications, company, stats, tickets }) {
  const completionRate = percent(stats.completed, stats.total);
  const statusCounts = countBy(tickets, "status");
  const priorityCounts = countBy(tickets, "priority");
  const applicationCounts = tickets.reduce((accumulator, ticketItem) => {
    accumulator[ticketItem.applicationId] =
      (accumulator[ticketItem.applicationId] || 0) + 1;
    return accumulator;
  }, {});
  const activeTickets = stats.pending + stats.inProgress;
  const criticalOpen = tickets.filter(
    (ticketItem) =>
      ticketItem.priority === TICKET_PRIORITY.CRITICAL &&
      ticketItem.status !== TICKET_STATUS.COMPLETED
  ).length;
  const closedAverageHours = getClosedAverageHours(tickets);
  const statusRows = statusOrder.map((status) => ({
    label: statusLabel(status),
    value: statusCounts[status] || 0,
    tone:
      status === TICKET_STATUS.COMPLETED
        ? "success"
        : status === TICKET_STATUS.IN_PROGRESS
          ? "info"
          : "warning",
  }));
  const priorityRows = priorityOrder.map((value) => ({
    label: priorityLabel(value),
    value: priorityCounts[value] || 0,
    tone: value,
  }));
  const applicationRows = applications.map((application) => ({
    label: application.name,
    value: applicationCounts[application.id] || 0,
  }));
  const recentlyUpdated = [...tickets]
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))
    .slice(0, 5);

  return (
    <div className="stats-dashboard">
      <section className="stats-hero">
        <div>
          <p className="eyebrow">{company?.name || "Empresa"}</p>
          <h2>Estado operativo de tickets</h2>
          <p className="muted">
            Lectura general del trabajo abierto, avance de cierre y distribucion
            por aplicacion.
          </p>
        </div>
        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(var(--primary) ${completionRate}%, var(--surface-elevated) 0)`,
          }}
        >
          <strong>{completionRate}%</strong>
          <span>cerrado</span>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <Ticket size={20} />
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card">
          <CircleDot size={20} />
          <span>Activos</span>
          <strong>{activeTickets}</strong>
        </article>
        <article className="stat-card">
          <CircleDot size={20} />
          <span>Pendientes</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="stat-card">
          <Clock3 size={20} />
          <span>En progreso</span>
          <strong>{stats.inProgress}</strong>
        </article>
        <article className="stat-card">
          <CheckCircle2 size={20} />
          <span>Completados</span>
          <strong>{stats.completed}</strong>
        </article>
        <article className="stat-card critical">
          <Shield size={20} />
          <span>Criticos abiertos</span>
          <strong>{criticalOpen}</strong>
        </article>
        <article className="stat-card">
          <Clock3 size={20} />
          <span>Promedio cierre</span>
          <strong className={closedAverageHours === null ? "compact-value" : ""}>
            {formatHours(closedAverageHours)}
          </strong>
        </article>
      </section>

      <section className="analytics-grid">
        <BarPanel rows={statusRows} title="Tickets por estado" total={stats.total} />
        <BarPanel rows={priorityRows} title="Tickets por prioridad" total={stats.total} />
        <BarPanel
          emptyText="No hay aplicaciones con tickets todavia."
          rows={applicationRows}
          title="Carga por aplicacion"
          total={stats.total}
        />
        <section className="panel">
          <h2>Actividad reciente</h2>
          <div className="recent-list">
            {recentlyUpdated.length ? (
              recentlyUpdated.map((ticketItem) => (
                <div key={ticketItem.id}>
                  <strong>{ticketItem.title}</strong>
                  <span>
                    {statusLabel(ticketItem.status)} ·{" "}
                    {applicationName(applications, ticketItem.applicationId)} ·{" "}
                    {formatDate(ticketItem.updatedAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No hay actividad para analizar.</p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function BarPanel({ emptyText = "Sin datos.", rows, title, total }) {
  const visibleRows = rows.filter((row) => row.value > 0);

  return (
    <section className="panel analytics-panel">
      <h2>{title}</h2>
      {visibleRows.length ? (
        <div className="bar-list">
          {visibleRows.map((row) => {
            const rowPercent = percent(row.value, total);
            return (
              <div className="bar-metric" key={row.label}>
                <div>
                  <strong>{row.label}</strong>
                  <span>
                    {row.value} · {rowPercent}%
                  </span>
                </div>
                <div className="bar-track">
                  <span
                    className={`bar-fill tone-${row.tone || "default"}`}
                    style={{ width: `${Math.max(rowPercent, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">{emptyText}</p>
      )}
    </section>
  );
}

function AdminView({
  applications,
  canManageCompany,
  members,
  onCreateApplication,
  onInvite,
  onUpdateApplication,
  onUpdateMember,
}) {
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [appForm, setAppForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "developer" });
  const activeMembers = members.filter((member) => member.isActive !== false);
  const inactiveMembers = members.filter((member) => member.isActive === false);
  const groupedMembers = ROLES.map((role) => ({
    ...role,
    members: activeMembers.filter((member) => member.role === role.value),
  }));

  const selectApplication = (application) => {
    setSelectedApplicationId(application.id);
    setAppForm({
      name: application.name || "",
      description: application.description || "",
      isActive: application.isActive !== false,
    });
  };

  const resetApplicationForm = () => {
    setSelectedApplicationId("");
    setAppForm({ name: "", description: "", isActive: true });
  };

  const submitApplication = (event) => {
    event.preventDefault();

    if (selectedApplicationId) {
      onUpdateApplication(selectedApplicationId, appForm);
    } else {
      onCreateApplication(appForm);
    }

    resetApplicationForm();
  };

  if (!canManageCompany) {
    return (
      <section className="panel">
        <Shield size={24} />
        <h2>Solo administradores</h2>
        <p className="muted">Tu rol actual no permite ver ni modificar miembros.</p>
      </section>
    );
  }

  return (
    <div className="content-grid">
      <section className="main-column">
        <div className="admin-summary-grid">
          <article className="stat-card">
            <span>Total miembros</span>
            <strong>{members.length}</strong>
          </article>
          <article className="stat-card">
            <span>Activos</span>
            <strong>{activeMembers.length}</strong>
          </article>
          <article className="stat-card">
            <span>Inactivos</span>
            <strong>{inactiveMembers.length}</strong>
          </article>
        </div>

        <div className="panel">
          <h2>Miembros por rol</h2>
          <div className="member-role-groups">
            {groupedMembers.map((group) => (
              <section className="member-role-group" key={group.value}>
                <div className="member-role-header">
                  <h3>{group.label}</h3>
                  <span>{group.members.length}</span>
                </div>
                {group.members.length ? (
                  group.members.map((member) => (
                    <MemberAdminRow
                      key={member.id}
                      member={member}
                      onUpdateMember={onUpdateMember}
                    />
                  ))
                ) : (
                  <p className="muted">Sin miembros activos en este rol.</p>
                )}
              </section>
            ))}

            {inactiveMembers.length ? (
              <section className="member-role-group">
                <div className="member-role-header">
                  <h3>Inactivos</h3>
                  <span>{inactiveMembers.length}</span>
                </div>
                {inactiveMembers.map((member) => (
                  <MemberAdminRow
                    key={member.id}
                    member={member}
                    onUpdateMember={onUpdateMember}
                  />
                ))}
              </section>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="side-column">
        <section className="panel">
          <h2>Invitar miembro</h2>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              onInvite(inviteForm);
              setInviteForm({ email: "", role: "developer" });
            }}
          >
            <label>
              Correo
              <input
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
                type="email"
                value={inviteForm.email}
              />
            </label>
            <label>
              Rol
              <select
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                value={inviteForm.role}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button">
              <Users size={17} />
              Enviar invitacion
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Aplicaciones</h2>
          <div className="application-list">
            {applications.map((application) => (
              <button
                className={`application-row ${
                  selectedApplicationId === application.id ? "selected" : ""
                }`}
                key={application.id}
                onClick={() => selectApplication(application)}
                type="button"
              >
                <span>
                  <strong>{application.name}</strong>
                  <small>{application.description || "Sin descripcion"}</small>
                </span>
                <em>{application.isActive === false ? "Inactiva" : "Activa"}</em>
              </button>
            ))}
          </div>
          <form
            className="form-stack"
            onSubmit={submitApplication}
          >
            <label>
              {selectedApplicationId ? "Editar aplicacion" : "Nueva aplicacion"}
              <input
                onChange={(event) =>
                  setAppForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                value={appForm.name}
              />
            </label>
            <label>
              Descripcion
              <textarea
                onChange={(event) =>
                  setAppForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                value={appForm.description}
              />
            </label>
            {selectedApplicationId ? (
              <label>
                Estado
                <select
                  onChange={(event) =>
                    setAppForm((current) => ({
                      ...current,
                      isActive: event.target.value === "active",
                    }))
                  }
                  value={appForm.isActive ? "active" : "inactive"}
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </label>
            ) : null}
            <button className="secondary-action">
              <Plus size={16} />
              {selectedApplicationId ? "Guardar aplicacion" : "Crear aplicacion"}
            </button>
            {selectedApplicationId ? (
              <button
                className="secondary-action"
                onClick={resetApplicationForm}
                type="button"
              >
                Cancelar edicion
              </button>
            ) : null}
          </form>
        </section>
      </aside>
    </div>
  );
}

function MemberAdminRow({ member, onUpdateMember }) {
  return (
    <div className="member-row">
      <div>
        <strong>{member.name || member.email}</strong>
        <span>{member.email}</span>
      </div>
      <select
        onChange={(event) => onUpdateMember(member.id, { role: event.target.value })}
        value={member.role}
      >
        {ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      <select
        onChange={(event) =>
          onUpdateMember(member.id, {
            isActive: event.target.value === "active",
          })
        }
        value={member.isActive === false ? "inactive" : "active"}
      >
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>
    </div>
  );
}

function ProfileView({
  invitations,
  memberships,
  onAccept,
  onCreateCompany,
  onReject,
  user,
}) {
  return (
    <div className="content-grid">
      <section className="main-column">
        <section className="panel">
          <h2>{user?.name || "Usuario"}</h2>
          <p className="muted">{user?.email}</p>
          <div className="membership-grid">
            {memberships.map((membership) => (
              <article className="membership-card" key={membership.id}>
                <Building2 size={20} />
                <strong>{membership.company?.name}</strong>
                <span>{roleLabel(membership.role)}</span>
              </article>
            ))}
          </div>
        </section>

        <InvitationsPanel
          invitations={invitations}
          onAccept={onAccept}
          onReject={onReject}
        />
      </section>

      <aside className="side-column">
        <CompanyForm onCreate={onCreateCompany} user={user} />
      </aside>
    </div>
  );
}

function NoCompanyState({ invitations, onAccept, onCreate, onReject, user }) {
  return (
    <div className="content-grid">
      <section className="main-column">
        <section className="panel empty-workspace">
          <Building2 size={32} />
          <h2>Selecciona o crea una empresa</h2>
          <p className="muted">
            Esta cuenta aun no tiene una empresa activa. Acepta una invitacion o
            crea una empresa nueva para empezar.
          </p>
        </section>
        <InvitationsPanel
          invitations={invitations}
          onAccept={onAccept}
          onReject={onReject}
        />
      </section>
      <aside className="side-column">
        <CompanyForm onCreate={onCreate} user={user} />
      </aside>
    </div>
  );
}

function InvitationsPanel({ invitations, onAccept, onReject }) {
  return (
    <section className="panel">
      <h2>Invitaciones</h2>
      {invitations.length ? (
        <div className="compact-list">
          {invitations.map((invitation) => (
            <div className="invitation-row" key={invitation.id}>
              <div>
                <strong>{invitation.company?.name || "Empresa"}</strong>
                <span>{roleLabel(invitation.role)}</span>
              </div>
              <div className="row-actions">
                <button onClick={() => onAccept(invitation.id)} type="button">
                  Aceptar
                </button>
                <button onClick={() => onReject(invitation.id)} type="button">
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No tienes invitaciones pendientes.</p>
      )}
    </section>
  );
}

function CompanyForm({ onCreate, user }) {
  const [form, setForm] = useState({
    companyName: "",
    applicationName: "Aplicacion Principal",
    adminName: user?.name || "",
  });

  return (
    <section className="panel">
      <h2>Nueva empresa</h2>
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(form);
          setForm((current) => ({ ...current, companyName: "" }));
        }}
      >
        <label>
          Nombre de empresa
          <input
            onChange={(event) =>
              setForm((current) => ({ ...current, companyName: event.target.value }))
            }
            required
            value={form.companyName}
          />
        </label>
        <label>
          Aplicacion inicial
          <input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                applicationName: event.target.value,
              }))
            }
            required
            value={form.applicationName}
          />
        </label>
        <label>
          Nombre admin
          <input
            onChange={(event) =>
              setForm((current) => ({ ...current, adminName: event.target.value }))
            }
            required
            value={form.adminName}
          />
        </label>
        <button className="primary-button">
          <Building2 size={17} />
          Crear empresa
        </button>
      </form>
    </section>
  );
}
