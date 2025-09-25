import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  orderBy,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { Task } from "@/types";
import { doc, setDoc } from "firebase/firestore";

export const addTodoFirebase = async (todo: Task, userId: string) => {
  try {
    // Use setDoc with doc() to set a document with a specific ID
    const docRef = doc(firestore, "users", userId, "todos", todo.id);
    await setDoc(docRef, {
      ...todo,
    });

    return { success: true, todoId: todo.id };
  } catch (error) {
    console.error("Error adding todo: ", error);
    return { success: false, msg: "Failed to add todo." };
  }
};

export const loadTodosFirebase = async (
  userId: string,
  dueDate: string
): Promise<Task[]> => {
  try {
    const todosCollection = collection(firestore, "users", userId, "todos");

    // Optional: order by date or creation time
    const q = query(
      todosCollection,
      where("dueDate", "==", dueDate),
      orderBy("id", "asc")
    );

    const querySnapshot = await getDocs(q);

    // Map documents to Task objects
    const todos: Task[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as Task;
      return {
        ...data,
        id: doc.id, // overwrite stored id with Firestore's ID
      };
    });

    return todos;
  } catch (error) {
    console.error("Error loading todos:", error);
    return [];
  }
};

export const deleteTaskFirebase = async (userId: string, todoId: string) => {
  try {
    const docRef = doc(firestore, "users", userId, "todos", todoId);
    await deleteDoc(docRef);
    console.log("Task deleted successfully:", todoId);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error };
  }
};

export const updateTaskFirebase = async (task: Task, userId: string) => {
  try {
    const docRef = doc(firestore, "users", userId, "todos", task.id);
    await updateDoc(docRef, { ...task });
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error };
  }
};
