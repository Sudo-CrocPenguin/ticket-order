import { View, Text } from "react-native";
import { TicketProvider } from "./src/context/TicketContext";
import AddTicketScreen from "./src/screens/AddTicketScreen";
import TicketsScreen from "./src/screens/TicketsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import { styles } from "./src/styles/styles";

export default function App() {
  return (
    <TicketProvider>
      <View style={styles.container}>
        <Text style={{ color: "#fff", fontSize: 24, marginBottom: 10 }}>
           Ticket Order
        </Text>

        <AddTicketScreen />
        <TicketsScreen />
        <HistoryScreen />
      </View>
    </TicketProvider>
  );
}