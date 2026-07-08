import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

const canUseExpoUpdates = () => Platform.OS !== "web" && Updates.isEnabled;

const getErrorMessage = (error) =>
  error?.message || "No se pudo completar la actualizacion.";

export default function UpdateGate({ children }) {
  const [phase, setPhase] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");

  const checkForUpdate = useCallback(async () => {
    if (!canUseExpoUpdates()) return;

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable || update.isRollBackToEmbedded) {
        setPhase("available");
      }
    } catch {
      setPhase("ready");
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setPhase("downloading");
    setErrorMessage("");

    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      setPhase("error");
      setErrorMessage(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  if (phase === "available" || phase === "downloading" || phase === "error") {
    const isDownloading = phase === "downloading";

    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.centeredScreen}>
          <View style={styles.updateIcon}>
            {isDownloading ? (
              <ActivityIndicator color={colors.black} size="small" />
            ) : (
              <Ionicons name="cloud-download-outline" size={28} color={colors.black} />
            )}
          </View>

          <Text style={styles.emptyTitle}>
            {isDownloading ? "Actualizando app" : "Nueva version disponible"}
          </Text>
          <Text style={styles.emptyText}>
            {isDownloading
              ? "Estamos descargando la ultima version desde Expo."
              : "Hay cambios nuevos para Ticket Order. Actualiza para continuar con la version mas reciente."}
          </Text>

          {phase === "error" ? (
            <Text style={[styles.errorText, styles.updateError]}>{errorMessage}</Text>
          ) : null}

          {!isDownloading ? (
            <View style={styles.updateActions}>
              <Pressable
                accessibilityLabel="Actualizar aplicacion"
                accessibilityRole="button"
                onPress={applyUpdate}
                style={({ pressed }) => [
                  styles.button,
                  styles.updateButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.black} />
                <Text style={styles.buttonText}>Actualizar ahora</Text>
              </Pressable>

              {phase === "error" ? (
                <Pressable
                  accessibilityLabel="Continuar sin actualizar"
                  accessibilityRole="button"
                  onPress={() => setPhase("ready")}
                  style={({ pressed }) => [
                    styles.button,
                    styles.secondaryButton,
                    styles.updateButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Continuar por ahora
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return children;
}
