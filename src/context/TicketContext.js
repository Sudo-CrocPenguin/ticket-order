import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { loadTicketState, saveTicketState } from "../services/ticketStorage";
import {
  completeTicket as buildCompletedTicket,
  createTicket,
  getTicketStats,
  reopenTicket as buildReopenedTicket,
  validateTicketInput,
} from "../utils/ticketUtils";

export const TicketContext = createContext(null);

const initialState = {
  tickets: [],
  history: [],
  counter: 1,
  isReady: false,
  storageError: "",
};

const moveById = (items, id) => {
  const item = items.find((ticket) => ticket.id === id);
  const remaining = items.filter((ticket) => ticket.id !== id);

  return { item, remaining };
};

const ticketReducer = (state, action) => {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        ...state,
        ...action.payload,
        isReady: true,
        storageError: "",
      };

    case "LOAD_ERROR":
      return {
        ...state,
        isReady: true,
        storageError: action.payload,
      };

    case "SAVE_ERROR":
      return {
        ...state,
        storageError: action.payload,
      };

    case "ADD_TICKET":
      return {
        ...state,
        tickets: [...state.tickets, action.payload],
        counter: state.counter + 1,
      };

    case "COMPLETE_TICKET": {
      const { item, remaining } = moveById(state.tickets, action.payload);

      if (!item) return state;

      return {
        ...state,
        tickets: remaining,
        history: [buildCompletedTicket(item), ...state.history],
      };
    }

    case "REOPEN_TICKET": {
      const { item, remaining } = moveById(state.history, action.payload);

      if (!item) return state;

      return {
        ...state,
        tickets: [...state.tickets, buildReopenedTicket(item)],
        history: remaining,
      };
    }

    case "CLEAR_HISTORY":
      return {
        ...state,
        history: [],
      };

    default:
      return state;
  }
};

export const TicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ticketReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    const hydrateTickets = async () => {
      try {
        const persistedState = await loadTicketState();

        if (isMounted) {
          dispatch({ type: "LOAD_SUCCESS", payload: persistedState });
        }
      } catch (error) {
        if (isMounted) {
          dispatch({
            type: "LOAD_ERROR",
            payload: "No se pudieron cargar los tickets guardados.",
          });
        }
      }
    };

    hydrateTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isReady) return;

    const persistTickets = async () => {
      try {
        await saveTicketState(state);
      } catch (error) {
        dispatch({
          type: "SAVE_ERROR",
          payload: "No se pudieron guardar los cambios en este dispositivo.",
        });
      }
    };

    persistTickets();
  }, [state.tickets, state.history, state.counter, state.isReady]);

  const addTicket = useCallback(
    (title, description) => {
      const validation = validateTicketInput(title, description);

      if (!validation.ok) {
        return validation;
      }

      const ticket = createTicket({
        id: state.counter,
        title: validation.value.title,
        description: validation.value.description,
      });

      dispatch({ type: "ADD_TICKET", payload: ticket });

      return { ok: true, ticket };
    },
    [state.counter]
  );

  const completeTicket = useCallback((id) => {
    dispatch({ type: "COMPLETE_TICKET", payload: id });
  }, []);

  const reopenTicket = useCallback((id) => {
    dispatch({ type: "REOPEN_TICKET", payload: id });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" });
  }, []);

  const value = useMemo(
    () => ({
      tickets: state.tickets,
      history: state.history,
      isReady: state.isReady,
      storageError: state.storageError,
      stats: getTicketStats(state.tickets, state.history),
      addTicket,
      completeTicket,
      reopenTicket,
      clearHistory,
    }),
    [state, addTicket, completeTicket, reopenTicket, clearHistory]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};
