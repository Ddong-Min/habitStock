import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { StockDataType, StockDataByDateType, UserType } from "@/types";

//각 날마다의 주식 데이터를 저장하는 함수
//해당 날의 데이터를 처음 생성할때는 setDoc, 이미 존재하는 데이터를 변경할때는 updateDoc 사용
export const changeStockDataFirebase = async (
  userId: string,
  stockData: StockDataType,
  date: string
) => {
  try {
    const userRef = doc(firestore, "users", userId, "stocks", date);

    try {
      // try update first
      await updateDoc(userRef, stockData);
    } catch (error: any) {
      // if doc doesn't exist, updateDoc throws => fallback to setDoc
      if (error.code === "not-found") {
        await setDoc(userRef, stockData);
      } else {
        throw error;
      }
    }

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
  //const { user } = useAuth(); => in the normal async function, you can't call hook function
  try {
    if (!user?.uid) {
      throw new Error("User UID is undefined");
    }
    const stocksCollection = collection(firestore, "users", user.uid, "stocks");

    let q = query(
      stocksCollection,
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const querySnapshot = await getDocs(q);
    const stockDataByDate: StockDataByDateType = {};

    // Firebase에서 가져온 데이터를 먼저 저장
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as StockDataType;
      stockDataByDate[data.date] = data;
    });

    // startDate부터 endDate까지의 모든 날짜 생성
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD 형식
      // 해당 날짜의 데이터가 없으면 0으로 채운 데이터 생성
      if (!stockDataByDate[dateStr]) {
        stockDataByDate[dateStr] = {
          date: dateStr,
          changePrice: 0,
          changeRate: 0,
          open: user?.price!,
          close: user?.price!,
          high: user?.price!,
          low: user?.price!,
          volume: 0,
        };
        setDoc(doc(firestore, "users", user.uid, "stocks", dateStr), {
          ...stockDataByDate[dateStr],
        }).catch((error) =>
          console.error("Error creating default stock data: ", error)
        );
      }
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
    const stocksCollection = collection(firestore, "users", user.uid, "stocks");

    const querySnapshot = await getDocs(stocksCollection);
    const stockDataByDate: StockDataByDateType = {};
    // Firebase에서 가져온 데이터를 먼저 저장
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as StockDataType;
      stockDataByDate[data.date] = data;
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
