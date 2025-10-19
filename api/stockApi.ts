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
