import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import { formatTicketDate } from "../utils/ticketUtils";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
} from "../utils/ticketLabels";

const StatusButton = ({ icon, label, disabled, onPress }) => (
  <Pressable
    accessibilityLabel={label}
    accessibilityRole="button"
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.compactButton,
      disabled && styles.buttonDisabled,
      pressed && !disabled && styles.buttonPressed,
    ]}
  >
    <Ionicons
      name={icon}
      size={16}
      color={disabled ? colors.textMuted : colors.text}
    />
    <Text style={[styles.compactButtonText, disabled && styles.buttonDisabledText]}>
      {label}
    </Text>
  </Pressable>
);

export default function TicketCard({
  ticket,
  variant = "active",
  onChangeStatus,
  onAddEvidence,
}) {
  const isCompleted = ticket.status === TICKET_STATUS.COMPLETED || variant === "completed";
  const metaText = isCompleted
    ? `Completado ${formatTicketDate(ticket.completedAt)}`
    : `Actualizado ${formatTicketDate(ticket.updatedAt || ticket.createdAt)}`;
  const evidenceCount = ticket.evidences?.length || 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.ticketNumber}>Ticket {ticket.id}</Text>
          <Text style={styles.title}>{ticket.title}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
          </Text>
        </View>
      </View>

      <Text style={[styles.text, !ticket.description && styles.mutedText]}>
        {ticket.description || "Sin descripcion adicional."}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{metaText}</Text>
        <Text style={styles.metaText}>
          Prioridad {TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}
        </Text>
      </View>

      <View style={styles.evidenceSummary}>
        <Ionicons name="attach-outline" size={16} color={colors.textDim} />
        <Text style={styles.metaText}>
          {evidenceCount
            ? `${evidenceCount} evidencia${evidenceCount === 1 ? "" : "s"}`
            : "Sin evidencias"}
        </Text>
      </View>

      {ticket.statusHistory?.length ? (
        <Text style={styles.metaText}>
          Ultimo cambio: {TICKET_STATUS_LABELS[ticket.statusHistory[0].toStatus]} por{" "}
          {formatTicketDate(ticket.statusHistory[0].createdAt)}
        </Text>
      ) : null}

      <View style={styles.actionRowWrap}>
        <StatusButton
          disabled={ticket.status === TICKET_STATUS.PENDING}
          icon="pause-outline"
          label="Pendiente"
          onPress={() => onChangeStatus?.(ticket.id, TICKET_STATUS.PENDING)}
        />
        <StatusButton
          disabled={ticket.status === TICKET_STATUS.IN_PROGRESS}
          icon="construct-outline"
          label="En progreso"
          onPress={() => onChangeStatus?.(ticket.id, TICKET_STATUS.IN_PROGRESS)}
        />
        <StatusButton
          disabled={ticket.status === TICKET_STATUS.COMPLETED}
          icon="checkmark-done-outline"
          label="Completado"
          onPress={() => onChangeStatus?.(ticket.id, TICKET_STATUS.COMPLETED)}
        />
        <StatusButton
          icon="cloud-upload-outline"
          label="Evidencia"
          onPress={() => onAddEvidence?.(ticket.id)}
        />
      </View>
    </View>
  );
}
