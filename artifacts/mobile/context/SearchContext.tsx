import React, { createContext, useContext, useState, useCallback } from "react";

interface SearchContextType {
  isOpen: boolean;
  openSearch: (prefill?: string) => void;
  closeSearch: () => void;
  prefill: string;
}

const SearchContext = createContext<SearchContextType>({
  isOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  prefill: "",
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  const openSearch = useCallback((text = "") => {
    setPrefill(text);
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setPrefill("");
  }, []);

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, prefill }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
