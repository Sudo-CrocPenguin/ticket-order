import { NavigationContainer } from "@react-navigation/native";
import { TicketProvider } from "./src/context/TicketContext";
import Tabs from "./src/navigation/Tabs";

export default function App() {
  return (
    <TicketProvider>
      <NavigationContainer>
        <Tabs />
      </NavigationContainer>
    </TicketProvider>
  );
}