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
} from "@react-native-firebase/firestore";
import { Task } from "@/types";

// ✅ Firestore Modular API 사용

// 🔥 특정 날짜의 Task 실시간 구독
export const subscribeToTasksByDate = (
  userId: string,
  dueDate: string,
  onUpdate: (tasks: Task[]) => void
) => {
  console.log("👥 Subscribing to tasks for date:", dueDate);

  // ✅ Modular 방식으로 문서 참조 생성
  const docRef = doc(firestore, "users", userId, "data", "todos");

  let lastTasksJson = "";

  // ✅ onSnapshot 사용
  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      const fromCache = snap.metadata.fromCache;
      console.log(`📡 Update from ${fromCache ? "CACHE ✅" : "SERVER 🌐"}`);

      if (!snap.exists()) {
        if (lastTasksJson !== "") {
          lastTasksJson = "";
          onUpdate([]);
        }
        return;
      }

      const allData = snap.data()!;
      const dateTasks = allData[dueDate];
      const tasks: Task[] = [];

      if (dateTasks) {
        Object.values(dateTasks).forEach((task) => {
          tasks.push(task as Task);
        });
      }

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
    const docRef = doc(firestore, "users", userId, "data", "todos");
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    const allData = snap.data();
    const dateTasks = allData?.[dueDate];

    if (!dateTasks || !dateTasks[taskId]) {
      return null;
    }

    return dateTasks[taskId] as Task;
  } catch (error) {
    console.error("Error getting task:", error);
    return null;
  }
};

// Task 생성/수정
export const saveTask = async (userId: string, task: Task): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "todos");

    // ✅ Modular API에서는 updateDoc 사용
    await updateDoc(docRef, {
      [`${task.dueDate}.${task.id}`]: task,
    });

    console.log("✅ Task saved:", task.id);
  } catch (error) {
    console.error("Error saving task:", error);
    throw error;
  }
};

// Task 삭제
export const deleteTask = async (
  userId: string,
  dueDate: string,
  taskId: string
): Promise<void> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", "todos");

    // ✅ deleteField() 사용
    await updateDoc(docRef, {
      [`${dueDate}.${taskId}`]: deleteField(),
    });

    console.log("✅ Task deleted:", taskId);
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
    const docRef = doc(firestore, "users", userId, "data", "todos");
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return [];
    }

    const allData = snap.data();
    const tasks: Task[] = [];

    if (!allData) {
      return [];
    }

    Object.keys(allData).forEach((date) => {
      if (date >= startDate && date <= endDate) {
        Object.values(allData[date]).forEach((task) => {
          tasks.push(task as Task);
        });
      }
    });

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
