import { createContext, useState } from "react";

export const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [counter, setCounter] = useState(1);

  const [showHistory, setShowHistory] = useState(false); // control de vista

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
      value={{
        tickets,
        history,
        addTicket,
        completeTicket,
        showHistory,
        setShowHistory, // control desde UI
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};