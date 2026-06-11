import { FlatList, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import SearchBox from "../components/SearchBox";
import StatsSummary from "../components/StatsSummary";
import TicketCard from "../components/TicketCard";
import { useTickets } from "../hooks/useTickets";
import { styles } from "../styles/styles";
import { searchTickets } from "../utils/ticketUtils";

export default function TicketsScreen() {
  const { tickets, completeTicket, isReady, stats, storageError } = useTickets();
  const [search, setSearch] = useState("");

  const filteredTickets = useMemo(
    () => searchTickets(tickets, search),
    [tickets, search]
  );

  const emptyState = search
    ? {
        icon: "search-outline",
        title: "Sin resultados",
        message: "No hay tickets activos que coincidan con tu busqueda.",
      }
    : {
        icon: isReady ? "file-tray-outline" : "sync-outline",
        title: isReady ? "No hay tickets activos" : "Cargando tickets",
        message: isReady
          ? "Crea un ticket para empezar a ordenar el trabajo pendiente."
          : "Estamos recuperando los datos guardados en este dispositivo.",
      };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={isReady ? filteredTickets : []}
        keyExtractor={(ticket) => String(ticket.id)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.header}>Tickets activos</Text>
              <Text style={styles.subtitle}>
                Mantene visible solo lo que necesita accion y cerralo cuando este listo.
              </Text>
            </View>

            {storageError ? (
              <View style={styles.storageNotice}>
                <Text style={styles.storageNoticeText}>{storageError}</Text>
              </View>
            ) : null}

            <StatsSummary stats={stats} />
            <SearchBox
              onChangeText={setSearch}
              placeholder="Buscar por titulo, descripcion o ID"
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
          <TicketCard ticket={item} onComplete={completeTicket} />
        )}
      />
    </SafeAreaView>
  );
}
