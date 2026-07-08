import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

export default function ProfileScreen() {
  const {
    acceptInvitation,
    activeCompanyId,
    company,
    createCompany,
    invitations,
    isSyncing,
    logout,
    memberships,
    rejectInvitation,
    switchCompany,
    user,
  } = useTickets();
  const [companyName, setCompanyName] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const submitCompany = async () => {
    setFeedback({ type: "", message: "" });

    const result = await createCompany({
      companyName,
      applicationName,
      adminName: user?.name || "",
    });

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setCompanyName("");
    setApplicationName("");
    setFeedback({ type: "success", message: "Empresa creada." });
  };

  const respondInvitation = async (invitationId, action) => {
    setFeedback({ type: "", message: "" });
    const result =
      action === "accept"
        ? await acceptInvitation(invitationId)
        : await rejectInvitation(invitationId);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setFeedback({
      type: "success",
      message:
        action === "accept" ? "Invitacion aceptada." : "Invitacion rechazada.",
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.screenPadding}>
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.header}>Perfil</Text>
              <Text style={styles.subtitle}>
                {user?.name || "Usuario"} · {user?.email || ""}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Cerrar sesion"
              accessibilityRole="button"
              onPress={logout}
              style={styles.iconActionButton}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {feedback.message ? (
          <Text style={feedback.type === "error" ? styles.errorText : styles.successText}>
            {feedback.message}
          </Text>
        ) : null}

        <View style={styles.adminGrid}>
          <View style={styles.adminPanel}>
            <Text style={styles.sectionTitle}>Empresas</Text>
            {memberships.length ? (
              memberships.map((membership) => {
                const selected = membership.companyId === activeCompanyId;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={membership.id}
                    onPress={() => switchCompany(membership.companyId)}
                    style={[
                      styles.inlineListItem,
                      selected && styles.inlineListItemActive,
                    ]}
                  >
                    <Ionicons
                      name={selected ? "business" : "business-outline"}
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.inlineListText}>
                      <Text style={styles.inlineListTitle}>
                        {membership.company?.name || "Empresa"}
                      </Text>
                      <Text style={styles.metaText}>
                        {membership.role} · {selected ? "activa" : "disponible"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                Todavia no perteneces a ninguna empresa.
              </Text>
            )}

            {company ? (
              <Text style={styles.helperText}>Actual: {company.name}</Text>
            ) : null}
          </View>

          <View style={styles.adminPanel}>
            <Text style={styles.sectionTitle}>Invitaciones</Text>
            {invitations.length ? (
              invitations.map((invitation) => (
                <View key={invitation.id} style={styles.inlineListItem}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                  <View style={styles.inlineListText}>
                    <Text style={styles.inlineListTitle}>
                      {invitation.company?.name || "Empresa"}
                    </Text>
                    <Text style={styles.metaText}>Rol: {invitation.role}</Text>
                    <View style={styles.actionRowWrap}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isSyncing}
                        onPress={() => respondInvitation(invitation.id, "accept")}
                        style={styles.compactButton}
                      >
                        <Text style={styles.compactButtonText}>Aceptar</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isSyncing}
                        onPress={() => respondInvitation(invitation.id, "reject")}
                        style={[styles.compactButton, styles.secondaryButton]}
                      >
                        <Text style={styles.compactButtonText}>Rechazar</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No tienes invitaciones pendientes.</Text>
            )}
          </View>

          <View style={styles.adminPanel}>
            <Text style={styles.sectionTitle}>Crear empresa</Text>
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
            <Pressable
              accessibilityRole="button"
              disabled={!companyName.trim() || isSyncing}
              onPress={submitCompany}
              style={({ pressed }) => [
                styles.button,
                (!companyName.trim() || isSyncing) && styles.buttonDisabled,
                pressed && companyName.trim() && !isSyncing && styles.buttonPressed,
              ]}
            >
              <Ionicons name="business-outline" size={20} color={colors.black} />
              <Text style={styles.buttonText}>Crear empresa</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
