import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { StockDataType, StockDataByDateType, UserType } from "@/types";

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

//특정 기간동안의 주식 데이터를 불러오는 함수
//달력의 날짜 범위를 변경하거나, 앱을 로드할때 호출
export const loadStockDataFirebase = async (
  user: UserType,
  startDate: string,
  endDate: string
): Promise<StockDataByDateType | null> => {
  try {
    if (!user?.uid) {
      throw new Error("User UID is undefined");
    }

    const docRef = doc(firestore, "users", user.uid, "data", "stocks");
    const docSnap = await getDoc(docRef);

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
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD 형식

      // 해당 날짜의 데이터가 없으면 0으로 채운 데이터 생성
      if (!stockDataByDate[dateStr]) {
        const defaultData: StockDataType = {
          date: dateStr,
          changePrice: 0,
          changeRate: 0,
          open: user?.price!,
          close: user?.price!,
          high: user?.price!,
          low: user?.price!,
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

    if (Object.keys(stockDataByDate).length === 0) {
      return null;
    }
    return stockDataByDate;
  } catch (error) {
    console.error("Error loading user stock data: ", error);
    return null;
  }
};

export const loadAllStockDataFirebase = async (
  user: UserType
): Promise<StockDataByDateType | null> => {
  try {
    if (!user?.uid) {
      throw new Error("User UID is undefined");
    }

    const docRef = doc(firestore, "users", user.uid, "data", "stocks");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const allData = docSnap.data();
    const stockDataByDate: StockDataByDateType = {};
    const registerDate = user.registerDate || "2023-01-01";

    // registerDate 이후의 데이터만 필터링
    Object.keys(allData).forEach((date) => {
      if (date >= registerDate) {
        stockDataByDate[date] = allData[date] as StockDataType;
      }
    });

    if (Object.keys(stockDataByDate).length === 0) {
      return null;
    }
    return stockDataByDate;
  } catch (error) {
    console.error("Error loading all user stock data: ", error);
    return null;
  }
};

export const loadFriendStockDataFirebase = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<StockDataByDateType | null> => {
  try {
    if (!userId) {
      throw new Error("User UID is undefined");
    }

    const docRef = doc(firestore, "users", userId, "data", "stocks");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const allData = docSnap.data();
    const stockDataByDate: StockDataByDateType = {};

    // startDate와 endDate 사이의 데이터만 필터링
    Object.keys(allData).forEach((date) => {
      if (date >= startDate && date <= endDate) {
        stockDataByDate[date] = allData[date] as StockDataType;
      }
    });

    if (Object.keys(stockDataByDate).length === 0) {
      return null;
    }

    return stockDataByDate;
  } catch (error) {
    console.error("Error loading friend stock data: ", error);
    return null;
  }
};
