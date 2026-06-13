import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginScreen from "../screens/LoginScreen";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import Tabs from "./Tabs";

export default function Root() {
  const { isReady, session, storageError } = useTickets();

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredScreen}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.emptyTitle}>Sincronizando</Text>
          <Text style={styles.emptyText}>
            Estamos preparando tu sesion y recuperando los tickets.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <LoginScreen initialError={storageError} />;
  }

  return <Tabs />;
}
