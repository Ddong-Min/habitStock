import { firestore } from "@/config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  writeBatch,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

type WriteBatch = ReturnType<typeof writeBatch>;

import {
  StockDataType,
  StockDataByDateType,
  FriendStockType,
  StockSummaryType,
} from "@/types";

// ✅ 새로운 구조: users/{userId}/stocks/{year}
// 각 year 문서 내부에 { "2025-01-01": StockDataType, "2025-01-02": StockDataType, ... }

// 날짜에서 연도 추출
const getYearFromDate = (date: string): string => {
  return date.split("-")[0];
};

// 날짜별 주식 데이터 저장
export const changeStockDataFirebase = async (
  userId: string,
  stockData: StockDataType,
  date: string
) => {
  try {
    const year = getYearFromDate(date);
    const docRef = doc(firestore, "users", userId, "stocks", year);

    // 해당 연도 문서에 날짜를 키로 하는 데이터 병합
    await setDoc(docRef, { [date]: stockData }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error changing user stock: ", error);
    return { success: false, msg: "Failed to change user stock." };
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
  const startYear = getYearFromDate(startDate);
  const endYear = getYearFromDate(endDate);

  const stocksRef = collection(firestore, "users", userId, "stocks");
  const q = query(
    stocksRef,
    where("__name__", ">=", startYear),
    where("__name__", "<=", endYear)
  );

  return onSnapshot(q, async (snapshot) => {
    const stockDataByDate: StockDataByDateType = {};

    // 각 연도 문서에서 날짜별 데이터 추출
    snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      const yearData = doc.data();
      Object.keys(yearData).forEach((date) => {
        // startDate와 endDate 사이의 데이터만 포함
        if (date >= startDate && date <= endDate) {
          stockDataByDate[date] = yearData[date] as StockDataType;
        }
      });
    });

    // startDate~endDate 사이에 없는 날짜 생성
    const start = new Date(startDate);
    const end = new Date(endDate);
    const batch = writeBatch(firestore);
    let hasNewDates = false;
    const newDataByYear: { [year: string]: { [date: string]: StockDataType } } =
      {};

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

        const year = getYearFromDate(dateStr);
        if (!newDataByYear[year]) {
          newDataByYear[year] = {};
        }
        newDataByYear[year][dateStr] = defaultData;
        hasNewDates = true;
      }
    }

    if (hasNewDates) {
      // 연도별로 배치 업데이트
      Object.keys(newDataByYear).forEach((year) => {
        const docRef = doc(firestore, "users", userId, "stocks", year);
        batch.set(docRef, newDataByYear[year], { merge: true });
      });
      await batch.commit().catch(console.error);
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
  const registerYear = getYearFromDate(registerDate);
  const stocksRef = collection(firestore, "users", userId, "stocks");
  const q = query(stocksRef, where("__name__", ">=", registerYear));

  return onSnapshot(q, (snapshot) => {
    const stockDataByDate: StockDataByDateType = {};

    snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      const yearData = doc.data();
      Object.keys(yearData).forEach((date) => {
        if (date >= registerDate) {
          stockDataByDate[date] = yearData[date] as StockDataType;
        }
      });
    });

    onUpdate(stockDataByDate);
  });
};

// 친구 주식 데이터 실시간 구독 (특정 기간)
export const subscribeToFriendStockData = (
  userId: string,
  startDate: string,
  endDate: string,
  onUpdate: (stockData: StockDataByDateType) => void
) => {
  const startYear = getYearFromDate(startDate);
  const endYear = getYearFromDate(endDate);

  const stocksRef = collection(firestore, "users", userId, "stocks");
  const q = query(
    stocksRef,
    where("__name__", ">=", startYear),
    where("__name__", "<=", endYear)
  );

  return onSnapshot(q, (snapshot) => {
    const stockDataByDate: StockDataByDateType = {};

    snapshot.forEach((doc: FirebaseFirestoreTypes.DocumentSnapshot) => {
      const yearData = doc.data();
      if (yearData) {
        Object.keys(yearData).forEach((date) => {
          if (date >= startDate && date <= endDate) {
            stockDataByDate[date] = yearData[date] as StockDataType;
          }
        });
      }
    });

    onUpdate(stockDataByDate);
  });
};

// 🔥 NEW: 여러 친구의 주식 데이터를 실시간으로 구독
export const subscribeToMultipleFriendStockData = (
  userIds: string[],
  startDate: string,
  endDate: string,
  onUpdate: (friendStockData: FriendStockType) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!userIds || userIds.length === 0) {
    onUpdate({});
    return () => {};
  }

  const startYear = getYearFromDate(startDate);
  const endYear = getYearFromDate(endDate);
  const unsubscribes: (() => void)[] = [];
  const friendStockDataMap: FriendStockType = {};

  try {
    userIds.forEach((userId) => {
      const stocksRef = collection(firestore, "users", userId, "stocks");
      const q = query(
        stocksRef,
        where("__name__", ">=", startYear),
        where("__name__", "<=", endYear)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const stockDataByDate: StockDataByDateType = {};

          snapshot.forEach(
            (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
              const yearData = doc.data();
              Object.keys(yearData).forEach((date) => {
                if (date >= startDate && date <= endDate) {
                  stockDataByDate[date] = yearData[date] as StockDataType;
                }
              });
            }
          );

          // 해당 친구의 데이터 업데이트
          friendStockDataMap[userId] = stockDataByDate;

          // 전체 데이터 업데이트 콜백 호출
          onUpdate({ ...friendStockDataMap });
        },
        (error) => {
          console.error(`친구 ${userId} 주식 구독 실패:`, error);
          if (onError) onError(error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // cleanup 함수: 모든 구독 해제
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  } catch (error) {
    console.error("친구 주식 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

// 🔥 NEW: 여러 친구의 전체 주식 데이터를 실시간으로 구독 (날짜 제한 없음)
export const subscribeToAllFriendStockData = (
  userIds: string[],
  onUpdate: (friendStockData: FriendStockType) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!userIds || userIds.length === 0) {
    onUpdate({});
    return () => {};
  }

  const unsubscribes: (() => void)[] = [];
  const friendStockDataMap: FriendStockType = {};

  try {
    userIds.forEach((userId) => {
      const stocksRef = collection(firestore, "users", userId, "stocks");

      const unsubscribe = onSnapshot(
        stocksRef,
        (snapshot) => {
          const stockDataByDate: StockDataByDateType = {};

          snapshot.forEach(
            (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
              const yearData = doc.data();
              Object.keys(yearData).forEach((date) => {
                stockDataByDate[date] = yearData[date] as StockDataType;
              });
            }
          );

          // 해당 친구의 데이터 업데이트
          friendStockDataMap[userId] = stockDataByDate;

          // 전체 데이터 업데이트 콜백 호출
          onUpdate({ ...friendStockDataMap });
        },
        (error) => {
          console.error(`친구 ${userId} 주식 구독 실패:`, error);
          if (onError) onError(error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // cleanup 함수: 모든 구독 해제
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  } catch (error) {
    console.error("친구 주식 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
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
    const docRef = doc(firestore, "users", userId, "summary", "stockSummary");
    await setDoc(docRef, summary);
    return { success: true };
  } catch (error) {
    console.error("Error saving stock summary: ", error);
    return { success: false, msg: "Failed to save stock summary." };
  }
};

export const subscribeToStockSummary = (
  userId: string,
  onUpdate: (summary: StockSummaryType | null) => void
) => {
  const docRef = doc(firestore, "users", userId, "summary", "stockSummary");
  return onSnapshot(docRef, (docSnap) =>
    onUpdate(docSnap.exists() ? (docSnap.data()! as StockSummaryType) : null)
  );
};

export const subscribeToFriendStockSummary = (
  friendId: string,
  onUpdate: (summary: StockSummaryType | null) => void
) => {
  const docRef = doc(firestore, "users", friendId, "summary", "stockSummary");
  return onSnapshot(docRef, (snap) =>
    onUpdate(snap.exists() ? (snap.data()! as StockSummaryType) : null)
  );
};

// 🔥 NEW: 여러 친구의 Summary를 실시간으로 구독
export const subscribeToMultipleFriendStockSummaries = (
  friendIds: string[],
  onUpdate: (summaries: { [friendId: string]: StockSummaryType }) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!friendIds || friendIds.length === 0) {
    onUpdate({});
    return () => {};
  }

  const unsubscribes: (() => void)[] = [];
  const summariesMap: { [friendId: string]: StockSummaryType } = {};

  try {
    friendIds.forEach((friendId) => {
      const docRef = doc(
        firestore,
        "users",
        friendId,
        "summary",
        "stockSummary"
      );

      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            summariesMap[friendId] = snap.data()! as StockSummaryType;
          } else {
            // Summary가 없으면 맵에서 제거
            delete summariesMap[friendId];
          }

          // 업데이트 콜백 호출
          onUpdate({ ...summariesMap });
        },
        (error) => {
          console.error(`친구 ${friendId} Summary 구독 실패:`, error);
          if (onError) onError(error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // cleanup 함수: 모든 구독 해제
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  } catch (error) {
    console.error("친구 Summary 구독 설정 실패:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
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

// ==================== Migration ====================

// 🔄 날짜별 구조에서 연도별 구조로 마이그레이션
export const migrateStockDataToYearlyStructure = async (
  userId: string,
  onProgress?: (current: number, total: number) => void
) => {
  try {
    console.log(`🔄 Starting migration for user ${userId}...`);

    // 1. 기존 날짜별 문서들 가져오기
    const oldStocksRef = collection(firestore, "users", userId, "stocks");
    const snapshot = await getDocs(oldStocksRef);

    if (snapshot.empty) {
      console.log("No data to migrate.");
      return { success: true, msg: "No data to migrate." };
    }

    // 2. 연도별로 데이터 그룹화
    const dataByYear: { [year: string]: { [date: string]: StockDataType } } =
      {};
    const oldDocIds: string[] = [];

    snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      const docId = doc.id;
      const data = doc.data() as StockDataType;

      // 날짜 형식인지 확인 (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(docId)) {
        const year = getYearFromDate(docId);

        if (!dataByYear[year]) {
          dataByYear[year] = {};
        }

        dataByYear[year][docId] = data;
        oldDocIds.push(docId);
      }
    });

    const totalYears = Object.keys(dataByYear).length;
    console.log(
      `Found ${oldDocIds.length} documents across ${totalYears} years`
    );

    // 3. 연도별 문서로 저장
    let processedYears = 0;
    for (const [year, yearData] of Object.entries(dataByYear)) {
      const yearDocRef = doc(firestore, "users", userId, "stocks", year);
      await setDoc(yearDocRef, yearData);

      processedYears++;
      if (onProgress) {
        onProgress(processedYears, totalYears);
      }

      console.log(
        `✅ Migrated year ${year} with ${Object.keys(yearData).length} dates`
      );
    }

    // 4. 기존 날짜별 문서들 삭제 (배치로 처리)
    console.log(`🗑️ Deleting ${oldDocIds.length} old documents...`);
    const batches: WriteBatch[] = [];
    let currentBatch = writeBatch(firestore);
    let batchCount = 0;

    for (const docId of oldDocIds) {
      const oldDocRef = doc(firestore, "users", userId, "stocks", docId);
      currentBatch.delete(oldDocRef);
      batchCount++;

      // Firestore 배치는 최대 500개 작업 제한
      if (batchCount === 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(firestore);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    // 모든 배치 커밋
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`🗑️ Deleted batch ${i + 1}/${batches.length}`);
    }

    console.log(`✅ Migration completed successfully!`);
    return {
      success: true,
      msg: `Migrated ${oldDocIds.length} documents to ${totalYears} year documents`,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return {
      success: false,
      msg: `Migration failed: ${error}`,
    };
  }
};

// 🔄 모든 사용자의 데이터 마이그레이션 (관리자용)
export const migrateAllUsersStockData = async (
  userIds: string[],
  onUserProgress?: (userId: string, current: number, total: number) => void,
  onOverallProgress?: (current: number, total: number) => void
) => {
  const results: { userId: string; success: boolean; msg?: string }[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    console.log(`\n📦 Migrating user ${i + 1}/${userIds.length}: ${userId}`);

    const result = await migrateStockDataToYearlyStructure(
      userId,
      (current, total) => {
        if (onUserProgress) {
          onUserProgress(userId, current, total);
        }
      }
    );

    results.push({
      userId,
      success: result.success,
      msg: result.msg,
    });

    if (onOverallProgress) {
      onOverallProgress(i + 1, userIds.length);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `\n✅ Migration complete: ${successCount}/${userIds.length} users migrated successfully`
  );

  return {
    success: successCount === userIds.length,
    results,
  };
};
