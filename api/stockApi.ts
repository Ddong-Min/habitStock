import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import {
  StockDataType,
  StockDataByDateType,
  UserType,
  FriendStockType,
} from "@/types";

// 새로운 구조:
// users/{userId}/data/stocks (문서)
// 문서 내부: { "2025-01-15": { ...stockData }, "2025-01-16": { ...stockData } }

//각 날마다의 주식 데이터를 저장하는 함수
export const changeStockDataFirebase = async (
  userId: string,
  stockData: StockDataType,
  date: string
) => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "stocks");
    const docSnap = await getDoc(docRef);

    const currentData = docSnap.exists() ? docSnap.data() : {};

    // 해당 날짜의 데이터 업데이트
    currentData[date] = stockData;

    await setDoc(docRef, currentData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error changing user stock: ", error);
    return { success: false, msg: "Failed to change user stock." };
  }
};

export const loadFriendStockDataFirebase = async (
  userIds: string[]
): Promise<FriendStockType | null> => {
  try {
    if (!userIds || userIds.length === 0) {
      throw new Error("User IDs are undefined or empty");
    }
    const docRefs = userIds.map((userId) =>
      doc(firestore, "users", userId, "data", "stocks")
    );
    const docSnaps = await Promise.all(docRefs.map((docRef) => getDoc(docRef)));

    const allFriendStockData: FriendStockType = {};

    docSnaps.forEach((docSnap, index) => {
      if (docSnap.exists()) {
        const userId = userIds[index];
        allFriendStockData[userId] = docSnap.data() as StockDataByDateType;
      }
    });
    return allFriendStockData;
  } catch (error) {
    console.error("Error loading friend stock data: ", error);
    return null;
  }
};

// 🔥 NEW: 실시간 주식 데이터 구독 (특정 기간)
export const subscribeToStockData = (
  userId: string,
  startDate: string,
  endDate: string,
  userPrice: number,
  onUpdate: (stockData: StockDataByDateType) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stocks");

  return onSnapshot(docRef, async (docSnap) => {
    const stockDataByDate: StockDataByDateType = {};

    // Firebase에서 가져온 데이터 필터링
    if (docSnap.exists()) {
      const allData = docSnap.data();

      Object.keys(allData).forEach((date) => {
        // startDate와 endDate 사이의 데이터만 필터링
        if (date >= startDate && date <= endDate) {
          stockDataByDate[date] = allData[date] as StockDataType;
        }
      });
    }

    // startDate부터 endDate까지의 모든 날짜 생성
    const start = new Date(startDate);
    const end = new Date(endDate);
    const newDates: { [key: string]: StockDataType } = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      // 해당 날짜의 데이터가 없으면 기본값으로 생성
      if (!stockDataByDate[dateStr]) {
        const defaultData: StockDataType = {
          date: dateStr,
          changePrice: 0,
          changeRate: 0,
          open: userPrice,
          close: userPrice,
          high: userPrice,
          low: userPrice,
          volume: 0,
        };

        stockDataByDate[dateStr] = defaultData;
        newDates[dateStr] = defaultData;
      }
    }

    // 새로 생성된 날짜들을 한 번에 저장
    if (Object.keys(newDates).length > 0) {
      const currentData = docSnap.exists() ? docSnap.data() : {};
      await setDoc(
        docRef,
        { ...currentData, ...newDates },
        { merge: true }
      ).catch((error) =>
        console.error("Error creating default stock data: ", error)
      );
    }

    onUpdate(stockDataByDate);
  });
};

// 🔥 NEW: 전체 주식 데이터 실시간 구독
export const subscribeToAllStockData = (
  userId: string,
  registerDate: string,
  onUpdate: (stockData: StockDataByDateType) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stocks");

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      onUpdate({});
      return;
    }

    const allData = docSnap.data();
    const stockDataByDate: StockDataByDateType = {};

    // registerDate 이후의 데이터만 필터링
    Object.keys(allData).forEach((date) => {
      if (date >= registerDate) {
        stockDataByDate[date] = allData[date] as StockDataType;
      }
    });

    onUpdate(stockDataByDate);
  });
};

// 🔥 NEW: 친구 주식 데이터 실시간 구독
export const subscribeToFriendStockData = (
  userId: string,
  startDate: string,
  endDate: string,
  onUpdate: (stockData: StockDataByDateType) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stocks");

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      onUpdate({});
      return;
    }

    const allData = docSnap.data();
    const stockDataByDate: StockDataByDateType = {};

    // startDate와 endDate 사이의 데이터만 필터링
    Object.keys(allData).forEach((date) => {
      if (date >= startDate && date <= endDate) {
        stockDataByDate[date] = allData[date] as StockDataType;
      }
    });

    onUpdate(stockDataByDate);
  });
};

export type StockSummaryType = {
  recent7Days: {
    high: number;
    low: number;
    current: number;
    highDate: string;
    lowDate: string;
  };
  allTime: {
    high: number;
    low: number;
    current: number;
    highDate: string;
    lowDate: string;
  };
  maxVolume: {
    volume: number;
    date: string;
  };
  lastUpdated: string;
};

// Summary 데이터 계산 함수
export const calculateStockSummary = (
  stockDataByDate: StockDataByDateType,
  registerDate: string
): StockSummaryType => {
  const dates = Object.keys(stockDataByDate).sort();

  if (dates.length === 0) {
    const defaultValue = {
      high: 0,
      low: 0,
      current: 0,
      highDate: registerDate,
      lowDate: registerDate,
    };
    return {
      recent7Days: defaultValue,
      allTime: defaultValue,
      maxVolume: { volume: 0, date: registerDate },
      lastUpdated: new Date().toISOString(),
    };
  }

  // 최근 7일 데이터 필터링
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const recent7DaysDates = dates.filter((date) => date >= sevenDaysAgoStr);
  const recentData = recent7DaysDates.map((date) => stockDataByDate[date]);
  const allData = dates.map((date) => stockDataByDate[date]);

  // 최근 7일 계산
  const recent7Days = calculatePeriodStats(recentData, recent7DaysDates);

  // 전체 기간 계산
  const allTime = calculatePeriodStats(allData, dates);

  // 최대 거래량 계산
  const maxVolume = calculateMaxVolume(allData, dates);

  // 현재가 (가장 최근 날짜의 종가)
  const latestDate = dates[dates.length - 1];
  const currentPrice = stockDataByDate[latestDate].close;

  return {
    recent7Days: { ...recent7Days, current: currentPrice },
    allTime: { ...allTime, current: currentPrice },
    maxVolume,
    lastUpdated: new Date().toISOString(),
  };
};

// 기간별 통계 계산
const calculatePeriodStats = (
  data: StockDataType[],
  dates: string[]
): Omit<StockSummaryType["recent7Days"], "current"> => {
  if (data.length === 0) {
    return {
      high: 0,
      low: 0,
      highDate: "",
      lowDate: "",
    };
  }

  let highPrice = -Infinity;
  let lowPrice = Infinity;
  let highDate = "";
  let lowDate = "";

  data.forEach((stock, index) => {
    if (stock.high > highPrice) {
      highPrice = stock.high;
      highDate = dates[index];
    }
    if (stock.low < lowPrice) {
      lowPrice = stock.low;
      lowDate = dates[index];
    }
  });

  return {
    high: highPrice === -Infinity ? 0 : highPrice,
    low: lowPrice === Infinity ? 0 : lowPrice,
    highDate,
    lowDate,
  };
};

// 최대 거래량 계산
const calculateMaxVolume = (
  data: StockDataType[],
  dates: string[]
): StockSummaryType["maxVolume"] => {
  if (data.length === 0) {
    return { volume: 0, date: "" };
  }

  let maxVol = 0;
  let maxVolDate = "";

  data.forEach((stock, index) => {
    if (stock.volume > maxVol) {
      maxVol = stock.volume;
      maxVolDate = dates[index];
    }
  });

  return {
    volume: maxVol,
    date: maxVolDate,
  };
};

// Summary 데이터 저장
export const saveStockSummary = async (
  userId: string,
  summary: StockSummaryType
) => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "stockSummary");
    await setDoc(docRef, summary);
    return { success: true };
  } catch (error) {
    console.error("Error saving stock summary: ", error);
    return { success: false, msg: "Failed to save stock summary." };
  }
};

// Summary 데이터 로드
export const loadStockSummary = async (
  userId: string
): Promise<StockSummaryType | null> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "stockSummary");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as StockSummaryType;
    }
    return null;
  } catch (error) {
    console.error("Error loading stock summary: ", error);
    return null;
  }
};

// Summary 데이터 실시간 구독
export const subscribeToStockSummary = (
  userId: string,
  onUpdate: (summary: StockSummaryType | null) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stockSummary");

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as StockSummaryType);
    } else {
      onUpdate(null);
    }
  });
};

// 주식 데이터 변경 시 Summary 자동 업데이트
export const updateStockSummaryOnChange = async (
  userId: string,
  stockDataByDate: StockDataByDateType,
  registerDate: string
) => {
  try {
    const summary = calculateStockSummary(stockDataByDate, registerDate);
    await saveStockSummary(userId, summary);
    return { success: true };
  } catch (error) {
    console.error("Error updating stock summary: ", error);
    return { success: false, msg: "Failed to update stock summary." };
  }
};

// 🔥 NEW: 친구의 Summary 데이터 로드
export const loadFriendStockSummary = async (
  friendId: string
): Promise<StockSummaryType | null> => {
  try {
    const docRef = doc(firestore, "users", friendId, "data", "stockSummary");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as StockSummaryType;
    }
    return null;
  } catch (error) {
    console.error("Error loading friend stock summary: ", error);
    return null;
  }
};

// 🔥 NEW: 여러 친구의 Summary 데이터 한 번에 로드
export const loadFriendStockSummaries = async (
  friendIds: string[]
): Promise<{ [friendId: string]: StockSummaryType } | null> => {
  try {
    if (!friendIds || friendIds.length === 0) {
      return {};
    }

    const docRefs = friendIds.map((friendId) =>
      doc(firestore, "users", friendId, "data", "stockSummary")
    );

    const docSnaps = await Promise.all(docRefs.map((docRef) => getDoc(docRef)));

    const allFriendSummaries: { [friendId: string]: StockSummaryType } = {};

    docSnaps.forEach((docSnap, index) => {
      if (docSnap.exists()) {
        const friendId = friendIds[index];
        allFriendSummaries[friendId] = docSnap.data() as StockSummaryType;
      }
    });

    return allFriendSummaries;
  } catch (error) {
    console.error("Error loading friend stock summaries: ", error);
    return null;
  }
};

// 🔥 NEW: 친구의 Summary 데이터 실시간 구독
export const subscribeToFriendStockSummary = (
  friendId: string,
  onUpdate: (summary: StockSummaryType | null) => void
) => {
  const docRef = doc(firestore, "users", friendId, "data", "stockSummary");

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as StockSummaryType);
    } else {
      onUpdate(null);
    }
  });
};
