import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useContext, useState } from "react";
import { TicketContext } from "../context/TicketContext";
import { styles } from "../styles/styles";

export default function TicketsScreen() {
  const { tickets, completeTicket } = useContext(TicketContext);

  const [search, setSearch] = useState("");

  //  FILTRO DE BÚSQUEDA
  const filteredTickets = tickets.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}> Tickets activos</Text>

      {/* 🔍 BUSCADOR */}
      <TextInput
        placeholder="🔍 Buscar ticket..."
        placeholderTextColor="#aaa"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
      />

      {/* SCROLL */}
      <ScrollView>
        {filteredTickets.length === 0 ? (
          <Text style={styles.text}>No hay tickets</Text>
        ) : (
          filteredTickets.map((ticket) => (
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
          ))
        )}
      </ScrollView>
    </View>
  );
}