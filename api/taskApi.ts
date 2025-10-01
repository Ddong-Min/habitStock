import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { Task } from "@/types";

// ✅ Add Task (either bucket or task)
export const addTaskFirebase = async (
  task: Task,
  userId: string,
  type: "buckets" | "todos"
) => {
  try {
    const docRef = doc(firestore, "users", userId, type, task.id);
    await setDoc(docRef, { ...task });

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
  opts?: { dueDate?: string; year?: string }
): Promise<Task[]> => {
  try {
    const tasksCollection = collection(firestore, "users", userId, type);

    let q;

    if (opts?.year) {
      const year = parseInt(opts.year, 10);
      // Year filter
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      q = query(
        tasksCollection,
        where("dueDate", ">=", startDate),
        where("dueDate", "<=", endDate),
        orderBy("dueDate", "asc")
      );
    } else if (opts?.dueDate) {
      // Exact dueDate filter
      q = query(
        tasksCollection,
        where("dueDate", "==", opts.dueDate),
        orderBy("id", "asc")
      );
    } else {
      // Default: load all ordered by dueDate
      q = query(tasksCollection, orderBy("dueDate", "asc"));
    }

    const querySnapshot = await getDocs(q);

    const tasks: Task[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Task;
      return {
        ...data,
        id: docSnap.id,
      };
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
  taskId: string
) => {
  try {
    const docRef = doc(firestore, "users", userId, type, taskId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return { success: false, msg: `Failed to delete ${type}.` };
  }
};

// ✅ Update Task
export const updateTaskFirebase = async (
  task: Task,
  userId: string,
  type: "buckets" | "todos"
) => {
  try {
    const docRef = doc(firestore, "users", userId, type, task.id);
    await updateDoc(docRef, { ...task });
    return { success: true };
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    return { success: false, msg: `Failed to update ${type}.` };
  }
};
