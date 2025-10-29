import { firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  deleteField,
  query,
  where,
  getDocs,
} from "@react-native-firebase/firestore";
import { Task } from "@/types";

// ✅ 날짜별 문서 구조: users/{userId}/todos/{date}

// 🔥 특정 날짜의 Task 실시간 구독
export const subscribeToTasksByDate = (
  userId: string,
  dueDate: string,
  onUpdate: (tasks: Task[]) => void
) => {
  console.log("👥 Subscribing to tasks for date:", dueDate);

  // ✅ 날짜별 문서 참조
  const docRef = doc(firestore, "users", userId, "todos", dueDate);

  let lastTasksJson = "";

  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      const fromCache = snap.metadata.fromCache;
      console.log(`📡 Update from ${fromCache ? "CACHE ✅" : "SERVER 🌐"}`);

      if (!snap.exists()) {
        const tasksJson = "[]";
        if (lastTasksJson !== tasksJson) {
          lastTasksJson = tasksJson;
          onUpdate([]);
        }
        return;
      }

      const data = snap.data()!;
      const tasks: Task[] = [];

      // 문서 내 모든 필드가 task
      Object.values(data).forEach((task) => {
        tasks.push(task as Task);
      });

      tasks.sort((a, b) => {
        if (a.dueDate === b.dueDate) return a.id.localeCompare(b.id);
        return a.dueDate.localeCompare(b.dueDate);
      });

      const tasksJson = JSON.stringify(tasks);

      if (tasksJson !== lastTasksJson) {
        lastTasksJson = tasksJson;
        onUpdate(tasks);
      }
    },
    (error) => {
      console.error("Error in snapshot listener:", error);
      onUpdate([]);
      lastTasksJson = "";
    }
  );

  return unsubscribe;
};

// Task 가져오기 (단일)
export const getTask = async (
  userId: string,
  dueDate: string,
  taskId: string
): Promise<Task | null> => {
  try {
    const docRef = doc(firestore, "users", userId, "todos", dueDate);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();

    if (!data || !data[taskId]) {
      return null;
    }

    return data[taskId] as Task;
  } catch (error) {
    console.error("Error getting task:", error);
    return null;
  }
};

// Task 생성/수정
export const saveTaskFirebase = async (
  userId: string,
  task: Task
): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "todos", task.dueDate);

    // merge: true로 문서가 없으면 생성, 있으면 업데이트
    await setDoc(
      docRef,
      {
        [task.id]: task,
      },
      { merge: true }
    );

    console.log("✅ Task saved:", task.id);
  } catch (error) {
    console.error("Error saving task:", error);
    throw error;
  }
};

// Task 삭제
export const deleteTaskFirebase = async (
  userId: string,
  dueDate: string,
  taskId: string
): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "todos", dueDate);

    await updateDoc(docRef, {
      [taskId]: deleteField(),
    });

    console.log("✅ Task deleted:", taskId);

    // 문서가 비어있는지 확인하고 삭제 (선택사항)
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Object.keys(data ?? {}).length === 0) {
        await deleteDoc(docRef);
        console.log("🗑️ Empty document deleted:", dueDate);
      }
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// 여러 날짜의 Task 가져오기
export const getTasksByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Task[]> => {
  try {
    const tasks: Task[] = [];

    // 날짜 범위 생성 (startDate부터 endDate까지)
    const dates = generateDateRange(startDate, endDate);

    // 각 날짜별로 문서 가져오기
    const promises = dates.map(async (date) => {
      const docRef = doc(firestore, "users", userId, "todos", date);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        Object.values(data ?? {}).forEach((task) => {
          tasks.push(task as Task);
        });
      }
    });

    await Promise.all(promises);

    tasks.sort((a, b) => {
      if (a.dueDate === b.dueDate) return a.id.localeCompare(b.id);
      return a.dueDate.localeCompare(b.dueDate);
    });

    return tasks;
  } catch (error) {
    console.error("Error getting tasks by date range:", error);
    return [];
  }
};

// 날짜 범위 생성 헬퍼 함수
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// 특정 날짜 문서 전체 삭제 (필요시)
export const deleteAllTasksByDate = async (
  userId: string,
  dueDate: string
): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "todos", dueDate);
    await deleteDoc(docRef);
    console.log("✅ All tasks deleted for date:", dueDate);
  } catch (error) {
    console.error("Error deleting all tasks:", error);
    throw error;
  }
};
