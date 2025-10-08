import React, { ReactNode, useState } from "react";
import {
  StockDataType,
  StockDataByDateType,
  FriendStockType,
  UserType,
} from "@/types";
import { useAuth } from "./authContext";
import {
  loadStockDataFirebase,
  changeStockDataFirebase,
  loadAllStockDataFirebase,
  loadFriendStockDataFirebase,
} from "@/api/stockApi";
import { useCalendar } from "./calendarContext";
import { Task } from "@/types";
type StockContextType = {
  stockData: StockDataByDateType | undefined;
  selectedPeriod: "day" | "week" | "month";
  friendStockData: FriendStockType;
  loadStocks: () => Promise<void>;
  changeStockData: (
    task: Task
  ) => Promise<
    | { success: boolean; msg?: undefined }
    | { success: boolean; msg: string }
    | undefined
  >;
  loadAllStocks: () => Promise<void>;
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
  /*
   load the stock Data which have changePrice, changeRate, open, close, high, low, volume
    when the user change the calendar view or load the app
    if the data is already loaded, do not load again
    if the view is week view, load the data from the Sunday to Saturday of the selectedDate or today
    if the view is month view, load the data from the 1st to the last day of the month of the selectedDate
  */

  const loadStocks = async () => {
    if (!user?.uid) return;

    let startDate: string;
    let endDate: string;
    const selected = new Date(selectedDate);

    if (isWeekView) {
      // 주간 뷰: 선택된 날짜가 속한 주의 일요일~토요일
      const dayOfWeek = selected.getDay(); // 0(일) ~ 6(토)

      // calculate the start day of the week (Sunday)
      const sunday = new Date(selected); // ex Tue Aug 19 1975 23:15:30 GMT+0900 (한국 표준시)
      sunday.setDate(selected.getDate() - dayOfWeek); // getDate => 1~31, setDate is change the value of sunday to sunday value, ex Sun Aug 24 1975 23:15:30 GMT+0900 (한국 표준시)
      startDate = sunday.toISOString().split("T")[0]; // toISOString => "1975-08-19T14:15:30.000Z", split => ["1975-08-19", "14:15:30.000Z"], [0] => "1975-08-19"

      // calculate the last day of the week (Saturday or today)
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      // if last day of week is after today, set endDate to today
      if (saturday > new Date(today)) {
        endDate = new Date(today).toISOString().split("T")[0];
      } else {
        endDate = saturday.toISOString().split("T")[0];
      }
    } else {
      // 월간 뷰: 선택된 날짜가 속한 달의 1일~말일 또는 오늘
      const firstDay = new Date(selected.getFullYear(), selected.getMonth(), 1);
      const lastDayOfMonth = new Date(
        selected.getFullYear(),
        selected.getMonth() + 1,
        1
      );
      //만약 구하는 달의 마지막 날이 오늘 이후라면 오늘까지만 불러옴
      const lastDay =
        lastDayOfMonth > new Date(today) ? new Date(today) : lastDayOfMonth;

      startDate = firstDay.toISOString().split("T")[0];
      endDate = lastDay.toISOString().split("T")[0];
    }
    // 이미 불러온 데이터인지 확인
    // stockData가 존재하고, 필요한 날짜 범위가 모두 포함되어 있으면 스킵
    if (stockData) {
      const existingDates = Object.keys(stockData); // Object.keys => ['2023-10-01', '2023-10-02', ...]
      const start = new Date(startDate);
      const end = new Date(endDate);
      let allDatesExist = true;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (!existingDates.includes(dateStr)) {
          allDatesExist = false;
          break;
        }
      }

      if (allDatesExist) {
        return; // 이미 모든 데이터가 있으면 로드하지 않음
      }
    }

    // Firebase에서 데이터 불러오기
    await loadStockDataFirebase(user, startDate, endDate).then(
      (fetchedData) => {
        if (fetchedData) {
          setStockData((prev) => ({
            ...prev,
            ...fetchedData,
          }));
        }
      }
    );
  };

  const changeStockData = async (task: Task) => {
    if (!user?.uid || !stockData) return;

    const date = task.updatedDate || today; // task의 updatedDate가 있으면 그 날짜, 없으면 오늘 날짜
    const existingData = stockData[date];

    // 해당 날짜의 데이터가 없으면 새로 생성
    const updatedStockData: StockDataType = existingData;

    // task의 변화량을 추가
    // task's effect on stock
    if (task.completed) {
      updatedStockData.changePrice =
        Math.round((updatedStockData.changePrice + task.priceChange) * 10) / 10;

      updatedStockData.changeRate =
        Math.round(
          (updatedStockData.changeRate + parseFloat(task.percentage)) * 10
        ) / 10;

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
        Math.round(
          (updatedStockData.changeRate - parseFloat(task.percentage)) * 10
        ) / 10;

      updatedStockData.close =
        Math.round((updatedStockData.close - task.priceChange) * 10) / 10;

      updatedStockData.low = Math.min(
        updatedStockData.low,
        updatedStockData.close
      );
    }
    // Firebase에 저장
    const result = await changeStockDataFirebase(
      user.uid,
      updatedStockData,
      date
    );

    if (result.success) {
      // 로컬 state 업데이트
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

  const loadAllStocks = async () => {
    if (!user?.uid) return;

    /* 디버그용 */
    if (stockData && stockData["2025-09-01"]) return;

    const allStockData = await loadAllStockDataFirebase(user);
    setStockData(allStockData ?? undefined);
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
          allFriendStockData[fid] = {}; // ✅ 초기화
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
        allFriendStockData[followId] = {}; // ✅ 초기화
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
        loadStocks,
        changeStockData,
        loadAllStocks,
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
