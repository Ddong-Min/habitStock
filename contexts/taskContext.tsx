import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Task, TasksByDate, TasksContextType, TasksState } from "../types";
import {
  addTaskFirebase,
  deleteTaskFirebase,
  updateTaskFirebase,
  subscribeToTasksByDate, // 🔥 NEW
} from "@/api/taskApi";
import { useAuth } from "@/contexts/authContext";
import randomPriceGenerator from "@/handler/randomPriceGenerator";
import { useCalendar } from "./calendarContext";
import { useStock } from "./stockContext";

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
  const { changeStockAfterNews } = useStock();
  const initialTaskTypeByDate: { todos: TasksByDate; buckets: TasksByDate } = {
    todos: {},
    buckets: {},
  };
  const [taskByDate, setTaskByDate] = useState<TasksByDate>(
    initialTaskTypeByDate[taskType]
  );

  const { selectedDate, changeSelectedDate } = useCalendar();
  const { changeStockData } = useStock();

  // 🔥 NEW: 실시간 구독 추가 - Firebase Functions가 수정하면 즉시 UI 업데이트!
  useEffect(() => {
    console.log(user?.uid, selectedDate);
    if (!user?.uid || !selectedDate) return;

    const unsubscribe = subscribeToTasksByDate(
      user.uid,
      selectedDate,
      (tasks) => {
        // tasks를 difficulty별로 그룹화
        const grouped: TasksState = {
          easy: [],
          medium: [],
          hard: [],
          extreme: [],
        };

        tasks.forEach((task) => {
          grouped[task.difficulty].push(task);
        });

        setTaskByDate((prev) => ({
          ...prev,
          [selectedDate]: grouped,
        }));
        console.log("Tasks updated from subscription:", tasks);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, selectedDate]);

  const chooseTaskId = (taskId: string | null) => {
    setSelectedTaskId(taskId);
  };

  const chooseDueDate = (date: string) => {
    changeSelectedDate(date);
  };

  const chooseDifficulty = (difficulty: keyof TasksState) => {
    setSelectedDifficulty(difficulty);
  };

  const putTaskText = (text: string) => setNewTaskText(text);

  const findIndex = () => {
    if (!selectedDate || !selectedDifficulty || !user) return [-1, []];
    const newTaskByDate = JSON.parse(JSON.stringify(taskByDate));
    console.log(selectedDate);
    const taskList = newTaskByDate[selectedDate][selectedDifficulty];
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

  const addNewTask = async (dueDate: string) => {
    if (!newTaskText.trim() || !user) return;
    const { randomPrice, randomPercent, priceChange } = randomPriceGenerator(
      selectedDifficulty!,
      user.price ?? 100
    );
    console.log("add new task called");
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      percentage: randomPercent,
      priceChange: priceChange,
      dueDate: dueDate,
      difficulty: selectedDifficulty!,
      updatedDate: new Date().toISOString(),
      appliedPriceChange: 0,
      appliedPercentage: 0,
    };

    const res = await addTaskFirebase(newTask, user.uid);

    // 🔥 onSnapshot이 자동으로 UI 업데이트하므로 수동 업데이트 제거!
    // setTaskByDate 호출 삭제됨

    if (!res.success) {
      console.error(res.msg);
    }
    finishModify();
    changeAddTaskState();
  };

  const deleteTask = async () => {
    if (!user || !selectedTaskId || !selectedDate || !selectedDifficulty)
      return;
    const [newTaskByDate, taskIndex] = findIndex();
    if (taskIndex === -1) return;

    const updatedData =
      newTaskByDate[selectedDate][selectedDifficulty][taskIndex];
    if (updatedData.completed) {
      updatedData.updatedDate = new Date().toISOString().split("T")[0];
      updatedData.completed = false;
      changeStockData(updatedData).then((result) => {
        if (result && !result.success) {
          console.error(result.msg);
        }
      });
    }

    // 🔥 onSnapshot이 자동으로 UI 업데이트하므로 수동 업데이트 제거!
    // setTaskByDate 호출 삭제됨

    await deleteTaskFirebase(user.uid!, selectedTaskId, selectedDate);
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
    } else if (mode === "difficulty") {
      const { randomPrice, randomPercent, priceChange } = randomPriceGenerator(
        updatedTask.difficulty,
        user.price ?? 100
      );
      updatedTask.difficulty = edit as keyof TasksState;
      updatedTask.updatedAt = new Date().toISOString();
      updatedTask.percentage = randomPercent;
      updatedTask.priceChange = priceChange;
    } else if (mode === "dueDate") {
      const newDate = edit;
      updatedTask.dueDate = newDate;
      updatedTask.updatedAt = new Date().toISOString();
      changeSelectedDate(newDate);
    }

    // 🔥 onSnapshot이 자동으로 UI 업데이트하므로 수동 업데이트 제거!
    await updateTaskFirebase(updatedTask, user.uid!);

    setNewTaskText("");
    finishModify();
  };

  const completedTask = async (
    taskId: string,
    difficulty: keyof TasksState
  ) => {
    if (!user) return;
    const taskList = taskByDate[selectedDate][difficulty];
    const taskIndex = taskList.findIndex((task: Task) => task.id === taskId);
    if (taskIndex === -1) return;

    const updatedTask = {
      ...taskList[taskIndex],
      completed: !taskList[taskIndex].completed,
      updatedDate: new Date().toISOString().split("T")[0],
      appliedPriceChange: taskList[taskIndex].completed
        ? Math.round(
            (taskList[taskIndex].appliedPriceChange -
              taskList[taskIndex].priceChange) *
              10
          ) / 10
        : Math.round(
            (taskList[taskIndex].appliedPriceChange +
              taskList[taskIndex].priceChange) *
              10
          ) / 10,
      appliedPercentage: taskList[taskIndex].completed
        ? Math.round(
            (taskList[taskIndex].appliedPercentage -
              taskList[taskIndex].percentage) *
              10
          ) / 10
        : Math.round(
            (taskList[taskIndex].appliedPercentage +
              taskList[taskIndex].percentage) *
              10
          ) / 10,
    };

    // 🔥 Optimistic UI Update는 유지 (즉각 반응을 위해)
    const updatedTaskList = [...taskList];
    updatedTaskList[taskIndex] = updatedTask;

    setTaskByDate((prev) => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [difficulty]: updatedTaskList,
      },
    }));

    // API 호출 - onSnapshot이 다시 한번 업데이트하지만 같은 데이터라 문제없음
    await updateTaskFirebase(updatedTask, user.uid!, taskType);
    changeStockData(updatedTask).then((result) => {
      if (result && !result.success) {
        console.error(result.msg);
      }
    });
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

  const changePriceAfterNews = async (
    taskId: string,
    difficulty: keyof TasksState
  ) => {
    if (!user || !taskId || !selectedDate) return;
    const taskList = taskByDate[selectedDate][difficulty];
    const taskIndex = taskList.findIndex((task: Task) => task.id === taskId);

    if (taskIndex === -1) return;

    const foundTask = taskList[taskIndex];

    // 증가량 계산 (0.5배)
    const priceIncrease = Math.round(foundTask.priceChange * 0.5 * 10) / 10;
    const percentageIncrease = Math.round(foundTask.percentage * 0.5 * 10) / 10;

    // Task 업데이트 (1.5배)
    const updatedTask = {
      ...foundTask,
      priceChange: Math.round(foundTask.priceChange * 1.5 * 10) / 10,
      percentage: Math.round(foundTask.percentage * 1.5 * 10) / 10,
      appliedPriceChange:
        Math.round(foundTask.appliedPriceChange * 1.5 * 10) / 10,
      appliedPercentage:
        Math.round(foundTask.appliedPercentage * 1.5 * 10) / 10,
      updatedAt: new Date().toISOString(),
    };
    const updatedTaskList = [...taskList];
    updatedTaskList[taskIndex] = updatedTask;

    setTaskByDate((prev) => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [difficulty]: updatedTaskList,
      },
    }));

    await updateTaskFirebase(updatedTask, user.uid!, taskType);

    // 🔥 완료된 task인 경우에만 stock 업데이트
    if (foundTask.completed) {
      await changeStockAfterNews(priceIncrease, percentageIncrease);
    }
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
        changePriceAfterNews,
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
