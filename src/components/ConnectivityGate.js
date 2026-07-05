import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

const hasInternet = (state) => {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    return navigator.onLine;
  }

  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;

  return true;
};

export default function ConnectivityGate({ children }) {
  const netInfo = useNetInfo();
  const [isChecking, setIsChecking] = useState(false);
  const isOnline = useMemo(() => hasInternet(netInfo), [netInfo]);

  const retryConnection = useCallback(async () => {
    setIsChecking(true);

    try {
      await NetInfo.refresh();
    } finally {
      setIsChecking(false);
    }
  }, []);

  if (isOnline) {
    return children;
  }

  return (
    <View style={styles.container}>
      <View style={styles.centeredScreen}>
        <View style={styles.offlineIcon}>
          <Ionicons name="wifi-outline" size={30} color={colors.black} />
        </View>

        <Text style={styles.emptyTitle}>Sin conexion</Text>
        <Text style={styles.emptyText}>
          Conectate a una red Wi-Fi o activa tus datos moviles para cargar la
          informacion de Ticket Order.
        </Text>

        <View style={styles.updateActions}>
          <Pressable
            accessibilityLabel="Reintentar conexion"
            accessibilityRole="button"
            disabled={isChecking}
            onPress={retryConnection}
            style={({ pressed }) => [
              styles.button,
              styles.updateButton,
              isChecking && styles.buttonDisabled,
              pressed && !isChecking && styles.buttonPressed,
            ]}
          >
            {isChecking ? (
              <ActivityIndicator color={colors.textMuted} size="small" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={colors.black} />
            )}
            <Text style={[styles.buttonText, isChecking && styles.buttonDisabledText]}>
              {isChecking ? "Verificando" : "Reintentar"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
