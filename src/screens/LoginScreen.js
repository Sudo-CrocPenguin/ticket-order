import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../config/environment";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

export default function LoginScreen({ initialError = "" }) {
  const { login, isSyncing } = useTickets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(initialError);

  const submit = async () => {
    setFeedback("");
    const result = await login(email, password);

    if (!result.ok) {
      setFeedback(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.authShell}>
          <View style={styles.headerBlock}>
            <Text style={styles.header}>Ticket Order</Text>
            <Text style={styles.subtitle}>
              Ingresa al tablero de soporte para registrar bugs, adjuntar evidencias y
              coordinar el estado con tu equipo.
            </Text>
          </View>

          <View style={styles.authPanel}>
            {feedback ? <Text style={styles.errorText}>{feedback}</Text> : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="admin@example.com"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contrasena</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder="Tu contrasena"
                placeholderTextColor={colors.textDim}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            <Pressable
              accessibilityLabel="Iniciar sesion"
              accessibilityRole="button"
              disabled={isSyncing}
              onPress={submit}
              style={({ pressed }) => [
                styles.button,
                isSyncing && styles.buttonDisabled,
                pressed && !isSyncing && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name="log-in-outline"
                size={20}
                color={isSyncing ? colors.textMuted : colors.black}
              />
              <Text style={[styles.buttonText, isSyncing && styles.buttonDisabledText]}>
                {isSyncing ? "Conectando" : "Iniciar sesion"}
              </Text>
            </Pressable>

            <Text style={styles.helperText}>API configurada: {API_URL}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
