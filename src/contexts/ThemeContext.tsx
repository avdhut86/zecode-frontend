"use client";

import { createContext, useContext, ReactNode } from "react";

// Unified theme - black header/footer with red accents
interface ThemeContextType {
  colors: {
    header: {
      background: string;
      hover: string;
    };
    footer: {
      background: string;
      hover: string;
    };
    accent: {
      primary: string;
      hover: string;
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Fixed unified color scheme - black backgrounds with red accents
  const colors = {
    header: {
      background: "#000000",
      hover: "#1a1a1a",
    },
    footer: {
      background: "#000000",
      hover: "#1a1a1a",
    },
    accent: {
      primary: "#C83232",  // brand-red
      hover: "#a02828",    // darker red for hover
    }
  };

  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
