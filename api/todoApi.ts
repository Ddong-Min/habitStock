import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { Task } from "@/types";
import { doc, setDoc } from "firebase/firestore";

export const addTodo = async (todo: Task, userId: string) => {
  try {
    await setDoc(doc(firestore, "todos", userId), {
      ...todo,
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding todo: ", error);
    return { success: false, msg: "Failed to add todo." };
  }
};

// ✅ one-time fetch
export const getTodosByDate = async (userId: string, date: string) => {
  const q = query(
    collection(firestore, "todos"),
    where("userId", "==", userId),
    where("date", "==", date) // todos are grouped by date
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ✅ real-time listener
export const listenTodosByDate = (
  userId: string,
  date: string,
  callback: (todos: any[]) => void
) => {
  const q = query(
    collection(firestore, "todos"),
    where("userId", "==", userId),
    where("date", "==", date)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const todos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(todos);
  });

  return unsubscribe; // call this to stop listening
};
