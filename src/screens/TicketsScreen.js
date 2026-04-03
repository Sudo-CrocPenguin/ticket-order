import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useContext } from "react";
import { TicketContext } from "../context/TicketContext";
import { styles } from "../styles/styles";

export default function TicketsScreen() {
  const { tickets, completeTicket, showHistory, setShowHistory } =
    useContext(TicketContext);

  return (
    <View style={styles.container}>
      <Text style={styles.header}> Tickets activos</Text>

      {/* BOTÓN PARA HISTORIAL */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#7f5af0" }]}
        onPress={() => setShowHistory(!showHistory)}
      >
        <Text style={styles.buttonText}>
          {showHistory ? "Ocultar historial" : "Ver historial"}
        </Text>
      </TouchableOpacity>

      {/* SCROLL */}
      <ScrollView>
        {tickets.map((ticket) => (
          <View key={ticket.id} style={styles.card}>
            <Text style={styles.title}>
              #{ticket.id} — {ticket.title}
            </Text>

            <Text style={styles.text}>{ticket.description}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => completeTicket(ticket.id)}
            >
              <Text style={styles.buttonText}>✔ Completar</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* HISTORIAL SOLO SI SE ACTIVA */}
        {showHistory && (
          <>
            <Text style={[styles.header, { marginTop: 20 }]}>
              🧾 Historial
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}