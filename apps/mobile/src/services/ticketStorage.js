import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeTicketState } from "../utils/ticketUtils";

const STORAGE_KEY = "@ticket_order/state";
const LEGACY_STORAGE_KEY = "tickets_app";

export const loadTicketState = async () => {
  const storedData = await AsyncStorage.getItem(STORAGE_KEY);
  const legacyData = storedData ? null : await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  const rawData = storedData || legacyData;

  if (!rawData) {
    return normalizeTicketState();
  }

  return normalizeTicketState(JSON.parse(rawData));
};

export const saveTicketState = async (state) => {
  const payload = {
    tickets: state.tickets,
    history: state.history,
    counter: state.counter,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};
