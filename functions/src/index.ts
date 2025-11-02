import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FieldValue } from "firebase-admin/firestore";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

admin.initializeApp();
const db = admin.firestore();
const expo = new Expo();

setGlobalOptions({
  region: "asia-northeast3",
  maxInstances: 10,
  secrets: ["GEMINI_API_KEY"],
});

// ==================== 푸시 알림 관련 함수 ====================
async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ 유효하지 않은 푸시 토큰: ${expoPushToken}`);
    return false;
  }
  try {
    const message: ExpoPushMessage = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data: data || {},
      priority: "high",
    };
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
    console.log(`✅ 푸시 알림 전송 성공: ${title}`);
    return true;
  } catch (error) {
    console.error("❌ 푸시 알림 전송 실패:", error);
    return false;
  }
}
// ======================================================

// ==================== 알림 스케줄러 ====================
export const check1HourBeforeDeadline = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "Asia/Seoul",
  },
  async () => {
    const now = new Date();
    const koreaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );
    const currentHour = koreaTime.getHours();
    console.log(`⏰ 1시간 전 알림 체크 시작: ${now.toISOString()}`);
    try {
      const usersSnapshot = await db.collection("users").get();
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const pushToken = userData.expoPushToken;

        // ✅ allowAlarm 체크
        if (!userData.allowAlarm) {
          console.log(`🔕 ${userId}: 알림 비활성화 상태 (allowAlarm: false)`);
          continue;
        }

        if (!pushToken) continue;
        const duetime = userData.duetime;
        if (!duetime) continue;
        const [dueHour] = duetime.split(":").map(Number);
        if (
          currentHour === dueHour - 1 ||
          (dueHour === 0 && currentHour === 23)
        ) {
          let targetDate: string;
          if (dueHour >= 0 && dueHour < 7) {
            const yesterday = new Date(koreaTime);
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = yesterday.toISOString().split("T")[0];
          } else {
            targetDate = koreaTime.toISOString().split("T")[0];
          }
          const todosDoc = await db
            .collection("users")
            .doc(userId)
            .collection("todos")
            .doc(targetDate)
            .get();
          if (!todosDoc.exists) continue;
          const todosData = todosDoc.data();
          if (!todosData) continue;
          const incompleteTasks = Object.values(todosData).filter(
            (task: any) => !task.completed
          ).length;
          if (incompleteTasks === 0) continue;
          await sendPushNotification(
            pushToken,
            "⏰ 1시간 남았어요!",
            `마감까지 1시간! 미완료 할일 ${incompleteTasks}개가 남았습니다.`,
            {
              type: "1hour_before",
              incompleteTasks,
              date: targetDate,
            }
          );
          console.log(
            `✅ ${userId}: 1시간 전 알림 전송 (${incompleteTasks}개 할일, 날짜: ${targetDate})`
          );
        }
      }
      console.log("✅ 1시간 전 알림 체크 완료");
    } catch (error) {
      console.error("❌ 1시간 전 알림 체크 에러:", error);
    }
  }
);

export const check10MinutesBeforeDeadline = onSchedule(
  {
    schedule: "50 * * * *",
    timeZone: "Asia/Seoul",
  },
  async () => {
    const now = new Date();
    const koreaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );
    const currentHour = koreaTime.getHours();
    console.log(`🚨 10분 전 알림 체크 시작: ${now.toISOString()}`);
    try {
      const usersSnapshot = await db.collection("users").get();
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const pushToken = userData.expoPushToken;

        // ✅ allowAlarm 체크
        if (!userData.allowAlarm) {
          console.log(`🔕 ${userId}: 알림 비활성화 상태 (allowAlarm: false)`);
          continue;
        }

        if (!pushToken) continue;
        const duetime = userData.duetime;
        if (!duetime) continue;
        const [dueHour] = duetime.split(":").map(Number);
        const nextHour = (currentHour + 1) % 24;
        if (nextHour === dueHour) {
          let targetDate: string;
          if (dueHour >= 0 && dueHour < 7) {
            const yesterday = new Date(koreaTime);
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = yesterday.toISOString().split("T")[0];
          } else {
            targetDate = koreaTime.toISOString().split("T")[0];
          }
          const todosDoc = await db
            .collection("users")
            .doc(userId)
            .collection("todos")
            .doc(targetDate)
            .get();
          if (!todosDoc.exists) continue;
          const todosData = todosDoc.data();
          if (!todosData) continue;
          const tasks = Object.values(todosData);
          const incompleteTasks = tasks.filter((task: any) => !task.completed);
          const totalTasks = tasks.length;
          if (incompleteTasks.length === 0) continue;
          const completionRate = Math.round(
            ((totalTasks - incompleteTasks.length) / totalTasks) * 100
          );
          await sendPushNotification(
            pushToken,
            "🚨 10분 남았어요!",
            `마감 임박! ${incompleteTasks.length}개 할일 남음 (진행률: ${completionRate}%)`,
            {
              type: "10min_before",
              incompleteTasks: incompleteTasks.length,
              completionRate,
              date: targetDate,
            }
          );
          console.log(`✅ ${userId}: 10분 전 알림 전송 (날짜: ${targetDate})`);
        }
      }
      console.log("✅ 10분 전 알림 체크 완료");
    } catch (error) {
      console.error("❌ 10분 전 알림 체크 에러:", error);
    }
  }
);
// ======================================================

// ==================== 마감 후 처리 ====================
async function applyNoTaskPenalty(
  userId: string,
  date: string,
  userData: admin.firestore.DocumentData
) {
  try {
    const currentPrice = userData.price || 100;
    const consecutiveNoTaskDays = (userData.consecutiveNoTaskDays || 0) + 1;
    let minRate: number;
    let maxRate: number;
    if (consecutiveNoTaskDays === 1) {
      minRate = 0.5;
      maxRate = 1.0;
    } else if (consecutiveNoTaskDays === 2) {
      minRate = 0.7;
      maxRate = 1.3;
    } else {
      minRate = 1.0;
      maxRate = 2.0;
    }
    const penaltyRate = minRate + Math.random() * (maxRate - minRate);
    const priceChange = currentPrice * (penaltyRate / 100);
    const newPrice = Math.max(
      1,
      Math.round((currentPrice - priceChange) * 10) / 10
    );
    const stockDocRef = db
      .collection("users")
      .doc(userId)
      .collection("stocks")
      .doc(date);
    const stockUpdate = {
      date: date,
      changePrice: -(Math.round(priceChange * 10) / 10),
      changeRate: -penaltyRate,
      open: currentPrice,
      close: newPrice,
      high: currentPrice,
      low: newPrice,
      volume: 0,
    };
    await stockDocRef.set(stockUpdate);
    await db
      .collection("users")
      .doc(userId)
      .update({
        price: newPrice,
        consecutiveNoTaskDays: FieldValue.increment(1),
        lastUpdated: FieldValue.serverTimestamp(),
      });
    console.log(
      `😴 ${userId}: 할일 없음. ${consecutiveNoTaskDays}일 연속. 주가 ${penaltyRate.toFixed(
        2
      )}% 하락. ${currentPrice} -> ${newPrice}`
    );

    // ✅ allowAlarm 체크 후 푸시 알림 전송
    if (userData.allowAlarm && userData.expoPushToken) {
      await sendPushNotification(
        userData.expoPushToken,
        "😴 할 일을 추가하지 않으셨네요!",
        `연속 ${consecutiveNoTaskDays}일째 할 일이 없어 주가가 ${penaltyRate.toFixed(
          2
        )}% 하락했습니다.`,
        {
          type: "no_task_penalty",
          date,
          consecutiveNoTaskDays,
          penaltyRate,
          newPrice,
        }
      );
    }
  } catch (error) {
    console.error(`❌ ${userId} 할일 없음 페널티 적용 실패:`, error);
  }
}

async function calculateStockPenalty(
  userId: string,
  date: string,
  incompleteTasks: any[],
  completedTasks: any[],
  currentPrice: number
) {
  try {
    const todoUpdates: { [key: string]: any } = {};
    let totalChangePrice = 0;
    let totalChangeRate = 0;
    incompleteTasks.forEach((task: any) => {
      totalChangePrice += task.priceChange || 0;
      totalChangeRate += task.percentage || 0;
      if (task.id) {
        todoUpdates[`${task.id}.appliedPriceChange`] = FieldValue.increment(
          -(task.priceChange || 0)
        );
        todoUpdates[`${task.id}.appliedPercentage`] = FieldValue.increment(
          -(task.percentage || 0)
        );
      }
    });
    if (Object.keys(todoUpdates).length > 0) {
      const todosDocRef = db
        .collection("users")
        .doc(userId)
        .collection("todos")
        .doc(date);
      await todosDocRef.update(todoUpdates);
    }
    const newPrice = Math.max(
      1,
      Math.round((currentPrice - totalChangePrice) * 10) / 10
    );
    const stockDocRef = db
      .collection("users")
      .doc(userId)
      .collection("stocks")
      .doc(date);
    const stockDoc = await stockDocRef.get();
    const previousStock = stockDoc.exists ? stockDoc.data() : null;
    const low = previousStock?.low
      ? Math.min(previousStock.low, newPrice)
      : newPrice;
    const changePrice = previousStock?.changePrice
      ? Math.round((previousStock.changePrice - totalChangePrice) * 10) / 10
      : -totalChangePrice;
    const changeRate = previousStock?.changeRate
      ? Math.round((previousStock.changeRate - totalChangeRate) * 10) / 10
      : -totalChangeRate;
    const open = previousStock?.open || currentPrice;
    const volume =
      changePrice >= 0 ? completedTasks.length : incompleteTasks.length;
    const stockData = {
      date: date,
      changePrice: changePrice,
      changeRate: changeRate,
      open: open,
      close: newPrice,
      high: previousStock?.high || currentPrice,
      low: low,
      volume: (previousStock?.volume || 0) + volume,
    };
    await stockDocRef.set(stockData);
    await db.collection("users").doc(userId).update({
      price: newPrice,
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // ✅ allowAlarm 체크 후 푸시 알림 전송
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (userData?.allowAlarm && userData?.expoPushToken) {
      const totalTasks = incompleteTasks.length + completedTasks.length;
      const completionRate = Math.round(
        (completedTasks.length / totalTasks) * 100
      );
      await sendPushNotification(
        userData.expoPushToken,
        "📉 주가가 하락했습니다",
        `${incompleteTasks.length}개 할일 미완료로 -${Math.abs(
          changeRate
        ).toFixed(2)}% 하락 (진행률: ${completionRate}%)`,
        {
          type: "deadline_passed",
          incompleteTasks: incompleteTasks.length,
          completedTasks: completedTasks.length,
          priceChange: changePrice,
          changeRate: changeRate,
          newPrice: newPrice,
          completionRate,
          date,
        }
      );
    }

    console.log(
      `📉 ${userId}: ${currentPrice} → ${newPrice} ` +
        `(changePrice: ${totalChangePrice}, ` +
        `changeRate: ${totalChangeRate.toFixed(2)}%)`
    );
    return {
      success: true,
      incompleteTasks: incompleteTasks.length,
      totalChangePrice,
      totalChangeRate,
    };
  } catch (error) {
    console.error(`❌ ${userId} 주가 업데이트 실패:`, error);
    return {
      success: false,
      error,
    };
  }
}

async function checkTasksForDate(
  userId: string,
  date: string,
  userData: admin.firestore.DocumentData
): Promise<void> {
  try {
    const todosDoc = await db
      .collection("users")
      .doc(userId)
      .collection("todos")
      .doc(date)
      .get();
    const todosData = todosDoc.exists ? todosDoc.data() : null;
    const totalTasks = todosData ? Object.keys(todosData).length : 0;
    if (totalTasks > 0) {
      if (
        userData.consecutiveNoTaskDays &&
        userData.consecutiveNoTaskDays > 0
      ) {
        await db
          .collection("users")
          .doc(userId)
          .update({ consecutiveNoTaskDays: 0 });
        console.log(`🔄 ${userId}: 할일 등록 확인, 연속 카운트 초기화.`);
      }
      const allTasks = todosData ? Object.values(todosData) : [];
      const incompleteTasks = allTasks.filter((task: any) => !task.completed);
      const completedTasks = allTasks.filter((task: any) => task.completed);
      if (incompleteTasks.length > 0) {
        console.log(
          `❌ ${userId}: ${date} ${incompleteTasks.length}개 미완료 (${completedTasks.length}개 완료)`
        );
        await calculateStockPenalty(
          userId,
          date,
          incompleteTasks,
          completedTasks,
          userData.price || 100
        );
      } else {
        console.log(`✅ ${userId}: ${date} 모든 할일 완료`);
      }
    } else {
      console.log(`📭 ${userId}: ${date} 할일 없음. 페널티 적용.`);
      await applyNoTaskPenalty(userId, date, userData);
    }
  } catch (error) {
    console.error(`❌ ${userId} ${date} 할일 체크 실패:`, error);
  }
}
// ======================================================

// ==================== 스케줄링 함수 ====================
export const checkUserTasksByTime = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "Asia/Seoul",
  },
  async (event) => {
    const now = new Date(event.scheduleTime);
    const koreaTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
      })
    );
    const currentHour = koreaTime.getHours();
    const currentTime = `${String(currentHour).padStart(2, "0")}:00`;
    console.log(`🕐 ${currentTime} 체크 시작 (한국 시간)`);
    try {
      const usersSnapshot = await db
        .collection("users")
        .where("duetime", "==", currentTime)
        .get();
      if (usersSnapshot.empty) {
        console.log(`📭 ${currentTime}에 해당하는 유저 없음`);
        return;
      }
      let targetDate: string;
      if (currentHour >= 0 && currentHour < 7) {
        const yesterday = new Date(koreaTime);
        yesterday.setDate(yesterday.getDate() - 1);
        targetDate = yesterday.toISOString().split("T")[0];
        console.log(`🌙 새벽 시간대 - 어제(${targetDate}) 할일 체크`);
      } else {
        targetDate = koreaTime.toISOString().split("T")[0];
        console.log(`☀️ 일반 시간대 - 오늘(${targetDate}) 할일 체크`);
      }
      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        console.log(
          `👤 ${userId}: duetime ${currentTime} → ${targetDate} 체크`
        );
        await checkTasksForDate(userId, targetDate, userData);
      });
      await Promise.all(promises);
      console.log(`✅ ${currentTime} 체크 완료 (대상 날짜: ${targetDate})`);
    } catch (error) {
      console.error("❌ 에러 발생:", error);
    }
  }
);

export const manualCheckUserTasks = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const date = req.query.date as string;
      if (!userId) {
        res.status(400).json({ error: "userId는 필수입니다" });
        return;
      }
      const targetDate =
        date ||
        new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
          .toISOString()
          .split("T")[0];
      console.log(`🔧 수동 체크: ${userId} - ${targetDate}`);
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: "유저를 찾을 수 없습니다" });
        return;
      }
      const userData = userDoc.data();
      if (!userData) {
        res.status(404).json({ error: "유저 데이터를 찾을 수 없습니다" });
        return;
      }
      await checkTasksForDate(userId, targetDate, userData);
      res.json({
        success: true,
        message: `${userId}의 ${targetDate} 할일 체크 완료`,
      });
    } catch (error: any) {
      console.error("❌ 수동 체크 에러:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export const batchCheckTasks = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate) {
        res
          .status(400)
          .json({ error: "startDate와 endDate는 필수입니다 (YYYY-MM-DD)" });
        return;
      }
      console.log(`📦 일괄 체크: ${startDate} ~ ${endDate}`);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
      }
      const usersSnapshot = await db.collection("users").get();
      let totalChecked = 0;
      for (const date of dates) {
        console.log(`📅 ${date} 체크 시작...`);
        const promises = usersSnapshot.docs.map(async (userDoc) => {
          const userId = userDoc.id;
          const userData = userDoc.data();
          await checkTasksForDate(userId, date, userData);
        });
        await Promise.all(promises);
        totalChecked += usersSnapshot.size;
        console.log(`✅ ${date} 체크 완료`);
      }
      res.json({
        success: true,
        message: `${dates.length}일 * ${usersSnapshot.size}명 = 총 ${totalChecked}건 체크 완료`,
        dates,
        userCount: usersSnapshot.size,
      });
    } catch (error: any) {
      console.error("❌ 일괄 체크 에러:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
// ======================================================

// ==================== AI 뉴스 생성 ====================
async function generateNewsForTask(
  userName: string,
  task: any,
  currentPrice: number
): Promise<{ title: string; content: string; id: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const taskText = task.text || "a specified task";
    const priceChange = task.priceChange || 0;
    const percentValue = task.percentage || 0;
    const newPrice = currentPrice + priceChange;
    const didRise = priceChange >= 0;
    const prompt = `
You are a professional financial news reporter. Write a short, formal, and slightly humorous Korean stock market news article.

**Data:**
- User Name: "${userName}"
- Completed Task: "${taskText}"
- Stock Price Change: From ${currentPrice} KRW to ${newPrice} KRW (${
  didRise ? "+" : ""
}${percentValue.toFixed(2)}%)

**Instructions:**
1. **Title:** Concise title (under 40 characters, no emojis) in Korean.
2. **Content:** 4-5 sentences in Korean describing the task completion and stock movement.

**Output Format:**
**title:** (Your title)
**content:** (Your content)
`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const titleMatch = text.match(/\*\*title:\*\*\s*(.+)/);
    const contentMatch = text.match(/\*\*content:\*\*\s*([\s\S]+)/);
    const now = new Date();
    const newsId = `news_${now.getTime()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    if (titleMatch && contentMatch) {
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim(),
        id: newsId,
      };
    }
    return {
      title: `${userName}, '${taskText}' 완료`,
      content: text,
      id: newsId,
    };
  } catch (error) {
    console.error("❌ AI 뉴스 생성 실패:", error);
    return null;
  }
}

async function saveNewsToFirestore(
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  newsContent: { title: string; content: string; id: string },
  imageURL: string | null | undefined
) {
  try {
    const newsId = newsContent.id;
    const docRef = db
      .collection("users")
      .doc(userId)
      .collection("news")
      .doc(newsId);
    const now = new Date();
    const newNews = {
      id: newsId,
      userId,
      userName,
      userPhotoURL: userPhotoURL || null,
      title: newsContent.title,
      content: newsContent.content,
      date: `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`,
      fullDate: now.toISOString().split("T")[0],
      createdAt: FieldValue.serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
      imageURL: imageURL || null,
    };
    await docRef.set(newNews);
  } catch (error) {
    console.error("❌ 뉴스 저장 실패:", error);
    throw error;
  }
}
// ======================================================

export const manualGenerateNews = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).send("Unauthorized");
        return;
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const authenticatedUserId = decodedToken.uid;

      const requestedUserId = req.query.userId as string;

      if (!requestedUserId) {
        res.status(400).send("userId 파라미터가 필요합니다");
        return;
      }

      if (authenticatedUserId !== requestedUserId) {
        res.status(403).send("Forbidden");
        return;
      }

      const taskId = req.query.taskId as string;
      const date =
        (req.query.date as string) || new Date().toISOString().split("T")[0];
      const imageURL = req.query.imageURL as string | undefined;
      const userDoc = await db.collection("users").doc(requestedUserId).get();

      if (!userDoc.exists) {
        res.status(404).send("유저를 찾을 수 없습니다");
        return;
      }

      const userData = userDoc.data()!;

      const todayKST = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
      )
        .toISOString()
        .split("T")[0];

      const lastReset = userData.newsGenerationLastReset || null;
      let currentCount = userData.newsGenerationCount || 0;

      if (lastReset !== todayKST) {
        console.log(
          `🌞 날짜 변경: ${lastReset} -> ${todayKST}. ${requestedUserId}의 뉴스 카운트 리셋.`
        );
        currentCount = 0;
      }

      if (currentCount >= 3) {
        console.log(
          `❌ ${requestedUserId}: 뉴스 생성 한도 초과 (오늘 ${currentCount}회)`
        );
        res
          .status(429)
          .send({ error: "하루에 최대 3개의 뉴스만 생성할 수 있습니다." });
        return;
      }

      const todosDoc = await db
        .collection("users")
        .doc(requestedUserId)
        .collection("todos")
        .doc(date)
        .get();

      if (!todosDoc.exists) {
        res.send({ message: "할일이 없습니다" });
        return;
      }

      const todosData = todosDoc.data();
      if (!todosData) {
        res.send({ message: `${date}에 할일이 없습니다` });
        return;
      }

      let targetTask = null;

      if (taskId) {
        targetTask = todosData[taskId];
        if (!targetTask) {
          res.status(404).send("해당 할일을 찾을 수 없습니다");
          return;
        }
      } else {
        const tasks = Object.values(todosData);
        const completedTasks = tasks.filter((task: any) => task.completed);
        if (completedTasks.length === 0) {
          res.send({ message: "완료된 할일이 없습니다" });
          return;
        }
        targetTask = completedTasks[0];
      }

      const newsContent = await generateNewsForTask(
        userData.name || "사용자",
        targetTask,
        userData.price || 100
      );

      if (newsContent) {
        await saveNewsToFirestore(
          requestedUserId,
          userData.name || "사용자",
          userData.image,
          newsContent,
          imageURL || null
        );

        if (lastReset !== todayKST) {
          await userDoc.ref.update({
            newsGenerationCount: 1,
            newsGenerationLastReset: todayKST,
          });
        } else {
          await userDoc.ref.update({
            newsGenerationCount: FieldValue.increment(1),
          });
        }

        res.send({
          message: "뉴스 생성 완료",
          news: newsContent,
          task: targetTask,
        });
      } else {
        res.status(500).send("뉴스 생성 실패");
      }
    } catch (error) {
      console.error("Auth or generation error:", error);
      if (error instanceof Error && error.message.includes("auth")) {
        res.status(401).send("Invalid token");
      } else {
        res.status(500).send("에러 발생: " + error);
      }
    }
  }
);
