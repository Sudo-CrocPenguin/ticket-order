import { FlatList, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import SearchBox from "../components/SearchBox";
import TicketCard from "../components/TicketCard";
import { useTickets } from "../hooks/useTickets";
import { styles } from "../styles/styles";
import { searchTickets } from "../utils/ticketUtils";

export default function HistoryScreen() {
  const { attachEvidence, changeTicketStatus, history } = useTickets();
  const [search, setSearch] = useState("");

  const filteredHistory = useMemo(
    () => searchTickets(history, search),
    [history, search]
  );

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
                Consulta lo que ya se completo, revisa evidencias y devuelve un ticket
                al flujo si el problema reaparece.
              </Text>
            </View>

            <SearchBox
              onChangeText={setSearch}
              placeholder="Buscar tickets cerrados"
              value={search}
            />
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
          <TicketCard
            ticket={item}
            onAddEvidence={attachEvidence}
            onChangeStatus={changeTicketStatus}
            variant="completed"
          />
        )}
      />
    </SafeAreaView>
  );
}
