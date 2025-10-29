import React, { ReactNode, useState, useEffect, useRef } from "react";
import {
  StockDataType,
  StockDataByDateType,
  FriendStockType,
  UserType,
} from "@/types";
import { useAuth } from "./authContext";
import {
  changeStockDataFirebase,
  //loadFriendStockDataFirebase,
  subscribeToStockData,
  subscribeToStockSummary,
  updateStockSummaryOnChange,
  subscribeToAllFriendStockData,
  subscribeToMultipleFriendStockSummaries,
} from "@/api/stockApi";
import { StockSummaryType } from "@/types";
import { useCalendar } from "./calendarContext";
import { Task } from "@/types";
import { customLogEvent } from "@/events/appEvent";
import { useFollow } from "./followContext";

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
  changeStockAfterNews: (
    priceIncrease: number,
    percentageIncrease: number
  ) => Promise<any>;
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
  const { followingIds } = useFollow();
  const isInitialSummaryLoad = useRef(true);

  // 🔥 실시간 구독: 주식 데이터
  useEffect(() => {
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
      }
    );

    return () => unsubscribe();
  }, [user?.uid, today, user?.price, user?.registerDate]);

  // 🔥 실시간 구독: Summary 데이터
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToStockSummary(user.uid, (summary) => {
      setStockSummary(summary);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 🔥 stockData 변경 시 Summary 자동 업데이트
  useEffect(() => {
    if (!user?.uid || !user?.registerDate || !stockData) return;

    if (isInitialSummaryLoad.current) {
      isInitialSummaryLoad.current = false;
      return;
    }

    console.log("🔥 Stock data changed, updating summary...");

    if (Object.keys(stockData).length > 0) {
      updateStockSummaryOnChange(user.uid, stockData, user.registerDate);
    }
  }, [stockData]); // 🔥 stockData 변경 시에만 실행
  // 🔥 NEW: 친구 주식 데이터 실시간 구독
  useEffect(() => {
    if (!followingIds || followingIds.size === 0) {
      setFriendStockData({});
      return;
    }

    const unsubscribe = subscribeToAllFriendStockData(
      Array.from(followingIds),
      (updatedFriendStockData) => {
        setFriendStockData(updatedFriendStockData);
      },
      (error) => {
        console.error("친구 주식 데이터 구독 실패:", error);
      }
    );

    return () => unsubscribe();
  }, [followingIds]);

  // 🔥 NEW: 친구 Summary 실시간 구독
  useEffect(() => {
    if (!followingIds || followingIds.size === 0) {
      setFriendStockSummaries({});
      return;
    }

    const unsubscribe = subscribeToMultipleFriendStockSummaries(
      Array.from(followingIds),
      (updatedSummaries) => {
        setFriendStockSummaries(updatedSummaries);
      },
      (error) => {
        console.error("친구 Summary 구독 실패:", error);
      }
    );

    return () => unsubscribe();
  }, [followingIds]);

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
      changeUserStock(updatedStockData.close);
    } else {
      console.error("Failed to update stock data:", result.msg);
    }

    return result;
  };

  const changeSelectedPeriod = (period: "day" | "week" | "month") => {
    customLogEvent({
      eventName: "change_stock_selected_period",
      payload: { period },
    });
    setSelectedPeriod(period);
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
      changeUserStock(updatedStockData.close);
    } else {
      console.error("Failed to update stock data:", result.msg);
    }

    return result;
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
        changeStockAfterNews,
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
