import { Animated, Pressable, Text, View } from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import { formatTicketDate } from "../utils/ticketUtils";

export default function TicketCard({ ticket, variant = "active", onComplete, onReopen }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isCompleted = variant === "completed" || ticket.status === "completed";
  const primaryAction = isCompleted ? onReopen : onComplete;
  const actionLabel = isCompleted ? "Reabrir" : "Completar";
  const actionIcon = isCompleted ? "refresh" : "checkmark";
  const metaText = isCompleted
    ? `Completado ${formatTicketDate(ticket.completedAt)}`
    : `Creado ${formatTicketDate(ticket.createdAt)}`;

  const animatePress = () => {
    if (!primaryAction) return;

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => primaryAction(ticket.id));
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.ticketNumber}>Ticket #{ticket.id}</Text>
          <Text style={styles.title}>{ticket.title}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isCompleted ? "Cerrado" : "Activo"}</Text>
        </View>
      </View>

      <Text style={[styles.text, !ticket.description && styles.mutedText]}>
        {ticket.description || "Sin descripcion adicional."}
      </Text>
      <Text style={styles.metaText}>{metaText}</Text>

      {primaryAction ? (
        <View style={styles.actionRow}>
          <Pressable
            accessibilityLabel={`${actionLabel} ticket ${ticket.id}`}
            accessibilityRole="button"
            onPress={animatePress}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name={actionIcon} size={18} color={colors.text} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>{actionLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}
