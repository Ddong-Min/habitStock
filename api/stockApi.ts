import { firestore } from "@/config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "@react-native-firebase/firestore";

import {
  StockDataType,
  StockDataByDateType,
  FriendStockType,
  StockSummaryType,
} from "@/types";

// ✅ Firestore Modular API 사용

// 날짜별 주식 데이터 저장
export const changeStockDataFirebase = async (
  userId: string,
  stockData: StockDataType,
  date: string
) => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "stocks");
    const docSnap = await getDoc(docRef);

    const currentData = docSnap.exists() ? docSnap.data()! : {};
    currentData[date] = stockData;

    await setDoc(docRef, currentData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error changing user stock: ", error);
    return { success: false, msg: "Failed to change user stock." };
  }
};

// 친구 주식 데이터 로드
export const loadFriendStockDataFirebase = async (
  userIds: string[]
): Promise<FriendStockType | null> => {
  try {
    if (!userIds || userIds.length === 0) return {};

    const promises = userIds.map((id) => {
      const docRef = doc(firestore, "users", id, "data", "stocks");
      return getDoc(docRef);
    });

    const docSnaps = await Promise.all(promises);

    const allFriendStockData: FriendStockType = {};

    docSnaps.forEach((docSnap, idx) => {
      if (docSnap.exists()) {
        allFriendStockData[userIds[idx]] =
          docSnap.data() as StockDataByDateType;
      }
    });

    return allFriendStockData;
  } catch (error) {
    console.error("Error loading friend stock data: ", error);
    return null;
  }
};

// 실시간 주식 데이터 구독 (특정 기간)
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
    const allData = docSnap.exists() ? docSnap.data()! : {};

    // 기존 데이터 필터링
    Object.keys(allData).forEach((date) => {
      if (date >= startDate && date <= endDate) {
        stockDataByDate[date] = allData[date] as StockDataType;
      }
    });

    // startDate~endDate 사이에 없는 날짜 생성
    const start = new Date(startDate);
    const end = new Date(endDate);
    const newDates: { [key: string]: StockDataType } = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
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

    if (Object.keys(newDates).length > 0) {
      await setDoc(docRef, { ...allData, ...newDates }, { merge: true }).catch(
        console.error
      );
    }

    onUpdate(stockDataByDate);
  });
};

// 전체 주식 데이터 실시간 구독
export const subscribeToAllStockData = (
  userId: string,
  registerDate: string,
  onUpdate: (stockData: StockDataByDateType) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stocks");

  return onSnapshot(docRef, (docSnap) => {
    const allData = docSnap.exists() ? docSnap.data()! : {};
    const stockDataByDate: StockDataByDateType = {};

    Object.keys(allData).forEach((date) => {
      if (date >= registerDate)
        stockDataByDate[date] = allData[date] as StockDataType;
    });

    onUpdate(stockDataByDate);
  });
};

// 친구 주식 데이터 실시간 구독
export const subscribeToFriendStockData = (
  userId: string,
  startDate: string,
  endDate: string,
  onUpdate: (stockData: StockDataByDateType) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stocks");

  return onSnapshot(docRef, (docSnap) => {
    const allData = docSnap.exists() ? docSnap.data()! : {};
    const stockDataByDate: StockDataByDateType = {};

    Object.keys(allData).forEach((date) => {
      if (date >= startDate && date <= endDate)
        stockDataByDate[date] = allData[date] as StockDataType;
    });

    onUpdate(stockDataByDate);
  });
};

// ==================== Stock Summary ====================

// 기간별 통계 계산
const calculatePeriodStats = (data: StockDataType[], dates: string[]) => {
  if (data.length === 0) return { high: 0, low: 0, highDate: "", lowDate: "" };

  let highPrice = -Infinity,
    lowPrice = Infinity;
  let highDate = "",
    lowDate = "";

  data.forEach((stock, i) => {
    if (stock.high > highPrice) {
      highPrice = stock.high;
      highDate = dates[i];
    }
    if (stock.low < lowPrice) {
      lowPrice = stock.low;
      lowDate = dates[i];
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
const calculateMaxVolume = (data: StockDataType[], dates: string[]) => {
  if (data.length === 0) return { volume: 0, date: "" };
  let maxVol = 0,
    maxVolDate = "";

  data.forEach((stock, i) => {
    if (stock.volume > maxVol) {
      maxVol = stock.volume;
      maxVolDate = dates[i];
    }
  });

  return { volume: maxVol, date: maxVolDate };
};

// StockSummary 계산
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

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const recentDates = dates.filter((d) => d >= sevenDaysAgoStr);
  const recentData = recentDates.map((d) => stockDataByDate[d]);
  const allData = dates.map((d) => stockDataByDate[d]);

  const recent7Days = calculatePeriodStats(recentData, recentDates);
  const allTime = calculatePeriodStats(allData, dates);
  const maxVolume = calculateMaxVolume(allData, dates);
  const currentPrice = stockDataByDate[dates[dates.length - 1]].close;

  return {
    recent7Days: { ...recent7Days, current: currentPrice },
    allTime: { ...allTime, current: currentPrice },
    maxVolume,
    lastUpdated: new Date().toISOString(),
  };
};

// Summary 저장 / 로드 / 구독
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

export const loadStockSummary = async (
  userId: string
): Promise<StockSummaryType | null> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "stockSummary");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data()! as StockSummaryType) : null;
  } catch (error) {
    console.error("Error loading stock summary: ", error);
    return null;
  }
};

export const subscribeToStockSummary = (
  userId: string,
  onUpdate: (summary: StockSummaryType | null) => void
) => {
  const docRef = doc(firestore, "users", userId, "data", "stockSummary");
  return onSnapshot(docRef, (docSnap) =>
    onUpdate(docSnap.exists() ? (docSnap.data()! as StockSummaryType) : null)
  );
};

// 친구 Summary
export const loadFriendStockSummary = async (friendId: string) => {
  try {
    const docRef = doc(firestore, "users", friendId, "data", "stockSummary");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data()! as StockSummaryType) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const loadFriendStockSummaries = async (friendIds: string[]) => {
  if (!friendIds || friendIds.length === 0) return {};
  try {
    const promises = friendIds.map((id) => {
      const docRef = doc(firestore, "users", id, "data", "stockSummary");
      return getDoc(docRef);
    });
    const docSnaps = await Promise.all(promises);

    const result: { [key: string]: StockSummaryType } = {};
    docSnaps.forEach((snap, i) => {
      if (snap.exists())
        result[friendIds[i]] = snap.data()! as StockSummaryType;
    });
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const subscribeToFriendStockSummary = (
  friendId: string,
  onUpdate: (summary: StockSummaryType | null) => void
) => {
  const docRef = doc(firestore, "users", friendId, "data", "stockSummary");
  return onSnapshot(docRef, (snap) =>
    onUpdate(snap.exists() ? (snap.data()! as StockSummaryType) : null)
  );
};

// 자동 업데이트
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
    console.error(error);
    return { success: false, msg: "Failed to update stock summary." };
  }
};
