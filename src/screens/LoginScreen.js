import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUPABASE_URL, isSupabaseConfigured } from "../config/environment";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

export default function LoginScreen({ initialError = "" }) {
  const { login, registerCompany, isSyncing } = useTickets();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [feedback, setFeedback] = useState(initialError);

  const submit = async () => {
    setFeedback("");
    const result = await login(email, password);

    if (!result.ok) {
      setFeedback(result.message);
    }
  };

  const submitRegistration = async () => {
    setFeedback("");
    const result = await registerCompany({
      companyName,
      applicationName,
      adminName,
      adminEmail: email,
      adminPassword: password,
    });

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
              Ingresa al tablero de soporte para registrar bugs, adjuntar evidencias
              y coordinar el estado con tu equipo.
            </Text>
          </View>

          <View style={styles.authPanel}>
            <View style={styles.segmentedRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setMode("login")}
                style={[styles.segmentButton, mode === "login" && styles.segmentButtonActive]}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    mode === "login" && styles.segmentButtonTextActive,
                  ]}
                >
                  Iniciar sesion
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setMode("register")}
                style={[
                  styles.segmentButton,
                  mode === "register" && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    mode === "register" && styles.segmentButtonTextActive,
                  ]}
                >
                  Registrar empresa
                </Text>
              </Pressable>
            </View>

            {feedback ? <Text style={styles.errorText}>{feedback}</Text> : null}

            {mode === "register" ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Empresa</Text>
                  <TextInput
                    onChangeText={setCompanyName}
                    placeholder="Nombre de la empresa"
                    placeholderTextColor={colors.textDim}
                    style={styles.input}
                    value={companyName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Aplicacion inicial</Text>
                  <TextInput
                    onChangeText={setApplicationName}
                    placeholder="Ej. Portal clientes"
                    placeholderTextColor={colors.textDim}
                    style={styles.input}
                    value={applicationName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nombre administrador</Text>
                  <TextInput
                    onChangeText={setAdminName}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.textDim}
                    style={styles.input}
                    value={adminName}
                  />
                </View>
              </>
            ) : null}

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
              accessibilityLabel={mode === "login" ? "Iniciar sesion" : "Registrar empresa"}
              accessibilityRole="button"
              disabled={isSyncing}
              onPress={mode === "login" ? submit : submitRegistration}
              style={({ pressed }) => [
                styles.button,
                isSyncing && styles.buttonDisabled,
                pressed && !isSyncing && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={mode === "login" ? "log-in-outline" : "business-outline"}
                size={20}
                color={isSyncing ? colors.textMuted : colors.black}
              />
              <Text style={[styles.buttonText, isSyncing && styles.buttonDisabledText]}>
                {isSyncing
                  ? "Conectando"
                  : mode === "login"
                    ? "Iniciar sesion"
                    : "Crear empresa"}
              </Text>
            </Pressable>

            <Text style={styles.helperText}>
              Supabase: {isSupabaseConfigured ? SUPABASE_URL : "sin configurar"}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
