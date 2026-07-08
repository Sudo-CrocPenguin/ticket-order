import { Modal, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

export default function CompanySwitcher() {
  const { activeCompanyId, memberships, switchCompany } = useTickets();
  const [visible, setVisible] = useState(false);

  const selectCompany = async (companyId) => {
    setVisible(false);
    await switchCompany(companyId);
  };

  return (
    <>
      <Pressable
        accessibilityLabel="Cambiar empresa"
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={styles.iconActionButton}
      >
        <Ionicons name="business-outline" size={20} color={colors.text} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)}>
          <View style={styles.modalPanel}>
            <Text style={styles.sectionTitle}>Cambiar empresa</Text>
            {memberships.map((membership) => {
              const selected = membership.companyId === activeCompanyId;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={membership.id}
                  onPress={() => selectCompany(membership.companyId)}
                  style={[
                    styles.inlineListItem,
                    selected && styles.inlineListItemActive,
                  ]}
                >
                  <Ionicons
                    name={selected ? "checkmark-circle" : "business-outline"}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.inlineListText}>
                    <Text style={styles.inlineListTitle}>
                      {membership.company?.name || "Empresa"}
                    </Text>
                    <Text style={styles.metaText}>{membership.role}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
