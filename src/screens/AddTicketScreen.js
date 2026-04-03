import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { useState, useContext } from "react";
import { TicketContext } from "../context/TicketContext";
import { styles } from "../styles/styles";

export default function AddTicketScreen() {
  const { addTicket } = useContext(TicketContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <View style={{ marginBottom: 20 }}>
      <TextInput
        placeholder="Nombre del ticket"
        placeholderTextColor="#aaa"
        style={{ color: "#fff", marginBottom: 10 }}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Descripción"
        placeholderTextColor="#aaa"
        style={{ color: "#fff", marginBottom: 10 }}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          addTicket(title, description);
          setTitle("");
          setDescription("");
        }}
      >
        <Text style={styles.buttonText}>Agregar Ticket</Text>
      </TouchableOpacity>
    </View>
  );
}