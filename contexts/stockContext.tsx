import React, { ReactNode, useState } from "react";
import { StockDataType, StockDataByDateType } from "@/types";
import { useAuth } from "./authContext";
import { loadStockDataFirebase, changeStockDataFirebase } from "@/api/stockApi";
import { useCalendar } from "./calendarContext";
import { Task } from "@/types";
type StockContextType = {
  stockData: StockDataByDateType | undefined;
  loadStocks: () => Promise<void>;
  changeStockData: (
    task: Task
  ) => Promise<
    | { success: boolean; msg?: undefined }
    | { success: boolean; msg: string }
    | undefined
  >;
};

const StockContext = React.createContext<StockContextType | undefined>(
  undefined
);

export const StockProvider = ({ children }: { children: ReactNode }) => {
  const [stockData, setStockData] = useState<StockDataByDateType | undefined>(
    undefined
  );
  const { user, changeUserStock } = useAuth();
  const { selectedDate, isWeekView, today } = useCalendar();

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

    //이전 데이터에 새로 불러온 데이터까지 합참
    await loadStockDataFirebase(user, startDate, endDate).then(
      (loadedStocks) => {
        if (loadedStocks) {
          setStockData((prev) => ({
            ...prev,
            ...loadedStocks,
          }));
        }
      }
    );
    console.log(stockData);
  };

  const changeStockData = async (task: Task) => {
    if (!user?.uid || !stockData) return;

    const date = task.updatedDate || today; // task의 updatedDate가 있으면 그 날짜, 없으면 오늘 날짜
    const existingData = stockData[date];

    // 해당 날짜의 데이터가 없으면 새로 생성
    const updatedStockData: StockDataType = existingData;

    // task의 변화량을 추가
    if (task.completed) {
      updatedStockData.changePrice += task.priceChange;
      updatedStockData.changeRate += parseFloat(task.percentage);
      updatedStockData.close += task.priceChange;
      updatedStockData.high = Math.max(
        updatedStockData.high,
        updatedStockData.close
      );
    } else {
      updatedStockData.changePrice -= task.priceChange;
      updatedStockData.changeRate -= parseFloat(task.percentage);
      updatedStockData.close -= task.priceChange;
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
  return (
    <StockContext.Provider value={{ stockData, loadStocks, changeStockData }}>
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
