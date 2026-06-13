import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

const roles = [
  { value: "developer", label: "Desarrollador" },
  { value: "viewer", label: "Observador" },
  { value: "admin", label: "Admin" },
];

export default function AdminScreen() {
  const {
    applications,
    company,
    createApplication,
    createUser,
    listUsers,
    storageError,
  } = useTickets();
  const [users, setUsers] = useState([]);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("developer");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    const result = await listUsers();
    if (result.ok) setUsers(result.users);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const submitApplication = async () => {
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    const result = await createApplication({
      name: appName,
      description: appDescription,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setAppName("");
    setAppDescription("");
    setFeedback({ type: "success", message: "Aplicacion creada." });
  };

  const submitUser = async () => {
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    const result = await createUser({
      name: userName,
      email: userEmail,
      password: userPassword,
      role: userRole,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("developer");
    setUsers((currentUsers) => [...currentUsers, result.user]);
    setFeedback({ type: "success", message: "Usuario creado." });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.screenPadding}>
        <View style={styles.headerBlock}>
          <Text style={styles.header}>Administracion</Text>
          <Text style={styles.subtitle}>
            Gestiona la empresa {company?.name || ""}, sus aplicaciones y los
            usuarios que pueden ver o modificar tickets.
          </Text>
        </View>

        {storageError ? (
          <View style={styles.storageNotice}>
            <Text style={styles.storageNoticeText}>{storageError}</Text>
          </View>
        ) : null}

        {feedback.message ? (
          <Text style={feedback.type === "error" ? styles.errorText : styles.successText}>
            {feedback.message}
          </Text>
        ) : null}

        <View style={styles.adminGrid}>
          <View style={styles.adminPanel}>
            <Text style={styles.sectionTitle}>Aplicaciones</Text>
            {applications.map((application) => (
              <View key={application.id} style={styles.inlineListItem}>
                <Ionicons name="apps-outline" size={18} color={colors.primary} />
                <View style={styles.inlineListText}>
                  <Text style={styles.inlineListTitle}>{application.name}</Text>
                  <Text style={styles.metaText}>
                    {application.description || "Sin descripcion"}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nueva aplicacion</Text>
              <TextInput
                onChangeText={setAppName}
                placeholder="Ej. Portal clientes"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={appName}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Descripcion</Text>
              <TextInput
                multiline
                onChangeText={setAppDescription}
                placeholder="Contexto funcional o tecnico"
                placeholderTextColor={colors.textDim}
                style={[styles.input, styles.smallTextArea]}
                value={appDescription}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!appName.trim() || isSubmitting}
              onPress={submitApplication}
              style={({ pressed }) => [
                styles.button,
                (!appName.trim() || isSubmitting) && styles.buttonDisabled,
                pressed && appName.trim() && !isSubmitting && styles.buttonPressed,
              ]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.black} />
              <Text style={styles.buttonText}>Crear aplicacion</Text>
            </Pressable>
          </View>

          <View style={styles.adminPanel}>
            <Text style={styles.sectionTitle}>Usuarios</Text>
            {users.map((item) => (
              <View key={item.id} style={styles.inlineListItem}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                <View style={styles.inlineListText}>
                  <Text style={styles.inlineListTitle}>{item.name}</Text>
                  <Text style={styles.metaText}>
                    {item.email} · {item.role}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                onChangeText={setUserName}
                placeholder="Nombre del usuario"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={userName}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setUserEmail}
                placeholder="dev@empresa.com"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={userEmail}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contrasena inicial</Text>
              <TextInput
                onChangeText={setUserPassword}
                placeholder="Minimo 8 caracteres"
                placeholderTextColor={colors.textDim}
                secureTextEntry
                style={styles.input}
                value={userPassword}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rol</Text>
              <View style={styles.segmentedRow}>
                {roles.map((role) => {
                  const selected = userRole === role.value;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={role.value}
                      onPress={() => setUserRole(role.value)}
                      style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          selected && styles.segmentButtonTextActive,
                        ]}
                      >
                        {role.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!userName.trim() || !userEmail.trim() || !userPassword || isSubmitting}
              onPress={submitUser}
              style={({ pressed }) => [
                styles.button,
                (!userName.trim() || !userEmail.trim() || !userPassword || isSubmitting) &&
                  styles.buttonDisabled,
                pressed &&
                  userName.trim() &&
                  userEmail.trim() &&
                  userPassword &&
                  !isSubmitting &&
                  styles.buttonPressed,
              ]}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.black} />
              <Text style={styles.buttonText}>Crear usuario</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
