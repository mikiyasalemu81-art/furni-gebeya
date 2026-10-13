"use client";

import * as React from "react";
import { Listing } from "@/lib/listing-types";

interface CompareContextType {
  compareList: Listing[];
  addToCompare: (listing: Listing) => void;
  removeFromCompare: (listingId: string) => void;
  isInCompare: (listingId: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = React.createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = React.useState<Listing[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("furni_compare_items");
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    const handler = (e: any) => {
      const listing = e.detail as Listing;
      if (!listing) return;
      setCompareList((prev) => {
        if (prev.some((item) => item.id === listing.id)) {
          const next = prev.filter((item) => item.id !== listing.id);
          saveToStorage(next);
          return next;
        }
        if (prev.length >= 3) {
          alert("You can compare up to 3 furniture pieces simultaneously.");
          return prev;
        }
        const next = [...prev, listing];
        saveToStorage(next);
        return next;
      });
    };

    window.addEventListener("toggle-compare", handler);
    return () => window.removeEventListener("toggle-compare", handler);
  }, []);

  const saveToStorage = (items: Listing[]) => {
    try {
      localStorage.setItem("furni_compare_items", JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const addToCompare = (listing: Listing) => {
    if (compareList.some((item) => item.id === listing.id)) return;
    if (compareList.length >= 3) {
      alert("You can compare up to 3 furniture pieces simultaneously.");
      return;
    }
    const updated = [...compareList, listing];
    setCompareList(updated);
    saveToStorage(updated);
  };

  const removeFromCompare = (listingId: string) => {
    const updated = compareList.filter((item) => item.id !== listingId);
    setCompareList(updated);
    saveToStorage(updated);
  };

  const isInCompare = (listingId: string) => {
    return compareList.some((item) => item.id === listingId);
  };

  const clearCompare = () => {
    setCompareList([]);
    saveToStorage([]);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = React.useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
