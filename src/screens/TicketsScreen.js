import { FlatList, Pressable, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import CompanySwitcher from "../components/CompanySwitcher";
import EmptyState from "../components/EmptyState";
import SearchBox from "../components/SearchBox";
import StatsSummary from "../components/StatsSummary";
import TicketCard from "../components/TicketCard";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";
import { searchTickets } from "../utils/ticketUtils";

export default function TicketsScreen() {
  const {
    applications,
    attachEvidence,
    changeTicketStatus,
    company,
    isReady,
    isSyncing,
    logout,
    refreshWorkspace,
    selectedApplicationId,
    setSelectedApplicationId,
    stats,
    storageError,
    tickets,
    user,
  } = useTickets();
  const [search, setSearch] = useState("");

  const filteredTickets = useMemo(() => {
    const byApplication = selectedApplicationId
      ? tickets.filter((ticket) => ticket.applicationId === selectedApplicationId)
      : tickets;

    return searchTickets(byApplication, search);
  }, [selectedApplicationId, tickets, search]);

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
              <View style={styles.headerRow}>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.header}>Tickets activos</Text>
                  <Text style={styles.subtitle}>
                    {company?.name || "Empresa"} · {user?.name || "Usuario"}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <CompanySwitcher />
                  <Pressable
                    accessibilityLabel="Sincronizar tickets"
                    accessibilityRole="button"
                    onPress={refreshWorkspace}
                    style={styles.iconActionButton}
                  >
                    <Ionicons
                      name={isSyncing ? "sync" : "refresh"}
                      size={20}
                      color={colors.text}
                    />
                  </Pressable>
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
              <Text style={styles.subtitle}>
                Reporta bugs con evidencias y mueve el trabajo entre pendiente, en
                progreso y completado.
              </Text>
            </View>

            {storageError ? (
              <View style={styles.storageNotice}>
                <Text style={styles.storageNoticeText}>{storageError}</Text>
              </View>
            ) : null}

            <StatsSummary stats={stats} />

            {applications.length ? (
              <View style={styles.segmentedRow}>
                {applications.map((application) => {
                  const selected = application.id === selectedApplicationId;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={application.id}
                      onPress={() => setSelectedApplicationId(application.id)}
                      style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          selected && styles.segmentButtonTextActive,
                        ]}
                      >
                        {application.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <SearchBox
              onChangeText={setSearch}
              placeholder="Buscar por titulo, descripcion, estado o ID"
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
          />
        )}
      />
    </SafeAreaView>
  );
}
