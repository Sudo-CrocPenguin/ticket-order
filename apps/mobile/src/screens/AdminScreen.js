import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

const roles = [
  {
    value: "admin",
    label: "Admin",
    pluralLabel: "Admins",
    icon: "shield-checkmark-outline",
    emptyText: "No hay otros administradores en esta empresa.",
  },
  {
    value: "developer",
    label: "Desarrollador",
    pluralLabel: "Desarrolladores",
    icon: "code-slash-outline",
    emptyText: "No hay desarrolladores en esta empresa.",
  },
  {
    value: "viewer",
    label: "Observador",
    pluralLabel: "Observadores",
    icon: "eye-outline",
    emptyText: "No hay observadores en esta empresa.",
  },
];

const knownRoleValues = roles.map((role) => role.value);

const getRoleLabel = (value) =>
  roles.find((role) => role.value === value)?.label || "Sin rol";

export default function AdminScreen() {
  const {
    applications,
    company,
    createApplication,
    createUser,
    listUsers,
    storageError,
    updateApplication,
    updateUser,
  } = useTickets();
  const [users, setUsers] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appIsActive, setAppIsActive] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("developer");
  const [userIsActive, setUserIsActive] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedUsers = useMemo(() => {
    const knownGroups = roles.map((role) => ({
      ...role,
      users: users.filter((item) => item.role === role.value),
    }));
    const otherUsers = users.filter((item) => !knownRoleValues.includes(item.role));

    return otherUsers.length
      ? [
          ...knownGroups,
          {
            value: "other",
            label: "Otro",
            pluralLabel: "Otros roles",
            icon: "people-outline",
            emptyText: "",
            users: otherUsers,
          },
        ]
      : knownGroups;
  }, [users]);

  const activeUsersCount = useMemo(
    () => users.filter((item) => item.isActive !== false).length,
    [users]
  );

  const loadUsers = async () => {
    const result = await listUsers();
    if (result.ok) {
      setUsers(result.users);
      return;
    }

    setFeedback({ type: "error", message: result.message });
  };

  useEffect(() => {
    loadUsers();
  }, [company?.id]);

  const selectApplication = (application) => {
    setSelectedApplicationId(application.id);
    setAppName(application.name);
    setAppDescription(application.description || "");
    setAppIsActive(application.isActive !== false);
    setFeedback({ type: "", message: "" });
  };

  const resetApplicationForm = () => {
    setSelectedApplicationId("");
    setAppName("");
    setAppDescription("");
    setAppIsActive(true);
  };

  const selectUser = (item) => {
    setSelectedUserId(item.id);
    setUserName(item.name || "");
    setUserEmail(item.email || "");
    setUserRole(item.role || "developer");
    setUserIsActive(item.isActive !== false);
    setFeedback({ type: "", message: "" });
  };

  const resetUserForm = () => {
    setSelectedUserId("");
    setUserName("");
    setUserEmail("");
    setUserRole("developer");
    setUserIsActive(true);
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    const result = selectedApplicationId
      ? await updateApplication(selectedApplicationId, {
          name: appName,
          description: appDescription,
          isActive: appIsActive,
        })
      : await createApplication({
          name: appName,
          description: appDescription,
        });

    setIsSubmitting(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    resetApplicationForm();
    setFeedback({
      type: "success",
      message: selectedApplicationId ? "Aplicacion actualizada." : "Aplicacion creada.",
    });
  };

  const submitUser = async () => {
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    const result = selectedUserId
      ? await updateUser(selectedUserId, {
          role: userRole,
          isActive: userIsActive,
        })
      : await createUser({
          email: userEmail,
          role: userRole,
        });

    setIsSubmitting(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    if (selectedUserId) {
      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === result.user.id ? result.user : item))
      );
    }

    resetUserForm();
    setFeedback({
      type: "success",
      message: selectedUserId ? "Usuario actualizado." : "Invitacion enviada.",
    });
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.screenPadding}>
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
              <Pressable
                accessibilityRole="button"
                key={application.id}
                onPress={() => selectApplication(application)}
                style={[
                  styles.inlineListItem,
                  selectedApplicationId === application.id && styles.inlineListItemActive,
                ]}
              >
                <Ionicons name="apps-outline" size={18} color={colors.primary} />
                <View style={styles.inlineListText}>
                  <Text style={styles.inlineListTitle}>{application.name}</Text>
                  <Text style={styles.metaText}>
                    {application.isActive === false ? "Inactiva" : "Activa"} ·{" "}
                    {application.description || "Sin descripcion"}
                  </Text>
                </View>
              </Pressable>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {selectedApplicationId ? "Editar aplicacion" : "Nueva aplicacion"}
              </Text>
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
            {selectedApplicationId ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Estado</Text>
                <View style={styles.segmentedRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAppIsActive(true)}
                    style={[styles.segmentButton, appIsActive && styles.segmentButtonActive]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        appIsActive && styles.segmentButtonTextActive,
                      ]}
                    >
                      Activa
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAppIsActive(false)}
                    style={[
                      styles.segmentButton,
                      !appIsActive && styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        !appIsActive && styles.segmentButtonTextActive,
                      ]}
                    >
                      Inactiva
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
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
              <Text style={styles.buttonText}>
                {selectedApplicationId ? "Guardar aplicacion" : "Crear aplicacion"}
              </Text>
            </Pressable>
            {selectedApplicationId ? (
              <Pressable
                accessibilityRole="button"
                onPress={resetApplicationForm}
                style={[styles.button, styles.secondaryButton, { marginTop: 8 }]}
              >
                <Ionicons name="close-outline" size={20} color={colors.text} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Cancelar edicion
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.adminPanel}>
            <Text style={styles.sectionTitle}>Miembros de la empresa</Text>
            <Text style={styles.panelHelpText}>
              Solo los administradores pueden ver esta lista y modificar roles.
            </Text>

            <View style={styles.memberSummaryRow}>
              <View style={styles.memberSummaryItem}>
                <Text style={styles.memberSummaryValue}>{users.length}</Text>
                <Text style={styles.memberSummaryLabel}>Total</Text>
              </View>
              <View style={styles.memberSummaryItem}>
                <Text style={styles.memberSummaryValue}>{activeUsersCount}</Text>
                <Text style={styles.memberSummaryLabel}>Activos</Text>
              </View>
              <View style={styles.memberSummaryItem}>
                <Text style={styles.memberSummaryValue}>
                  {users.length - activeUsersCount}
                </Text>
                <Text style={styles.memberSummaryLabel}>Inactivos</Text>
              </View>
            </View>

            {groupedUsers.map((group) => (
              <View key={group.value} style={styles.memberGroup}>
                <View style={styles.memberGroupHeader}>
                  <View style={styles.memberGroupTitle}>
                    <Ionicons name={group.icon} size={18} color={colors.primary} />
                    <Text style={styles.inlineListTitle}>{group.pluralLabel}</Text>
                  </View>
                  <View style={styles.memberCountBadge}>
                    <Text style={styles.memberCountText}>{group.users.length}</Text>
                  </View>
                </View>

                {group.users.length ? (
                  group.users.map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      key={item.id}
                      onPress={() => selectUser(item)}
                      style={[
                        styles.inlineListItem,
                        selectedUserId === item.id && styles.inlineListItemActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          item.isActive === false
                            ? "person-remove-outline"
                            : "person-circle-outline"
                        }
                        size={20}
                        color={colors.primary}
                      />
                      <View style={styles.inlineListText}>
                        <Text style={styles.inlineListTitle}>
                          {item.name || item.email || "Usuario sin nombre"}
                        </Text>
                        <Text style={styles.metaText}>
                          {item.email || "Sin correo"} · {getRoleLabel(item.role)} ·{" "}
                          {item.isActive === false ? "inactivo" : "activo"}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.memberEmptyText}>{group.emptyText}</Text>
                )}
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {selectedUserId ? "Editar miembro" : "Invitar usuario registrado"}
              </Text>
              <TextInput
                onChangeText={setUserName}
                editable={false}
                placeholder={
                  selectedUserId
                    ? "Nombre del usuario"
                    : "Se toma del perfil registrado"
                }
                placeholderTextColor={colors.textDim}
                style={[styles.input, styles.inputDisabled]}
                value={userName}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo</Text>
              <TextInput
                autoCapitalize="none"
                editable={!selectedUserId}
                keyboardType="email-address"
                onChangeText={setUserEmail}
                placeholder={
                  selectedUserId
                    ? "No se cambia desde esta vista"
                    : "dev@empresa.com"
                }
                placeholderTextColor={colors.textDim}
                style={[styles.input, selectedUserId && styles.inputDisabled]}
                value={userEmail}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.helperText}>
                El usuario debe crear su cuenta primero. Luego podra aceptar la
                invitacion desde Perfil.
              </Text>
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
            {selectedUserId ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Estado</Text>
                <View style={styles.segmentedRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setUserIsActive(true)}
                    style={[styles.segmentButton, userIsActive && styles.segmentButtonActive]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        userIsActive && styles.segmentButtonTextActive,
                      ]}
                    >
                      Activo
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setUserIsActive(false)}
                    style={[
                      styles.segmentButton,
                      !userIsActive && styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        !userIsActive && styles.segmentButtonTextActive,
                      ]}
                    >
                      Inactivo
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={
                (!selectedUserId && !userEmail.trim()) ||
                isSubmitting
              }
              onPress={submitUser}
              style={({ pressed }) => [
                styles.button,
                ((!selectedUserId && !userEmail.trim()) || isSubmitting) &&
                  styles.buttonDisabled,
                pressed &&
                  (selectedUserId || userEmail.trim()) &&
                  !isSubmitting &&
                  styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={selectedUserId ? "save-outline" : "person-add-outline"}
                size={20}
                color={colors.black}
              />
              <Text style={styles.buttonText}>
                {selectedUserId ? "Guardar miembro" : "Enviar invitacion"}
              </Text>
            </Pressable>
            {selectedUserId ? (
              <Pressable
                accessibilityRole="button"
                onPress={resetUserForm}
                style={[styles.button, styles.secondaryButton, { marginTop: 8 }]}
              >
                <Ionicons name="close-outline" size={20} color={colors.text} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Cancelar edicion
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
    </KeyboardAwareScreen>
  );
}
