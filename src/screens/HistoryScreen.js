import { View, Text } from "react-native";
import { useContext } from "react";
import { TicketContext } from "../context/TicketContext";
import { styles } from "../styles/styles";

export default function HistoryScreen() {
  const { history } = useContext(TicketContext);

  return (
    <View>
      <Text style={styles.header}> Historial</Text>

      {history.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          <Text style={styles.title}>
            #{ticket.id} — {ticket.title}
          </Text>

          <Text style={styles.text}>{ticket.description}</Text>
        </View>
      ))}
    </View>
  );
}