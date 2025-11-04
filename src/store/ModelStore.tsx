import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  modelReducer,
  createInitialState,
  type ModelAction,
} from "./modelActions";
import type { ModelState } from "./modelActions";

interface ModelContextValue {
  state: ModelState;
  dispatch: React.Dispatch<ModelAction>;
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(modelReducer, createInitialState());

  return (
    <ModelContext.Provider value={{ state, dispatch }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
