import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();
const db = admin.firestore();

// 글로벌 옵션 설정 (모든 함수에 적용)
setGlobalOptions({
  region: "asia-northeast3", // 서울 리전
  maxInstances: 10,
});

// 주가 하락 계산 및 적용
async function calculateStockPenalty(
  userId: string,
  date: string,
  incompleteTasks: any[],
  currentPrice: number
) {
  try {
    // 각 미완료 할일의 changePrice와 changeRate 합산
    let totalChangePrice = 0;
    let totalChangeRate = 0;

    incompleteTasks.forEach((task: any) => {
      totalChangePrice += task.priceChange || 0;
      totalChangeRate += task.percentage || 0;
    });

    // 새로운 주가 계산
    const newPrice = Math.max(1, currentPrice - totalChangePrice); // 최소 1원

    // 주식 데이터 업데이트
    const stocksDocRef = db
      .collection("users")
      .doc(userId)
      .collection("data")
      .doc("stocks");

    const stocksDoc = await stocksDocRef.get();
    const stocksData = stocksDoc.exists ? stocksDoc.data() || {} : {};
    const previousStock = stocksData[date] || {};

    const low = previousStock.low
      ? Math.min(previousStock.low, newPrice)
      : newPrice;

    const changePrice = previousStock.changePrice
      ? previousStock.changePrice - totalChangePrice
      : -totalChangePrice;

    const changeRate = previousStock.changeRate
      ? previousStock.changeRate - totalChangeRate
      : -totalChangeRate;

    const open = previousStock.open ? previousStock.open : currentPrice;

    stocksData[date] = {
      date: date,
      changePrice: changePrice,
      changeRate: changeRate,
      open: open,
      close: newPrice,
      high: currentPrice,
      low: low,
      volume: incompleteTasks.length,
    };

    await stocksDocRef.set(stocksData, { merge: true });

    // 유저 프로필의 price 업데이트
    await db.collection("users").doc(userId).update({
      price: newPrice,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `📉 ${userId}: ${currentPrice} → ${newPrice} ` +
        `(changePrice: ${totalChangePrice}, ` +
        `changeRate: ${(totalChangeRate * 100).toFixed(2)}%)`
    );
  } catch (error) {
    console.error(`❌ ${userId} 주가 업데이트 실패:`, error);
  }
}
// 특정 유저의 duetime에 맞춰 체크하는 함수 (매시간 실행)
export const checkUserTasksByTime = onSchedule(
  {
    schedule: "0 * * * *", // 매시간 정각
    timeZone: "Asia/Seoul",
  },
  async (event) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinute
    ).padStart(2, "0")}`;

    console.log(`🕐 ${currentTime} 체크 시작`);

    try {
      // duetime이 현재 시간인 유저들 찾기
      const usersSnapshot = await db
        .collection("users")
        .where("duetime", "==", currentTime)
        .get();

      if (usersSnapshot.empty) {
        console.log(`📭 ${currentTime}에 해당하는 유저 없음`);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // 오늘의 할일 가져오기
        const todosDoc = await db
          .collection("users")
          .doc(userId)
          .collection("data")
          .doc("todos")
          .get();

        if (!todosDoc.exists) {
          return;
        }

        const todosData = todosDoc.data();
        const todayTodos = todosData?.[today];

        if (!todayTodos) {
          console.log(`📭 ${userId}: 오늘 할일 없음`);
          return;
        }

        // 미완료 할일 수집
        const incompleteTasks = Object.values(todayTodos).filter(
          (task: any) => !task.completed
        );

        if (incompleteTasks.length === 0) {
          console.log(`✅ ${userId}: 모든 할일 완료`);
          return;
        }

        console.log(`❌ ${userId}: ${incompleteTasks.length}개 미완료`);

        await calculateStockPenalty(
          userId,
          today,
          incompleteTasks,
          userData.price || 100
        );
      });

      await Promise.all(promises);
      console.log(`✅ ${currentTime} 체크 완료`);
    } catch (error) {
      console.error("❌ 에러 발생:", error);
    }
  }
);

// 수동 트리거용 HTTP 함수 (테스트용)
export const manualCheckTasks = onRequest(async (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).send("userId 파라미터가 필요합니다");
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).send("유저를 찾을 수 없습니다");
      return;
    }

    const userData = userDoc.data()!;
    const today = new Date().toISOString().split("T")[0];

    const todosDoc = await db
      .collection("users")
      .doc(userId)
      .collection("data")
      .doc("todos")
      .get();

    if (!todosDoc.exists) {
      res.send({ message: "할일이 없습니다" });
      return;
    }

    const todosData = todosDoc.data();
    const todayTodos = todosData?.[today];

    if (!todayTodos) {
      res.send({ message: "오늘 할일이 없습니다" });
      return;
    }

    const incompleteTasks = Object.values(todayTodos).filter(
      (task: any) => !task.completed
    );

    if (incompleteTasks.length === 0) {
      res.send({ message: "모든 할일 완료!" });
      return;
    }

    await calculateStockPenalty(
      userId,
      today,
      incompleteTasks,
      userData.price || 100
    );

    res.send({
      message: "주가 업데이트 완료",
      incompletedCount: incompleteTasks.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("에러 발생: " + error);
  }
});

/*new생성한느 openAI api연동을 firebase function을 활용해서 해야해>
4~5줄 뉴스를 생성할거고 내가 생성한 뉴스를 이용해서 뉴스생성 해줘야해.
예를 들어 
제목 : Ddongmin index화면 제작 완료!, 주가 0.3% 소폭상승!
오늘  :DDongmin이 index화면 제작하기 할일을 제시간 내에 완료하여 주가가 0.3% 소폭상승하여 현재 주가 128원에 안착했습니다.
주주들은 이러한 소폭 상승에 만족하는 분위기 이지만 더 상승해주길 바라고있습ᄂ디ᅡ. 대충 이런식*/
