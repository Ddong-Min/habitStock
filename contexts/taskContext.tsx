// contexts/TasksContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Task, TasksByDate, TasksState } from "../types";
import {
  addTodoFirebase,
  deleteTaskFirebase,
  loadTodosFirebase,
  updateTaskFirebase,
} from "@/api/todoApi";
import { useAuth } from "@/contexts/authContext";
import randomPriceGenerator from "@/handler/randomPriceGenerator";
type TasksContextType = {
  taskByDate: TasksByDate;
  newTaskText: string;
  selectedTaskId: string | null;
  isBottomSheetOpen: boolean;
  selectedDifficulty: keyof TasksState | null;
  selectedDate: string;
  showDatePicker: boolean;
  isModifyDifficultySheet: boolean;
  isAddTask: boolean;
  isEditText: boolean;
  chooseTaskId: (taskId: string | null) => void;
  chooseDueDate: (date: string) => void;
  chooseDifficulty: (difficulty: keyof TasksState) => void;
  loadTasks: (dueDate: string) => Promise<void>;
  putTaskText: (text: string) => void;
  startModify: (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState
  ) => void;
  finishModify: () => void;
  addNewTask: (dueDate: string) => Promise<void>;
  deleteTask: () => Promise<void>;
  editTask: (
    mode: "task" | "difficulty" | "dueDate" | "completed",
    edit: string
  ) => void;
  changeBottomSheetState: () => void;
  changeShowDatePicker: () => void;
  changeDifficultySheetState: () => void;
  changeAddTaskState: () => void;
  changeEditTextState: () => void;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);
const initialTasksState: TasksState = {
  easy: [],
  medium: [],
  hard: [],
  extreme: [],
};
export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [taskByDate, setTaskByDate] = useState<TasksByDate>({});
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    keyof TasksState | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isModifyDifficultySheet, setIsModifyDifficultySheet] = useState(false);
  const [isEditText, setIsEditText] = useState(false);
  const [isAddTask, setIsAddTask] = useState(false);
  const { user } = useAuth();

  // ✅ load tasks from firestore
  const loadTasks = async (dueDate: string) => {
    if (taskByDate[dueDate]) {
      return; // 이미 로드된 경우, 다시 로드하지 않음
    }
    //load the tododatawhich
    await loadTodosFirebase(user?.uid!, dueDate).then((loadedTasks) => {
      //initialize the date group if not exists, which type is TasksByDate
      const groupedTasks: TasksByDate = {
        [dueDate]: {
          easy: [],
          medium: [],
          hard: [],
          extreme: [],
        },
      };

      loadedTasks.forEach((task) => {
        groupedTasks[dueDate][task.difficulty].push(task);
      });
      setTaskByDate((prev) => ({ ...prev, ...groupedTasks }));
    });
  };

  const chooseTaskId = (taskId: string | null) => {
    setSelectedTaskId(taskId);
  };

  const chooseDueDate = (date: string) => {
    setSelectedDate(date);
  };

  const chooseDifficulty = (difficulty: keyof TasksState) => {
    setSelectedDifficulty(difficulty);
  };

  //function using when user inut text for make new task or edit task
  const putTaskText = (text: string) => setNewTaskText(text);

  // find the index of selected task in tasks state
  const findIndex = () => {
    if (!selectedDate || !selectedDifficulty || !user) return [-1, []];
    const newTaskByDate = JSON.parse(JSON.stringify(taskByDate));
    const taskList = newTaskByDate[selectedDate][selectedDifficulty]; //cf) shallow copy
    const taskIndex = taskList.findIndex(
      (task: Task) => task.id === selectedTaskId
    );
    return [newTaskByDate, taskIndex];
  };

  const startModify = (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState
  ) => {
    chooseTaskId(taskId);
    chooseDueDate(dueDate);
    chooseDifficulty(difficulty);

    console.log(selectedDate, selectedDifficulty, selectedTaskId);
  };

  const finishModify = () => {
    setSelectedTaskId(null);
    setSelectedDate("");
    setSelectedDifficulty(null);
  };
  //add new task to firestore and localState
  const addNewTask = async (dueDate: string) => {
    if (!newTaskText.trim() || !user) return;
    const randomPrice = randomPriceGenerator(selectedDifficulty!);

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      percentage: `+${randomPrice.toFixed(2)}%`,
      dueDate: dueDate,
      difficulty: selectedDifficulty!,
    };

    const res = await addTodoFirebase(newTask, user.uid!);

    if (res.success) {
      setTaskByDate((prev) => {
        const prevTasks = prev[dueDate] ?? initialTasksState;

        return {
          ...prev,
          [dueDate]: {
            ...prevTasks,
            [newTask.difficulty]: [
              ...(prevTasks[newTask.difficulty] ?? []),
              newTask,
            ],
          },
        };
      });
    } else {
      console.error(res.msg);
    }

    setNewTaskText("");
    finishModify();
    changeAddTaskState();
  };

  const deleteTask = async () => {
    if (!user || !selectedTaskId || !selectedDate || !selectedDifficulty)
      return;
    console.log("delete task called");
    const [taskIndex, taskList] = findIndex();
    if (taskIndex === -1) return;
    // if taskIndex is found
    taskList.splice(taskIndex, 1);
    setTaskByDate((prev) => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [selectedDifficulty!]: taskList,
      },
    }));
    // 3. Delete from Firestore
    await deleteTaskFirebase(user.uid!, selectedTaskId);
    finishModify;
  };

  const editTask = async (
    mode: "task" | "difficulty" | "dueDate" | "completed",
    edit: string
  ) => {
    if (!user || !selectedTaskId || !selectedDate || !selectedDifficulty)
      return;

    const [newTaskByDate, taskIndex] = findIndex();
    if (taskIndex === -1) return;

    let taskList = newTaskByDate[selectedDate][selectedDifficulty];
    let updatedTask = { ...taskList[taskIndex] };

    if (mode === "task") {
      updatedTask.text = edit;
      updatedTask.updatedAt = new Date().toISOString();
      changeEditTextState();
      taskList[taskIndex] = updatedTask;
    } else if (mode === "difficulty") {
      const oldDifficulty = updatedTask.difficulty;
      updatedTask.difficulty = edit as keyof TasksState;
      updatedTask.updatedAt = new Date().toISOString();

      // remove from old list
      taskList.splice(taskIndex, 1);

      // add to new difficulty list
      if (!newTaskByDate[selectedDate][updatedTask.difficulty]) {
        newTaskByDate[selectedDate][updatedTask.difficulty] = [];
      }
      newTaskByDate[selectedDate][updatedTask.difficulty].push(updatedTask);
    } else if (mode === "dueDate") {
      const oldDate = selectedDate;
      const newDate = edit;
      updatedTask.dueDate = newDate;
      updatedTask.updatedAt = new Date().toISOString();

      // remove from old date list
      taskList.splice(taskIndex, 1);

      // create new date if missing
      if (!newTaskByDate[newDate]) {
        newTaskByDate[newDate] = { ...initialTasksState };
      }

      // push task to new date
      newTaskByDate[newDate][updatedTask.difficulty].push(updatedTask);
      setSelectedDate(newDate);
    } else if (mode === "completed") {
      updatedTask.completed = !updatedTask.completed;
      updatedTask.updatedAt = new Date().toISOString();
      taskList[taskIndex] = updatedTask;
    }

    // Call API
    await updateTaskFirebase(updatedTask, user.uid!);

    // Update state
    setTaskByDate(newTaskByDate);
    setNewTaskText("");
    finishModify();
  };

  const changeBottomSheetState = () => {
    setIsBottomSheetOpen((prev) => !prev);
  };
  const changeShowDatePicker = () => {
    setShowDatePicker((prev) => !prev);
  };

  const changeDifficultySheetState = () => {
    setIsModifyDifficultySheet((prev) => !prev);
  };

  const changeAddTaskState = () => {
    setIsAddTask((prev) => !prev);
  };

  const changeEditTextState = () => {
    setIsEditText((prev) => !prev);
  };

  return (
    <TasksContext.Provider
      value={{
        taskByDate,
        newTaskText,
        selectedTaskId,
        isBottomSheetOpen,
        selectedDifficulty,
        selectedDate,
        showDatePicker,
        isModifyDifficultySheet,
        isAddTask,
        chooseTaskId,
        chooseDueDate,
        chooseDifficulty,
        loadTasks,
        putTaskText,
        startModify,
        finishModify,
        addNewTask,
        deleteTask,
        editTask,
        changeBottomSheetState,
        changeShowDatePicker,
        changeDifficultySheetState,
        changeAddTaskState,
        changeEditTextState,
        isEditText,
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
