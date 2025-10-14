import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// 글로벌 옵션 설정 (모든 함수에 적용)
setGlobalOptions({
  region: "asia-northeast3", // 서울 리전
  maxInstances: 10,
  secrets: ["GEMINI_API_KEY"], // 모든 함수에서 Gemini API 키 사용 명시
});

// 주가 하락 계산 및 적용
async function calculateStockPenalty(
  userId: string,
  date: string, // YYYY-MM-DD 형식의 날짜
  incompleteTasks: any[],
  completedTasks: any[],
  currentPrice: number
) {
  try {
    const todoUpdates: { [key: string]: any } = {};
    let totalChangePrice = 0;
    let totalChangeRate = 0;

    // 1. 미완료 할 일을 순회하며 페널티 총합 계산 및 업데이트 내용 준비
    incompleteTasks.forEach((task: any) => {
      totalChangePrice += task.priceChange || 0;
      totalChangeRate += task.percentage || 0;

      // task 객체에 id가 있을 경우, 업데이트할 내용을 준비합니다.
      if (task.id) {
        // 점 표기법을 사용하여 'todos' 문서 내의 정확한 필드 경로를 지정합니다.
        // 예: '2025-10-13.task-abc-123.appliedPriceChange'
        const priceFieldPath = `${date}.${task.id}.appliedPriceChange`;
        const percentFieldPath = `${date}.${task.id}.appliedPercentage`;

        // FieldValue.increment를 사용해 기존 값에서 안전하게 값을 차감합니다.
        todoUpdates[priceFieldPath] = FieldValue.increment(
          -(task.priceChange || 0)
        );
        todoUpdates[percentFieldPath] = FieldValue.increment(
          -(task.percentage || 0)
        );
      }
    });

    // 2. 'todos' 문서에 미완료 할 일들의 변경사항을 한 번에 적용
    if (Object.keys(todoUpdates).length > 0) {
      const todosDocRef = db
        .collection("users")
        .doc(userId)
        .collection("data")
        .doc("todos");
      await todosDocRef.update(todoUpdates);
      console.log(
        `✅ [${userId}] ${incompleteTasks.length}개 할일 페널티 필드 적용 완료`
      );
    }

    // 3. 페널티가 적용된 새 주가 계산
    const newPrice = Math.max(
      1,
      Math.round((currentPrice - totalChangePrice) * 10) / 10
    );

    // 4. 'stocks' 문서 업데이트
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
      ? Math.round((previousStock.changePrice - totalChangePrice) * 10) / 10
      : -totalChangePrice;
    const changeRate = previousStock.changeRate
      ? Math.round((previousStock.changeRate - totalChangeRate) * 10) / 10
      : -totalChangeRate;
    const open = previousStock.open ? previousStock.open : currentPrice;
    const volume =
      changePrice >= 0 ? completedTasks.length : incompleteTasks.length;

    stocksData[date] = {
      date: date,
      changePrice: changePrice,
      changeRate: changeRate,
      open: open,
      close: newPrice,
      high: previousStock.high || currentPrice,
      low: low,
      volume: (previousStock.volume || 0) + volume,
    };
    await stocksDocRef.set(stocksData, { merge: true });

    // 5. 유저 프로필의 price 업데이트
    await db.collection("users").doc(userId).update({
      price: newPrice,
      lastUpdated: FieldValue.serverTimestamp(),
    });

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
    console.error(`❌ ${userId} 주가 및 할일 업데이트 실패:`, error);
    return {
      success: false,
      error,
    };
  }
}

// 🔥 NEW: 특정 날짜의 할일을 체크하는 공통 함수
async function checkTasksForDate(
  userId: string,
  date: string,
  currentPrice: number
): Promise<void> {
  try {
    // 해당 날짜의 할일 가져오기
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
    const dateTodos = todosData?.[date];

    if (!dateTodos) {
      console.log(`📭 ${userId}: ${date} 할일 없음`);
      return;
    }

    // 미완료 할일 수집
    const incompleteTasks = Object.values(dateTodos).filter(
      (task: any) => !task.completed
    );
    const completedTasks = Object.values(dateTodos).filter(
      (task: any) => task.completed
    );

    if (incompleteTasks.length === 0) {
      console.log(`✅ ${userId}: ${date} 모든 할일 완료`);
      return;
    }

    console.log(
      `❌ ${userId}: ${date} ${incompleteTasks.length}개 미완료 (${completedTasks.length}개 완료)`
    );

    await calculateStockPenalty(
      userId,
      date,
      incompleteTasks,
      completedTasks,
      currentPrice
    );
  } catch (error) {
    console.error(`❌ ${userId} ${date} 할일 체크 실패:`, error);
  }
}

// 🔥 FIX: 특정 유저의 duetime에 맞춰 체크하는 함수 (매시간 실행)
export const checkUserTasksByTime = onSchedule(
  {
    schedule: "0 * * * *", // 매시간 정각
    timeZone: "Asia/Seoul",
  },
  async () => {
    // 한국 시간으로 변환
    const now = new Date();
    const koreaTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
      })
    );

    const currentHour = koreaTime.getHours();
    const currentMinute = koreaTime.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinute
    ).padStart(2, "0")}`;

    console.log(`🕐 ${currentTime} 체크 시작 (한국 시간)`);

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

      // 🔥 FIX: duetime이 00:00~07:00 사이면 어제 날짜, 그 외는 오늘 날짜
      let targetDate: string;
      if (currentHour >= 0 && currentHour < 7) {
        // 새벽 시간대 (00:00 ~ 06:59) → 어제 날짜
        const yesterday = new Date(koreaTime);
        yesterday.setDate(yesterday.getDate() - 1);
        targetDate = yesterday.toISOString().split("T")[0];
        console.log(`🌙 새벽 시간대 - 어제(${targetDate}) 할일 체크`);
      } else {
        // 일반 시간대 (07:00 ~ 23:59) → 오늘 날짜
        targetDate = koreaTime.toISOString().split("T")[0];
        console.log(`☀️ 일반 시간대 - 오늘(${targetDate}) 할일 체크`);
      }

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();

        console.log(
          `👤 ${userId}: duetime ${currentTime} → ${targetDate} 체크`
        );

        await checkTasksForDate(userId, targetDate, userData.price || 100);
      });

      await Promise.all(promises);
      console.log(`✅ ${currentTime} 체크 완료 (대상 날짜: ${targetDate})`);
    } catch (error) {
      console.error("❌ 에러 발생:", error);
    }
  }
);

// 🗑️ 안전망 함수 삭제 - duetime으로만 체크
// (필요하면 주석 해제해서 사용)

// 🔥 NEW: 수동으로 특정 유저의 특정 날짜 할일 체크 (테스트/관리용)
export const manualCheckUserTasks = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    try {
      const { userId, date } = req.body;

      if (!userId) {
        res.status(400).json({ error: "userId는 필수입니다" });
        return;
      }

      // 날짜가 없으면 오늘 날짜 사용
      const targetDate =
        date ||
        new Date()
          .toLocaleString("en-US", { timeZone: "Asia/Seoul" })
          .split(",")[0];

      console.log(`🔧 수동 체크: ${userId} - ${targetDate}`);

      // 유저 정보 가져오기
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        res.status(404).json({ error: "유저를 찾을 수 없습니다" });
        return;
      }

      const userData = userDoc.data();
      await checkTasksForDate(userId, targetDate, userData?.price || 100);

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

// 🔥 NEW: 특정 기간의 모든 유저 할일 일괄 체크 (관리자용)
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

      // 날짜 범위 생성
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
      }

      // 모든 유저 가져오기
      const usersSnapshot = await db.collection("users").get();
      let totalChecked = 0;

      for (const date of dates) {
        console.log(`📅 ${date} 체크 시작...`);

        const promises = usersSnapshot.docs.map(async (userDoc) => {
          const userId = userDoc.id;
          const userData = userDoc.data();
          await checkTasksForDate(userId, date, userData.price || 100);
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

/**
 * 단일 Task에 대한 AI 뉴스 생성 (프롬프트 및 파싱 로직 개선)
 */
async function generateNewsForTask(
  userName: string,
  task: any,
  currentPrice: number
): Promise<{ title: string; content: string } | null> {
  console.log("🔍 generateNewsForTask 시작");
  console.log("userName:", userName);
  console.log("task:", JSON.stringify(task));
  console.log("currentPrice:", currentPrice);

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key exists:", !!apiKey);
  console.log("API Key length:", apiKey?.length);

  if (!apiKey) {
    console.error("❌ API Key not found in environment variables.");
    return null;
  }

  try {
    console.log("✅ GoogleGenerativeAI 초기화 중...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    console.log("✅ 모델 로드 완료");

    const taskText = task.text || "a specified task";
    const priceChange = task.priceChange || 0;
    const percentValue = task.percentage || 0;
    const newPrice = currentPrice + priceChange;

    const didRise = priceChange >= 0;
    const direction = didRise ? "rose" : "fell";
    const modifier =
      Math.abs(percentValue) < 0.5
        ? "slightly"
        : Math.abs(percentValue) < 2
        ? "moderately"
        : "sharply";

    const prompt = `
You are a professional financial news reporter. Write a short, formal, and slightly humorous Korean stock market news article based on the following data.

**Data:**
- User Name: "${userName}"
- Completed Task: "${taskText}"
- Stock Price Change: From ${currentPrice} KRW to ${newPrice} KRW (${
      didRise ? "+" : ""
    }${percentValue.toFixed(2)}%)

**Instructions:**
1.  **Title:** Create a concise title (under 40 characters, no emojis) in Korean (but Username remains the same ). It should state that the user's stock price ${direction} after completing the task.
2.  **Content:** Write a 4-5 sentence article in Korean.
    - Start by mentioning that "${userName}" has completed the task "${taskText}".
    - State that the stock price ${modifier} ${direction} by ${percentValue.toFixed(
      2
    )}%, closing at ${newPrice} KRW.
    - Describe investor reactions: ${
      didRise
        ? "positive, with high expectations for future performance"
        : "cautious, expressing concerns but hoping for a recovery"
    }.
    - Conclude with a brief future outlook.

**Required Output Format (Strictly follow this):**
**title:** (Your generated title here)
**content:** (Your generated content here)
`;

    console.log("📤 Gemini API 요청 중...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });
    console.log("✅ Gemini API 응답 받음");

    const response = result.response;
    const text = response.text();
    console.log("📄 응답 텍스트:", text);

    if (!text) {
      console.warn("⚠️ Gemini API returned an empty response.");
      return null;
    }

    const titleMatch = text.match(/\*\*title:\*\*\s*(.+)/);
    const contentMatch = text.match(/\*\*content:\*\*\s*([\s\S]+)/);

    if (titleMatch && contentMatch) {
      console.log("✅ 파싱 성공");
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim(),
      };
    }

    console.warn("⚠️ Could not parse title/content from Gemini response.");
    return {
      title: `${userName}, '${taskText}' 완료`,
      content: text,
    };
  } catch (error) {
    console.error("❌ AI 뉴스 생성 실패:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return null;
  }
}

/**
 * 뉴스를 Firestore에 저장
 */
async function saveNewsToFirestore(
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  newsContent: { title: string; content: string }
) {
  try {
    const now = new Date();
    const newsId = `news_${now.getTime()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const docRef = db
      .collection("users")
      .doc(userId)
      .collection("data")
      .doc("news");
    const docSnap = await docRef.get();
    const currentData = docSnap.exists ? docSnap.data() ?? {} : {};

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
    };

    currentData[newsId] = newNews;
    await docRef.set(currentData, { merge: true });
  } catch (error) {
    console.error("❌ 뉴스 저장 실패:", error);
    throw error;
  }
}

/**
 * 수동으로 특정 할일의 뉴스 생성 (토큰 인증 추가)
 */
export const manualGenerateNews = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).send("Unauthorized");
        return;
      }

      const token = authHeader.split("Bearer ")[1];

      // 토큰 검증
      const decodedToken = await admin.auth().verifyIdToken(token);
      const authenticatedUserId = decodedToken.uid;

      // 요청한 userId와 인증된 userId 비교
      const requestedUserId = req.query.userId as string;

      if (!requestedUserId) {
        res.status(400).send("userId 파라미터가 필요합니다");
        return;
      }

      if (authenticatedUserId !== requestedUserId) {
        res.status(403).send("Forbidden: Cannot access other user data");
        return;
      }

      // ✅ 검증 통과, 뉴스 생성 진행
      const taskId = req.query.taskId as string;
      const date =
        (req.query.date as string) || new Date().toISOString().split("T")[0];

      const userDoc = await db.collection("users").doc(requestedUserId).get();

      if (!userDoc.exists) {
        res.status(404).send("유저를 찾을 수 없습니다");
        return;
      }

      const userData = userDoc.data()!;

      // 할일 가져오기
      const todosDoc = await db
        .collection("users")
        .doc(requestedUserId)
        .collection("data")
        .doc("todos")
        .get();

      if (!todosDoc.exists) {
        res.send({ message: "할일이 없습니다" });
        return;
      }

      const todosData = todosDoc.data();
      const dateTodos = todosData?.[date];

      if (!dateTodos) {
        res.send({ message: `${date}에 할일이 없습니다` });
        return;
      }

      let targetTask = null;

      if (taskId) {
        // 특정 Task
        targetTask = dateTodos[taskId];
        if (!targetTask) {
          res.status(404).send("해당 할일을 찾을 수 없습니다");
          return;
        }
      } else {
        // 완료된 할일 중 첫 번째
        const tasks = Object.values(dateTodos);
        const completedTasks = tasks.filter((task: any) => task.completed);
        if (completedTasks.length === 0) {
          res.send({ message: "완료된 할일이 없습니다" });
          return;
        }
        targetTask = completedTasks[0];
      }

      // AI 뉴스 생성
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
          newsContent
        );
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
