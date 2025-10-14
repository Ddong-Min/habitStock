import React, { ReactNode, useState, useEffect } from "react";
import {
  StockDataType,
  StockDataByDateType,
  FriendStockType,
  UserType,
} from "@/types";
import { useAuth } from "./authContext";
import {
  changeStockDataFirebase,
  loadFriendStockDataFirebase,
  subscribeToStockData,
  subscribeToAllStockData,
  subscribeToFriendStockData,
} from "@/api/stockApi";
import { useCalendar } from "./calendarContext";
import { Task } from "@/types";

type StockContextType = {
  stockData: StockDataByDateType | undefined;
  selectedPeriod: "day" | "week" | "month";
  friendStockData: FriendStockType;
  changeStockData: (
    task: Task
  ) => Promise<
    | { success: boolean; msg?: undefined }
    | { success: boolean; msg: string }
    | undefined
  >;
  changeSelectedPeriod: (period: "day" | "week" | "month") => void;
  loadTodayFriendStocks: (followIds: string[]) => Promise<void>;
  stockTabType: "stocks" | "news";
  changeStockTabType: (type: "stocks" | "news") => void;
  loadAllFriendStocksData: (
    followId: string,
    startDate: string
  ) => Promise<void>;
};

const StockContext = React.createContext<StockContextType | undefined>(
  undefined
);

export const StockProvider = ({ children }: { children: ReactNode }) => {
  const [stockData, setStockData] = useState<StockDataByDateType | undefined>(
    undefined
  );
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("day");
  const [friendStockData, setFriendStockData] = useState<FriendStockType>({});
  const { user, changeUserStock } = useAuth();
  const { selectedDate, isWeekView, today } = useCalendar();
  const [stockTabType, setStockTabType] = useState<"stocks" | "news">("stocks");

  // 🔥 NEW: 실시간 구독 추가 - 선택된 날짜 범위의 주식 데이터 자동 업데이트
  useEffect(() => {
    console.log("Subscribing to stock data updates...");
    if (!user?.uid) return;
    if (!user?.registerDate) return;
    const startDate = user.registerDate;
    const endDate = today;
    const unsubscribe = subscribeToStockData(
      user.uid,
      startDate,
      endDate,
      user.price ?? 100,
      (updatedStockData) => {
        setStockData((prev) => ({
          ...prev,
          ...updatedStockData,
        }));
        console.log("stockData", stockData);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, today, user?.price, user?.registerDate]);

  const changeStockData = async (task: Task) => {
    if (!user?.uid || !stockData) return;

    const date = today;
    const existingData = stockData[date];

    const updatedStockData: StockDataType = { ...existingData };

    // task's effect on stock
    if (task.completed) {
      updatedStockData.changePrice =
        Math.round((updatedStockData.changePrice + task.priceChange) * 10) / 10;

      updatedStockData.changeRate =
        Math.round((updatedStockData.changeRate + task.percentage) * 10) / 10;

      updatedStockData.close =
        Math.round((updatedStockData.close + task.priceChange) * 10) / 10;

      updatedStockData.high = Math.max(
        updatedStockData.high,
        updatedStockData.close
      );
    } else {
      updatedStockData.changePrice =
        Math.round((updatedStockData.changePrice - task.priceChange) * 10) / 10;

      updatedStockData.changeRate =
        Math.round((updatedStockData.changeRate - task.percentage) * 10) / 10;

      updatedStockData.close =
        Math.round((updatedStockData.close - task.priceChange) * 10) / 10;

      updatedStockData.low = Math.min(
        updatedStockData.low,
        updatedStockData.close
      );
    }

    // Firebase에 저장 - onSnapshot이 자동으로 UI 업데이트
    const result = await changeStockDataFirebase(
      user.uid,
      updatedStockData,
      date
    );

    if (result.success) {
      // Optimistic UI update (즉각 반응을 위해)
      setStockData((prev) => ({
        ...prev,
        [date]: updatedStockData,
      }));
      changeUserStock(updatedStockData.close);
    } else {
      console.error("Failed to update stock data:", result.msg);
    }

    return result;
  };

  const changeSelectedPeriod = (period: "day" | "week" | "month") => {
    setSelectedPeriod(period);
  };

  const loadTodayFriendStocks = async (followIds: string[]) => {
    if (!user?.uid) return;
    if (followIds.length === 0) {
      setFriendStockData({});
      return;
    }
    const startDate = today;
    const endDate = today;

    const allFriendStockData: FriendStockType = {};
    for (const fid of followIds) {
      const tempFriendStockData = await loadFriendStockDataFirebase(
        fid,
        startDate,
        endDate
      );
      if (tempFriendStockData && tempFriendStockData[today]) {
        if (!allFriendStockData[fid]) {
          allFriendStockData[fid] = {};
        }
        allFriendStockData[fid][today] = tempFriendStockData[today];
      }
    }
    setFriendStockData(allFriendStockData);
  };

  const loadAllFriendStocksData = async (
    followId: string,
    startDate: string
  ) => {
    if (!user?.uid) return;
    if (followId.length === 0) {
      setFriendStockData({});
      return;
    }
    const endDate = today;

    const allFriendStockData: FriendStockType = {};
    const tempFriendStockData = await loadFriendStockDataFirebase(
      followId,
      startDate,
      endDate
    );
    if (tempFriendStockData) {
      if (!allFriendStockData[followId]) {
        allFriendStockData[followId] = {};
      }
      Object.keys(tempFriendStockData).forEach((date) => {
        allFriendStockData[followId][date] = tempFriendStockData[date];
      });
    }
    setFriendStockData(allFriendStockData);
    console.log("Loaded friend stock data:", allFriendStockData);
  };

  const changeStockTabType = (type: "stocks" | "news") => {
    setStockTabType(type);
  };

  return (
    <StockContext.Provider
      value={{
        stockData,
        selectedPeriod,
        friendStockData,
        changeStockData,
        changeSelectedPeriod,
        loadTodayFriendStocks,
        stockTabType,
        changeStockTabType,
        loadAllFriendStocksData,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = React.useContext(StockContext);
  if (context === undefined) {
    throw new Error("useStock must be used within a StockProvider");
  }
  return context;
};
