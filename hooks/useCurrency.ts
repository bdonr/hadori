"use client";

import { useState, useEffect } from "react";
import { detectCurrency, type SupportedCurrency } from "@/lib/currency";

export function useCurrency() {
  const [currency, setCurrency] = useState<SupportedCurrency>("eur");

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  return currency;
}
