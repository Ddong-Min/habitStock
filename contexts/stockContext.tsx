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
  subscribeToStockSummary,
  updateStockSummaryOnChange,
  loadFriendStockSummary as loadFriendStockSummaryApi,
  loadFriendStockSummaries as loadFriendStockSummariesApi,
} from "@/api/stockApi";
import { StockSummaryType } from "@/types";
import { useCalendar } from "./calendarContext";
import { Task } from "@/types";

type StockContextType = {
  stockData: StockDataByDateType | undefined;
  stockSummary: StockSummaryType | null;
  selectedPeriod: "day" | "week" | "month";
  friendStockData: FriendStockType;
  friendStockSummaries: { [friendId: string]: StockSummaryType };
  changeStockData: (
    task: Task
  ) => Promise<
    | { success: boolean; msg?: undefined }
    | { success: boolean; msg: string }
    | undefined
  >;
  changeSelectedPeriod: (period: "day" | "week" | "month") => void;
  stockTabType: "stocks" | "news";
  changeStockTabType: (type: "stocks" | "news") => void;
  loadAllFriendStocksData: (followIds: string[]) => Promise<void>;
  changeStockAfterNews: (
    priceIncrease: number,
    percentageIncrease: number
  ) => Promise<any>;
  loadFriendStockSummary: (
    friendId: string
  ) => Promise<StockSummaryType | null>;
  loadAllFriendStockSummaries: (friendIds: string[]) => Promise<void>;
};

const StockContext = React.createContext<StockContextType | undefined>(
  undefined
);

export const StockProvider = ({ children }: { children: ReactNode }) => {
  const [stockData, setStockData] = useState<StockDataByDateType | undefined>(
    undefined
  );
  const [stockSummary, setStockSummary] = useState<StockSummaryType | null>(
    null
  );
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("day");
  const [friendStockData, setFriendStockData] = useState<FriendStockType>({});
  const [friendStockSummaries, setFriendStockSummaries] = useState<{
    [friendId: string]: StockSummaryType;
  }>({});
  const { user, changeUserStock } = useAuth();
  const { selectedDate, isWeekView, today } = useCalendar();
  const [stockTabType, setStockTabType] = useState<"stocks" | "news">("stocks");

  // 🔥 실시간 구독: 주식 데이터
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

  // 🔥 NEW: 실시간 구독: Summary 데이터
  useEffect(() => {
    console.log("Subscribing to stock summary updates...");
    if (!user?.uid) return;

    const unsubscribe = subscribeToStockSummary(user.uid, (summary) => {
      setStockSummary(summary);
      console.log("Stock summary updated:", summary);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 🔥 NEW: stockData 변경 시 Summary 자동 업데이트
  useEffect(() => {
    if (!user?.uid || !user?.registerDate || !stockData) return;

    // stockData가 비어있지 않을 때만 업데이트
    if (Object.keys(stockData).length > 0) {
      updateStockSummaryOnChange(user.uid, stockData, user.registerDate);
    }
  }, [stockData, user?.uid, user?.registerDate]);

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

  const loadAllFriendStocksData = async (followIds: string[]) => {
    if (!user?.uid) return;
    if (followIds.length === 0) {
      setFriendStockData({});
      return;
    }

    const allFriendStockData = await loadFriendStockDataFirebase(followIds);
    if (!allFriendStockData) return;
    setFriendStockData(allFriendStockData);
    console.log("Loaded friend stock data:", allFriendStockData);
  };

  const changeStockTabType = (type: "stocks" | "news") => {
    setStockTabType(type);
  };

  const changeStockAfterNews = async (
    priceIncrease: number,
    percentageIncrease: number
  ) => {
    if (!user?.uid || !stockData) return;

    const date = today;
    const existingData = stockData[date];

    const updatedStockData: StockDataType = { ...existingData };

    // 뉴스로 인한 증가분 반영
    updatedStockData.changePrice =
      Math.round((updatedStockData.changePrice + priceIncrease) * 10) / 10;

    updatedStockData.changeRate =
      Math.round((updatedStockData.changeRate + percentageIncrease) * 10) / 10;

    updatedStockData.close =
      Math.round((updatedStockData.close + priceIncrease) * 10) / 10;

    updatedStockData.high = Math.max(
      updatedStockData.high,
      updatedStockData.close
    );

    // Firebase에 저장
    const result = await changeStockDataFirebase(
      user.uid,
      updatedStockData,
      date
    );

    if (result.success) {
      // Optimistic UI update
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

  // 🔥 NEW: 단일 친구의 Summary 로드
  const loadFriendStockSummary = async (friendId: string) => {
    const summary = await loadFriendStockSummaryApi(friendId);
    if (summary) {
      setFriendStockSummaries((prev) => ({
        ...prev,
        [friendId]: summary,
      }));
    }
    return summary;
  };

  // 🔥 NEW: 여러 친구의 Summary 한 번에 로드
  const loadAllFriendStockSummaries = async (friendIds: string[]) => {
    if (friendIds.length === 0) {
      setFriendStockSummaries({});
      return;
    }

    const summaries = await loadFriendStockSummariesApi(friendIds);
    if (summaries) {
      setFriendStockSummaries(summaries);
      console.log("Loaded friend stock summaries:", summaries);
    }
  };

  return (
    <StockContext.Provider
      value={{
        stockData,
        stockSummary,
        selectedPeriod,
        friendStockData,
        friendStockSummaries,
        changeStockData,
        changeSelectedPeriod,
        stockTabType,
        changeStockTabType,
        loadAllFriendStocksData,
        changeStockAfterNews,
        loadFriendStockSummary,
        loadAllFriendStockSummaries,
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
