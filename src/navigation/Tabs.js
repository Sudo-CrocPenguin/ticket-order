import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import TicketsScreen from "../screens/TicketsScreen";
import AddTicketScreen from "../screens/AddTicketScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AdminScreen from "../screens/AdminScreen";
import StatsScreen from "../screens/StatsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useTickets } from "../hooks/useTickets";
import { colors } from "../styles/colors";

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const { activeCompanyId, user } = useTickets();
  const canManageCompany = user?.role === "admin";
  const hasActiveCompany = Boolean(activeCompanyId);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      {hasActiveCompany ? (
        <>
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              title: "Estadisticas",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="analytics-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="Tickets"
            component={TicketsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="Agregar"
            component={AddTicketScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="add-circle-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="Historial"
            component={HistoryScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="time-outline" size={size} color={color} />
              ),
            }}
          />

          {canManageCompany ? (
            <Tab.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="settings-outline" size={size} color={color} />
                ),
              }}
            />
          ) : null}
        </>
      ) : null}

        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" size={size} color={color} />
            ),
          }}
        />
    </Tab.Navigator>
  );
}
