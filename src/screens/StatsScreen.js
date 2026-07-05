import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import {
  TICKET_PRIORITY,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
} from "../utils/ticketLabels";

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

const countBy = (items, key) =>
  items.reduce((accumulator, item) => {
    const value = item[key] || "unknown";
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

const getClosedAverageHours = (tickets) => {
  const closedDurations = tickets
    .filter((ticket) => ticket.completedAt && ticket.createdAt)
    .map((ticket) => new Date(ticket.completedAt) - new Date(ticket.createdAt))
    .filter((duration) => Number.isFinite(duration) && duration >= 0);

  if (!closedDurations.length) return null;

  const averageMs =
    closedDurations.reduce((total, duration) => total + duration, 0) /
    closedDurations.length;

  return Math.round(averageMs / 36_000) / 100;
};

const MetricCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BarRow = ({ label, value, max, color = colors.primary }) => {
  const percentage = max ? Math.max(6, Math.round((value / max) * 100)) : 0;

  return (
    <View style={styles.barRow}>
      <View style={styles.barRowHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const { allTickets, applications, company, stats } = useTickets();

  const report = useMemo(() => {
    const statusCounts = countBy(allTickets, "status");
    const priorityCounts = countBy(allTickets, "priority");
    const applicationCounts = allTickets.reduce((accumulator, ticket) => {
      accumulator[ticket.applicationId] = (accumulator[ticket.applicationId] || 0) + 1;
      return accumulator;
    }, {});
    const maxStatus = Math.max(1, ...Object.values(statusCounts));
    const maxPriority = Math.max(1, ...Object.values(priorityCounts));
    const maxApplication = Math.max(1, ...Object.values(applicationCounts));
    const criticalOpen = allTickets.filter(
      (ticket) =>
        ticket.priority === TICKET_PRIORITY.CRITICAL &&
        ticket.status !== TICKET_STATUS.COMPLETED
    ).length;

    return {
      statusCounts,
      priorityCounts,
      applicationCounts,
      maxStatus,
      maxPriority,
      maxApplication,
      criticalOpen,
      closedAverageHours: getClosedAverageHours(allTickets),
    };
  }, [allTickets]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.screenPadding, { paddingBottom: 28 }]}>
        <View style={styles.headerBlock}>
          <Text style={styles.header}>Estadisticas</Text>
          <Text style={styles.subtitle}>
            {company?.name || "Empresa"} · salud general de bugs, prioridad y avance.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <MetricCard label="Activos" value={stats.active} />
          <MetricCard label="Criticos abiertos" value={report.criticalOpen} />
          <MetricCard
            label="Promedio cierre"
            value={
              report.closedAverageHours === null
                ? "Sin datos"
                : `${report.closedAverageHours} h`
            }
          />
          <MetricCard label="Total" value={stats.total} />
        </View>

        <View style={styles.statsPanel}>
          <Text style={styles.sectionTitle}>Estado</Text>
          {statusOrder.map((status) => (
            <BarRow
              key={status}
              label={TICKET_STATUS_LABELS[status]}
              max={report.maxStatus}
              value={report.statusCounts[status] || 0}
            />
          ))}
        </View>

        <View style={styles.statsPanel}>
          <Text style={styles.sectionTitle}>Prioridad</Text>
          {priorityOrder.map((priority) => (
            <BarRow
              color={
                priority === TICKET_PRIORITY.CRITICAL
                  ? colors.danger
                  : priority === TICKET_PRIORITY.HIGH
                    ? colors.warning
                    : colors.primary
              }
              key={priority}
              label={TICKET_PRIORITY_LABELS[priority]}
              max={report.maxPriority}
              value={report.priorityCounts[priority] || 0}
            />
          ))}
        </View>

        <View style={styles.statsPanel}>
          <Text style={styles.sectionTitle}>Aplicaciones</Text>
          {applications.map((application) => (
            <BarRow
              key={application.id}
              label={application.name}
              max={report.maxApplication}
              value={report.applicationCounts[application.id] || 0}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
