// contexts/TasksContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Task, TasksByDate, TasksState } from "../types";
import { Gaussian } from "ts-gaussian";
import {
  addTodoFirebase,
  deleteTaskFirebase,
  loadTodosFirebase,
  toggleTodoFirebase,
  updateTaskFirebase,
} from "@/api/todoApi";
import { useAuth } from "@/contexts/authContext";

const initialTasks: TasksState = {
  easy: [],
  medium: [],
  hard: [],
  extreme: [],
};

type TasksContextType = {
  tasks: TasksState;
  newTaskText: string;
  newTaskDifficulty: keyof TasksState | null;
  bottomSheetIndex: string | null;
  modifyIndex: string | null;
  modifyDifficulty: string | null;
  taskByDate: TasksByDate;
  showDatePicker: boolean;
  handleToggleTask: (taskId: string) => void;
  changeTasks: (difficulty: keyof TasksState, task: Task) => void;
  addNewTask: (dueDate: string) => Promise<void>;
  loadTasks: (dueDate: string) => Promise<void>;
  makeNewTask: (text: string) => void;
  selectNewTaskDifficulty: (difficulty: keyof TasksState | null) => void;
  clickSubMenu: (index: string | null) => void;
  deleteTask: (taskId: string) => Promise<void>;
  saveEditedTask: () => Promise<void>;
  startModify: (taskId: string | null) => void;
  changeModifyDiffIndex: (taskId: string | null) => void;
  changeDifficulty: (changedDiff: keyof TasksState) => Promise<void>;
  changeShowDatePicker: () => void;
  changeModifyIndex: (taskId: string | null) => void;
  changeDueDate: (newDate: string) => void;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<TasksState>(initialTasks);
  const [taskByDate, setTaskByDate] = useState<TasksByDate>({});

  const [newTaskDifficulty, setNewTaskDifficulty] = useState<
    keyof TasksState | null
  >(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [bottomSheetIndex, setbottomSheetIndex] = useState<string | null>(null);
  const [modifyIndex, setModifyIndex] = useState<string | null>(null);
  const [modifyDifficulty, setModifyDifficulty] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { user } = useAuth();

  // ✅ toggle task
  const handleToggleTask = (taskId: string) => {
    setTaskByDate((currentTaskByDate) => {
      const newTaskByDate = JSON.parse(JSON.stringify(currentTaskByDate));

      for (const date in newTaskByDate) {
        const dayTasks = newTaskByDate[date];

        for (const difficulty in dayTasks) {
          const taskList = dayTasks[difficulty as keyof TasksState];
          const taskIndex = taskList.findIndex(
            (task: Task) => task.id === taskId
          );

          if (taskIndex !== -1) {
            const updatedTask = {
              ...taskList[taskIndex],
              completed: !taskList[taskIndex].completed,
            };

            // update state
            taskList[taskIndex] = updatedTask;

            // update firestore
            toggleTodoFirebase(user!.uid!, taskId, updatedTask.completed);

            return newTaskByDate; // stop searching
          }
        }
      }

      return newTaskByDate;
    });
  };

  // ✅ add a task to state
  const changeTasks = (difficulty: keyof TasksState, task: Task) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [difficulty]: [...prevTasks[difficulty], task],
    }));
  };

  // ✅ add new task
  const addNewTask = async (dueDate: string) => {
    if (!newTaskText.trim()) return;

    const randomWeight =
      newTaskDifficulty === "extreme"
        ? 4
        : newTaskDifficulty === "hard"
        ? 3
        : newTaskDifficulty === "medium"
        ? 2
        : 1;
    const gaussian = new Gaussian(randomWeight, 1);

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      percentage: `+${gaussian.ppf(Math.random()).toFixed(3).toString()}%`,
      dueDate: dueDate,
      difficulty: newTaskDifficulty!,
    };

    await addTodoFirebase(newTask, user!.uid!).then((res) => {
      if (res.success) {
        changeTasks(newTaskDifficulty!, newTask);
      } else {
        console.error(res.msg);
      }
    });

    setNewTaskText("");
    setNewTaskDifficulty(null);
  };

  // ✅ load tasks from firestore
  const loadTasks = async (dueDate: string) => {
    if (taskByDate[dueDate]) {
      return; // 이미 로드된 경우, 다시 로드하지 않음
    }
    await loadTodosFirebase(user?.uid!, dueDate).then((loadedTasks) => {
      const groupedTasks: TasksState = {
        easy: [],
        medium: [],
        hard: [],
        extreme: [],
      };
      loadedTasks.forEach((task) => {
        groupedTasks[task.difficulty].push(task);
      });
      setTasks(groupedTasks);
      setTaskByDate((prev) => ({ ...prev, [dueDate]: groupedTasks }));
    });
  };

  // ✅ setters
  const makeNewTask = (text: string) => setNewTaskText(text);

  const selectNewTaskDifficulty = (difficulty: keyof TasksState | null) =>
    setNewTaskDifficulty(difficulty);

  const clickSubMenu = (index: string | null) => {
    setbottomSheetIndex(index);
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    setTasks((currentTasks) => {
      const newTasks = JSON.parse(JSON.stringify(currentTasks));

      for (const difficulty in newTasks) {
        const taskList = newTasks[difficulty as keyof TasksState];
        const taskIndex = taskList.findIndex(
          (task: Task) => task.id === taskId
        );

        if (taskIndex !== -1) {
          // remove from local state
          taskList.splice(taskIndex, 1);

          // delete from Firestore
          deleteTaskFirebase(user.uid!, taskId);
          break;
        }
      }

      return newTasks;
    });
  };

  const startModify = (taskId: string | null) => {
    for (const difficulty in tasks) {
      const task = tasks[difficulty as keyof TasksState].find(
        (t) => t.id === bottomSheetIndex
      );
      if (task) {
        setModifyIndex(taskId);
        setNewTaskText(task.text); // pre-fill input
        setNewTaskDifficulty(task.difficulty); // open the correct header
        break;
      }
    }
  };

  const saveEditedTask = async () => {
    if (!modifyIndex || !user || !newTaskDifficulty) return;
    const taskList = tasks[newTaskDifficulty];
    const taskIndex = taskList.findIndex((t) => t.id === modifyIndex);

    if (taskIndex === -1) return;

    const updatedTask = {
      ...taskList[taskIndex],
      text: newTaskText,
      updatedAt: new Date().toISOString(),
    };

    // Call API
    const res = await updateTaskFirebase(updatedTask, user.uid!);
    if (!res.success) {
      console.error(res.error);
      return;
    }

    // Update local state
    setTasks((prev) => ({
      ...prev,
      [newTaskDifficulty]: prev[newTaskDifficulty].map((t) =>
        t.id === modifyIndex ? updatedTask : t
      ),
    }));

    setNewTaskText("");
    setNewTaskDifficulty(null);
    setModifyIndex(null);
  };

  const changeModifyDiffIndex = (taskId: string | null) => {
    setModifyDifficulty(taskId);
  };

  const changeDifficulty = async (changedDiff: keyof TasksState) => {
    if (!modifyDifficulty || !user) return;

    let originalDiff: keyof TasksState | null = null;
    let taskToMove: Task | null = null;

    // 1️⃣ Find task in its original difficulty
    for (const diff in tasks) {
      const found = tasks[diff as keyof TasksState].find(
        (t) => t.id === modifyDifficulty
      );
      if (found) {
        originalDiff = diff as keyof TasksState;
        taskToMove = found;
        break;
      }
    }

    if (!originalDiff || !taskToMove) return;

    // 2️⃣ Update task with new difficulty
    const updatedTask = {
      ...taskToMove,
      difficulty: changedDiff,
      updatedAt: new Date().toISOString(),
    };

    // 3️⃣ Update Firestore
    const res = await updateTaskFirebase(updatedTask, user.uid!);
    if (!res.success) {
      console.error(res.error);
      return;
    }

    // 4️⃣ Update local state
    setTasks((prev) => ({
      ...prev,
      [originalDiff!]: prev[originalDiff!].filter(
        (t) => t.id !== modifyDifficulty
      ),
      [changedDiff]: [...prev[changedDiff], updatedTask],
    }));

    // 5️⃣ Reset
    setModifyDifficulty(null);
  };

  const changeShowDatePicker = () => {
    setShowDatePicker((prev) => !prev);
  };

  const changeModifyIndex = (taskId: string | null) => {
    setModifyIndex(taskId);
  };

  const changeDueDate = (newDate: string) => {
    if (!newDate || !user || !modifyIndex) return;
    setTaskByDate((prev) => {
      // clone prev state
      const newTaskByDate: TasksByDate = JSON.parse(JSON.stringify(prev));

      // find the old date and task
      let oldDate: string | null = null;
      let foundTask: Task | null = null;

      for (const date in newTaskByDate) {
        for (const difficulty in newTaskByDate[date]) {
          const taskList = newTaskByDate[date][difficulty as keyof TasksState];
          const taskIndex = taskList.findIndex((t) => t.id === modifyIndex);
          if (taskIndex !== -1) {
            // found the task
            foundTask = taskList[taskIndex];
            oldDate = date;

            // remove from old date
            taskList.splice(taskIndex, 1);
            break;
          }
        }
        if (foundTask) break;
      }

      if (foundTask) {
        // update dueDate
        foundTask.dueDate = newDate;

        // ensure newDate group exists
        if (!newTaskByDate[newDate]) {
          newTaskByDate[newDate] = {
            easy: [],
            medium: [],
            hard: [],
            extreme: [],
          };
        }
        newTaskByDate[newDate][foundTask.difficulty].push(foundTask);
        updateTaskFirebase(foundTask, user.uid!);
      }

      return newTaskByDate;
    });
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        newTaskText,
        newTaskDifficulty,
        bottomSheetIndex,
        modifyIndex,
        modifyDifficulty,
        taskByDate,
        showDatePicker,
        handleToggleTask,
        changeTasks,
        addNewTask,
        loadTasks,
        makeNewTask,
        selectNewTaskDifficulty,
        clickSubMenu,
        deleteTask,
        saveEditedTask,
        startModify,
        changeModifyDiffIndex,
        changeDifficulty,
        changeShowDatePicker,
        changeModifyIndex,
        changeDueDate,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks must be used inside TasksProvider");
  return context;
};
