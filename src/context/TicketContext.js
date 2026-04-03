import { createContext, useState } from "react";

export const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [counter, setCounter] = useState(1); // contador global

  const addTicket = (title, description) => {
    const newTicket = {
      id: counter, // nunca se repite
      title,
      description,
    };

    setTickets([...tickets, newTicket]);
    setCounter(counter + 1); // incrementa SIEMPRE
  };

  const completeTicket = (id) => {
    const ticket = tickets.find((t) => t.id === id);
    const newTickets = tickets.filter((t) => t.id !== id);

    setTickets(newTickets);
    setHistory([...history, ticket]);
  };

  return (
    <TicketContext.Provider
      value={{
        tickets,
        history,
        addTicket,
        completeTicket,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};