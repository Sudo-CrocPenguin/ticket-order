import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../utils/ticketUtils";
import { TICKET_PRIORITY, TICKET_PRIORITY_LABELS } from "../utils/ticketLabels";

const priorityOptions = [
  TICKET_PRIORITY.LOW,
  TICKET_PRIORITY.MEDIUM,
  TICKET_PRIORITY.HIGH,
  TICKET_PRIORITY.CRITICAL,
];

export default function AddTicketScreen() {
  const {
    addTicket,
    applications,
    isSyncing,
    selectedApplicationId,
    setSelectedApplicationId,
  } = useTickets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(TICKET_PRIORITY.MEDIUM);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && selectedApplicationId && !isSubmitting,
    [isSubmitting, selectedApplicationId, title]
  );

  const updateTitle = (value) => {
    setTitle(value);
    setFeedback({ type: "", message: "" });
  };

  const updateDescription = (value) => {
    setDescription(value);
    setFeedback({ type: "", message: "" });
  };

  const submitTicket = async () => {
    setIsSubmitting(true);
    const result = await addTicket(title, description, priority);
    setIsSubmitting(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setTitle("");
    setDescription("");
    setPriority(TICKET_PRIORITY.MEDIUM);
    setFeedback({
      type: "success",
      message: `Ticket ${result.ticket.id} creado.`,
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[styles.screenPadding, { paddingBottom: 28 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <Text style={styles.header}>Crear ticket</Text>
            <Text style={styles.subtitle}>
              Registra un bug con contexto suficiente para que cualquier
              desarrollador pueda reproducirlo y darle seguimiento.
            </Text>
          </View>

          {feedback.message ? (
            <Text style={feedback.type === "error" ? styles.errorText : styles.successText}>
              {feedback.message}
            </Text>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Aplicacion</Text>
            <View style={styles.segmentedRow}>
              {applications.map((application) => {
                const selected = application.id === selectedApplicationId;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={application.id}
                    onPress={() => setSelectedApplicationId(application.id)}
                    style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        selected && styles.segmentButtonTextActive,
                      ]}
                    >
                      {application.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Titulo</Text>
            <TextInput
              maxLength={MAX_TITLE_LENGTH}
              onChangeText={updateTitle}
              placeholder="Ej. Error al cargar evidencias"
              placeholderTextColor={colors.textDim}
              returnKeyType="next"
              style={styles.input}
              value={title}
            />
            <Text style={styles.helperText}>
              {title.trim().length}/{MAX_TITLE_LENGTH}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Descripcion</Text>
            <TextInput
              maxLength={MAX_DESCRIPTION_LENGTH}
              multiline
              onChangeText={updateDescription}
              placeholder="Incluye pasos para reproducir, resultado esperado, resultado actual y contexto tecnico."
              placeholderTextColor={colors.textDim}
              style={[styles.input, styles.textArea]}
              value={description}
            />
            <Text style={styles.helperText}>
              {description.trim().length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Prioridad</Text>
            <View style={styles.segmentedRow}>
              {priorityOptions.map((option) => {
                const selected = option === priority;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option}
                    onPress={() => setPriority(option)}
                    style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        selected && styles.segmentButtonTextActive,
                      ]}
                    >
                      {TICKET_PRIORITY_LABELS[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            accessibilityLabel="Crear ticket"
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={submitTicket}
            style={({ pressed }) => [
              styles.button,
              !canSubmit && styles.buttonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name={isSubmitting || isSyncing ? "sync" : "add"}
              size={20}
              color={canSubmit ? colors.black : colors.textMuted}
            />
            <Text style={[styles.buttonText, !canSubmit && styles.buttonDisabledText]}>
              {isSubmitting ? "Creando" : "Crear ticket"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
