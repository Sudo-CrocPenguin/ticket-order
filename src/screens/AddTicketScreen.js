import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { useState, useContext } from "react";
import { TicketContext } from "../context/TicketContext";
import { styles } from "../styles/styles";

export default function AddTicketScreen() {
  const { addTicket } = useContext(TicketContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.header}> Crear ticket</Text>

      <TextInput
        placeholder="Título"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Descripción"
        placeholderTextColor="#aaa"
        style={[styles.input, { height: 100 }]}
        multiline
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
        <Text style={styles.buttonText}>Crear ticket</Text>
      </TouchableOpacity>
    </View>
  );
}