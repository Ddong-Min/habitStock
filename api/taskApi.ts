import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { Task } from "@/types";

// 새로운 구조:
// users/{userId}/data/todos (문서)
// users/{userId}/data/buckets (문서)

// ✅ Add Task (either bucket or task)
export const addTaskFirebase = async (
  task: Task,
  userId: string,
  type: "buckets" | "todos"
) => {
  try {
    const docRef = doc(firestore, "users", userId, "data", type);
    const docSnap = await getDoc(docRef);

    const currentData = docSnap.exists() ? docSnap.data() : {};
    const dateKey = task.dueDate;

    // 해당 날짜의 tasks map 가져오기
    const dateTasks = currentData[dateKey] || {};

    // 새 task 추가
    dateTasks[task.id] = task;

    // 업데이트
    await setDoc(
      docRef,
      {
        ...currentData,
        [dateKey]: dateTasks,
      },
      { merge: true }
    );

    return { success: true, taskId: task.id };
  } catch (error) {
    console.error(`Error adding ${type}: `, error);
    return { success: false, msg: `Failed to add ${type}.` };
  }
};

// ✅ Load Tasks (filter by dueDate or by year)
export const loadTasksFirebase = async (
  userId: string,
  type: "buckets" | "todos",
  dueDate?: string
): Promise<Task[]> => {
  try {
    const docRef = doc(firestore, "users", userId, "data", type);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return [];
    }

    const allData = docSnap.data();
    const tasks: Task[] = [];

    if (type === "buckets" && dueDate) {
      // Year filter
      const year = parseInt(dueDate, 10);

      Object.keys(allData).forEach((dateKey) => {
        if (dateKey.startsWith(String(year))) {
          const dateTasks = allData[dateKey];
          Object.values(dateTasks).forEach((task) => {
            tasks.push(task as Task);
          });
        }
      });
    } else if (dueDate) {
      // Exact dueDate filter
      const dateTasks = allData[dueDate];
      if (dateTasks) {
        Object.values(dateTasks).forEach((task) => {
          tasks.push(task as Task);
        });
      }
    } else {
      // Load all tasks
      Object.keys(allData).forEach((dateKey) => {
        const dateTasks = allData[dateKey];
        Object.values(dateTasks).forEach((task) => {
          tasks.push(task as Task);
        });
      });
    }

    // Sort by dueDate and id
    tasks.sort((a, b) => {
      if (a.dueDate === b.dueDate) {
        return a.id.localeCompare(b.id);
      }
      return a.dueDate.localeCompare(b.dueDate);
    });

    return tasks;
  } catch (error) {
    console.error(`Error loading ${type}:`, error);
    return [];
  }
};

// ✅ Delete Task
export const deleteTaskFirebase = async (
  userId: string,
  type: "buckets" | "todos",
  taskId: string,
  dueDate: string
) => {
  try {
    const docRef = doc(firestore, "users", userId, "data", type);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, msg: `Document not found.` };
    }

    const currentData = docSnap.data();
    const dateTasks = currentData[dueDate];

    if (dateTasks && dateTasks[taskId]) {
      delete dateTasks[taskId];

      // 해당 날짜에 task가 더 이상 없으면 날짜 키도 삭제
      if (Object.keys(dateTasks).length === 0) {
        delete currentData[dueDate];
      } else {
        currentData[dueDate] = dateTasks;
      }

      await setDoc(docRef, currentData);
      return { success: true };
    }

    return { success: false, msg: `Task not found.` };
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return { success: false, msg: `Failed to delete ${type}.` };
  }
};

// ✅ Update Task
export const updateTaskFirebase = async (
  task: Task,
  userId: string,
  type: "buckets" | "todos",
  oldDueDate?: string
) => {
  try {
    const docRef = doc(firestore, "users", userId, "data", type);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, msg: `Document not found.` };
    }

    const currentData = docSnap.data();
    const prevDate = oldDueDate || task.dueDate;

    // 이전 날짜에서 task 삭제
    if (currentData[prevDate] && currentData[prevDate][task.id]) {
      delete currentData[prevDate][task.id];

      // 이전 날짜에 task가 더 이상 없으면 날짜 키도 삭제
      if (Object.keys(currentData[prevDate]).length === 0) {
        delete currentData[prevDate];
      }
    }

    // 새 날짜에 task 추가
    const newDateTasks = currentData[task.dueDate] || {};
    newDateTasks[task.id] = task;
    currentData[task.dueDate] = newDateTasks;

    await setDoc(docRef, currentData);
    return { success: true };
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    return { success: false, msg: `Failed to update ${type}.` };
  }
};
