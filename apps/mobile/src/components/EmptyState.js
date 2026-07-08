import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

export default function EmptyState({ icon = "file-tray-outline", title, message }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={42} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}
