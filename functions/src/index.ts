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
  date: string,
  incompleteTasks: any[],
  completedTasks: any[],
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

    const newPrice = Math.max(
      1,
      Math.round((currentPrice - totalChangePrice) * 10) / 10
    ); // 최소 1원
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
      high: currentPrice,
      low: low,
      volume: volume,
    };
    await stocksDocRef.set(stocksData, { merge: true });

    // 유저 프로필의 price 업데이트
    await db.collection("users").doc(userId).update({
      price: newPrice,
      lastUpdated: FieldValue.serverTimestamp(),
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

      const today = koreaTime.toISOString().split("T")[0]; // 한국 시간 기준 날짜

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
        const completedTasks = Object.values(todayTodos).filter(
          (task: any) => task.completed
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
          completedTasks,
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
    const completedTasks = Object.values(todayTodos).filter(
      (task: any) => task.completed
    );

    if (incompleteTasks.length === 0) {
      res.send({ message: "모든 할일 완료!" });
      return;
    }

    await calculateStockPenalty(
      userId,
      today,
      incompleteTasks,
      completedTasks,
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
