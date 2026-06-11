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

export default function AddTicketScreen() {
  const { addTicket } = useTickets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const updateTitle = (value) => {
    setTitle(value);
    setFeedback({ type: "", message: "" });
  };

  const updateDescription = (value) => {
    setDescription(value);
    setFeedback({ type: "", message: "" });
  };

  const submitTicket = () => {
    const result = addTicket(title, description);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setTitle("");
    setDescription("");
    setFeedback({
      type: "success",
      message: `Ticket #${result.ticket.id} creado.`,
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
              Registra una tarea concreta con suficiente contexto para cerrarla sin friccion.
            </Text>
          </View>

          {feedback.message ? (
            <Text style={feedback.type === "error" ? styles.errorText : styles.successText}>
              {feedback.message}
            </Text>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Titulo</Text>
            <TextInput
              maxLength={MAX_TITLE_LENGTH}
              onChangeText={updateTitle}
              placeholder="Ej. Revisar pedido pendiente"
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
              placeholder="Agrega datos relevantes, responsables o siguiente accion."
              placeholderTextColor={colors.textDim}
              style={[styles.input, styles.textArea]}
              value={description}
            />
            <Text style={styles.helperText}>
              {description.trim().length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
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
              name="add"
              size={20}
              color={canSubmit ? colors.black : colors.textMuted}
            />
            <Text style={[styles.buttonText, !canSubmit && styles.buttonDisabledText]}>
              Crear ticket
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
