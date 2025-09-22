import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  orderBy,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { Task } from "@/types";
import { doc, setDoc } from "firebase/firestore";

export const addTodo = async (todo: Task, userId: string) => {
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

export const loadTodos = async (userId: string): Promise<Task[]> => {
  try {
    const todosCollection = collection(firestore, "users", userId, "todos");

    // Optional: order by date or creation time
    const q = query(todosCollection, orderBy("id", "asc"));

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
