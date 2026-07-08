import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ConnectivityGate from "./src/components/ConnectivityGate";
import UpdateGate from "./src/components/UpdateGate";
import { TicketProvider } from "./src/context/TicketContext";
import Root from "./src/navigation/Root";
import { colors } from "./src/styles/colors";

const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "800",
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ConnectivityGate>
        <UpdateGate>
          <TicketProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style="light" />
              <Root />
            </NavigationContainer>
          </TicketProvider>
        </UpdateGate>
      </ConnectivityGate>
    </SafeAreaProvider>
  );
}
