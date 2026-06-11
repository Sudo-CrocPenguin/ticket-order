import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import SearchBox from "../components/SearchBox";
import TicketCard from "../components/TicketCard";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import { searchTickets } from "../utils/ticketUtils";

export default function HistoryScreen() {
  const { history, reopenTicket, clearHistory } = useTickets();
  const [search, setSearch] = useState("");

  const filteredHistory = useMemo(
    () => searchTickets(history, search),
    [history, search]
  );

  const confirmClearHistory = () => {
    Alert.alert(
      "Limpiar historial",
      "Esta accion elimina todos los tickets cerrados del historial.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpiar", style: "destructive", onPress: clearHistory },
      ]
    );
  };

  const emptyState = search
    ? {
        icon: "search-outline",
        title: "Sin resultados",
        message: "No hay tickets cerrados que coincidan con tu busqueda.",
      }
    : {
        icon: "archive-outline",
        title: "Historial limpio",
        message: "Los tickets completados apareceran aqui con su fecha de cierre.",
      };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredHistory}
        keyExtractor={(ticket) => String(ticket.id)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.header}>Historial</Text>
              <Text style={styles.subtitle}>
                Consulta lo que ya cerraste y reabre cualquier ticket si vuelve a estar pendiente.
              </Text>
            </View>

            <SearchBox
              onChangeText={setSearch}
              placeholder="Buscar tickets cerrados"
              value={search}
            />

            {history.length ? (
              <Pressable
                accessibilityLabel="Limpiar historial de tickets cerrados"
                accessibilityRole="button"
                onPress={confirmClearHistory}
                style={({ pressed }) => [
                  styles.button,
                  styles.dangerButton,
                  { marginBottom: 16 },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.black} />
                <Text style={styles.buttonText}>Limpiar historial</Text>
              </Pressable>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon={emptyState.icon}
            message={emptyState.message}
            title={emptyState.title}
          />
        }
        renderItem={({ item }) => (
          <TicketCard ticket={item} onReopen={reopenTicket} variant="completed" />
        )}
      />
    </SafeAreaView>
  );
}
