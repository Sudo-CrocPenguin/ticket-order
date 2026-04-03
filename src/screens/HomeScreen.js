import { View, Text } from "react-native";
import { globalStyles } from "../styles/globalStyles";

export default function HomeScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Ticket Order</Text>
      <Text style={globalStyles.text}>
        Organiza tus tareas de forma inteligente 
      </Text>
    </View>
  );
}