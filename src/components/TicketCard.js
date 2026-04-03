import { Animated, Text, TouchableOpacity } from "react-native";
import { useRef } from "react";
import { styles } from "../styles/styles";

export default function TicketCard({ ticket, onComplete }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onComplete(ticket.id);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Text style={styles.title}>
        #{ticket.id} — {ticket.title}
      </Text>

      <Text style={styles.text}>{ticket.description}</Text>

      <TouchableOpacity style={styles.button} onPress={animatePress}>
        <Text style={styles.buttonText}>✔ Completar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}