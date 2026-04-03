import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [counter, setCounter] = useState(1);

  const STORAGE_KEY = "tickets_app";

  // CARGAR DATOS
  useEffect(() => {
    loadData();
  }, []);

  // GUARDAR AUTOMÁTICO
  useEffect(() => {
    saveData();
  }, [tickets, history, counter]);

  const saveData = async () => {
    const data = { tickets, history, counter };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const loadData = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      setTickets(parsed.tickets || []);
      setHistory(parsed.history || []);
      setCounter(parsed.counter || 1);
    }
  };

  const addTicket = (title, description) => {
    const newTicket = {
      id: counter,
      title,
      description,
    };

    setTickets((prev) => [...prev, newTicket]);
    setCounter((prev) => prev + 1);
  };

  const completeTicket = (id) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;

    setTickets((prev) => prev.filter((t) => t.id !== id));
    setHistory((prev) => [...prev, ticket]);
  };

  return (
    <TicketContext.Provider
      value={{ tickets, history, addTicket, completeTicket }}
    >
      {children}
    </TicketContext.Provider>
  );
};