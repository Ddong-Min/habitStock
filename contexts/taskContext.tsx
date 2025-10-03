// contexts/TasksContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Task, TasksByDate, TasksContextType, TasksState } from "../types";
import {
  addTaskFirebase,
  deleteTaskFirebase,
  loadTasksFirebase,
  updateTaskFirebase,
} from "@/api/taskApi";
import { useAuth } from "@/contexts/authContext";
import randomPriceGenerator from "@/handler/randomPriceGenerator";
import { useCalendar } from "./calendarContext";
const TasksContext = createContext<TasksContextType | undefined>(undefined);
const initialTasksState: TasksState = {
  easy: [],
  medium: [],
  hard: [],
  extreme: [],
};
export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    keyof TasksState | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isModifyDifficultySheet, setIsModifyDifficultySheet] = useState(false);
  const [isEditText, setIsEditText] = useState(false);
  const [isAddTask, setIsAddTask] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [taskType, setTaskType] = useState<"todos" | "buckets">("todos");
  const { user } = useAuth();
  const initialTaskTypeByDate: { todos: TasksByDate; buckets: TasksByDate } = {
    todos: {},
    buckets: {},
  };
  const [taskByDate, setTaskByDate] = useState<TasksByDate>(
    initialTaskTypeByDate[taskType]
  );

  const { selectedDate, changeSelectedDate } = useCalendar();
  // ✅ load tasks from firestore
  const loadTasks = async (dueDate: string) => {
    if (taskByDate[dueDate]) {
      return; // 이미 로드된 경우, 다시 로드하지 않음
    }
    //load the tododatawhich
    await loadTasksFirebase(user?.uid!, taskType, dueDate).then(
      (loadedTasks) => {
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
      }
    );
  };

  const chooseTaskId = (taskId: string | null) => {
    setSelectedTaskId(taskId);
  };

  const chooseDueDate = (date: string) => {
    changeSelectedDate(date);
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
    console.log(selectedDate);
    const taskList = newTaskByDate[selectedDate][selectedDifficulty]; //cf) shallow copy
    const taskIndex = taskList.findIndex(
      (task: Task) => task.id === selectedTaskId
    );
    return [newTaskByDate, taskIndex];
  };

  const startModify = (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState,
    text: string
  ) => {
    chooseTaskId(taskId);
    chooseDifficulty(difficulty);
    setSelectedText(text);
    setNewTaskText(text);
  };

  const finishModify = () => {
    setSelectedTaskId(null);
    setSelectedDifficulty(null);
    setSelectedText("");
    setNewTaskText("");
  };
  //add new task to firestore and localState
  const addNewTask = async (dueDate: string) => {
    if (!newTaskText.trim() || !user) return;
    const randomPrice = randomPriceGenerator(selectedDifficulty!);
    console.log("add new task called");
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      percentage: `+${randomPrice.toFixed(2)}%`,
      dueDate: dueDate,
      difficulty: selectedDifficulty!,
    };

    const res = await addTaskFirebase(newTask, user.uid!, taskType);

    //cut only year for buckets
    if (taskType === "buckets") {
      dueDate = dueDate.slice(0, 4);
    }
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
    finishModify();
    changeAddTaskState();
  };

  const deleteTask = async () => {
    if (!user || !selectedTaskId || !selectedDate || !selectedDifficulty)
      return;
    console.log("deleteTask called");
    const [newTaskByDate, taskIndex] = findIndex();
    if (taskIndex === -1) return;
    // if taskIndex is found

    let taskList = newTaskByDate[selectedDate][selectedDifficulty];
    taskList.splice(taskIndex, 1);

    setTaskByDate((prev) => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [selectedDifficulty!]: taskList,
      },
    }));
    // 3. Delete from Firestore
    await deleteTaskFirebase(user.uid!, taskType, selectedTaskId);
    finishModify();
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
      changeSelectedDate(newDate);
    }

    // Call API
    await updateTaskFirebase(updatedTask, user.uid!, taskType);

    // Update state
    setTaskByDate(newTaskByDate);
    setNewTaskText("");
    finishModify();
  };

  const completedTask = async (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState
  ) => {
    if (!user) return;
    const taskList = taskByDate[dueDate][difficulty];
    const taskIndex = taskList.findIndex((task: Task) => task.id === taskId);
    if (taskIndex === -1) return;

    const updatedTask = {
      ...taskList[taskIndex],
      completed: !taskList[taskIndex].completed,
      updatedAt: new Date().toISOString(),
    };
    const updatedTaskList = [...taskList];
    updatedTaskList[taskIndex] = updatedTask;

    // Update state optimistically
    setTaskByDate((prev) => ({
      ...prev,
      [dueDate]: {
        ...prev[dueDate],
        [difficulty]: updatedTaskList,
      },
    }));

    // Call API
    await updateTaskFirebase(updatedTask, user.uid!, taskType);
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

  const changeTaskType = (type: "todos" | "buckets") => {
    setTaskByDate(initialTaskTypeByDate[type]);
    setTaskType(type);
  };

  return (
    <TasksContext.Provider
      value={{
        taskType,
        taskByDate,
        newTaskText,
        selectedTaskId,
        isBottomSheetOpen,
        selectedDifficulty,
        showDatePicker,
        isModifyDifficultySheet,
        isAddTask,
        selectedText,
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
        completedTask,
        changeBottomSheetState,
        changeShowDatePicker,
        changeDifficultySheetState,
        changeAddTaskState,
        changeEditTextState,
        isEditText,
        changeTaskType,
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
