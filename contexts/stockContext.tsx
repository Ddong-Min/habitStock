import { StyleSheet, Text, View } from "react-native";
import React, { ReactNode, useState } from "react";
import { StockDataType } from "@/types";
import { useAuth } from "./authContext";

type StockContextType = {
  stockData: StockDataType | undefined;
};

const StockContext = React.createContext<StockContextType | undefined>(
  undefined
);

export const StockProvider = ({ children }: { children: ReactNode }) => {
  const [stockData, setStockData] = useState<StockDataType | undefined>(
    undefined
  );
  const { user } = useAuth();
  const loadStocks = async (startDate: string, endDate: string) => {
    //이미 불러온 정보를 안불러오게 효과적으로 할수잇을까

    await loadStocksFirebase(user?.uid!, { startDate, endDate }).then(
      (loadedStocks) => {
        setStockData(loadedStocks);
      }
    );
  };
  return (
    <StockContext.Provider value={{ stockData }}>
      {children}
    </StockContext.Provider>
  );
};
