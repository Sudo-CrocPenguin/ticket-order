import { View, Text, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { TicketContext } from "../context/TicketContext";
import { styles } from "../styles/styles";

export default function TicketsScreen() {
  const { tickets, completeTicket } = useContext(TicketContext);

  return (
    <View>
      <Text style={styles.header}> Tickets activos</Text>

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
    </View>
  );
}