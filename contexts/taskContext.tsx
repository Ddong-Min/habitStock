import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Task, TasksByDate, TasksContextType, TasksState } from "../types";
import {
  saveTaskFirebase,
  deleteTaskFirebase,
  subscribeToTasksByDate, // 🔥 NEW
} from "@/api/taskApi";
import { useAuth } from "@/contexts/authContext";
import randomPriceGenerator from "@/handler/randomPriceGenerator";
import { useCalendar } from "./calendarContext";
import { useStock } from "./stockContext";
import { customLogEvent } from "@/events/appEvent";

const TasksContext = createContext<TasksContextType | undefined>(undefined);
export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [newTaskText, setNewTaskText] = useState(""); // 새로 추가할 Task의 내용
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null); //수정/삭제할 Task의 ID
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false); //수정,난이도 변경, 날짜변경, 삭제 BottomSheet 열림 여부
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    keyof TasksState | null
  >(null); //선택된 난이도
  const [showDatePicker, setShowDatePicker] = useState(false); //날짜 선택기 표시 여부
  const [isModifyDifficultySheet, setIsModifyDifficultySheet] = useState(false); //난이도 변경 시트 표시 여부
  const [isEditText, setIsEditText] = useState(false); //텍스트 수정 모드 여부
  const [isAddTask, setIsAddTask] = useState(false); //새로운 Task 추가 모드 여부
  const [selectedText, setSelectedText] = useState(""); //선택된 Task의 텍스트 내용용
  const { user } = useAuth();
  const { changeStockAfterNews } = useStock();

  const [taskByDate, setTaskByDate] = useState<TasksByDate>({});

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
    customLogEvent({
      eventName: "start_modify_task",
      payload: { taskId, dueDate, difficulty },
    });
    chooseTaskId(taskId);
    chooseDifficulty(difficulty);
    setSelectedText(text);
    setNewTaskText(text);
  };

  const finishModify = () => {
    customLogEvent({
      eventName: "finish_modify_task",
      payload: { taskId: selectedTaskId },
    });
    setSelectedTaskId(null);
    setSelectedDifficulty(null);
    setSelectedText("");
    setNewTaskText("");
  };

  const addNewTask = async (dueDate: string) => {
    customLogEvent({
      eventName: "finish_add_new_task",
      payload: { dueDate },
    });
    if (!newTaskText.trim() || !user) return;
    const { randomPercent, priceChange } = randomPriceGenerator(
      selectedDifficulty!,
      user.price ?? 100
    );
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

    const res = await saveTaskFirebase(user.uid, newTask);
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
    await deleteTaskFirebase(user.uid!, selectedDate, selectedTaskId);
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
      customLogEvent({
        eventName: "edit_task_text",
        payload: { taskId: selectedTaskId, newText: edit },
      });
      updatedTask.text = edit;
      updatedTask.updatedAt = new Date().toISOString();
      changeEditTextState();
    } else if (mode === "difficulty") {
      customLogEvent({
        eventName: "edit_task_difficulty",
        payload: { taskId: selectedTaskId, newDifficulty: edit },
      });
      const { randomPrice, randomPercent, priceChange } = randomPriceGenerator(
        updatedTask.difficulty,
        user.price ?? 100
      );
      updatedTask.difficulty = edit as keyof TasksState;
      updatedTask.updatedAt = new Date().toISOString();
      updatedTask.percentage = randomPercent;
      updatedTask.priceChange = priceChange;
    } else if (mode === "dueDate") {
      customLogEvent({
        eventName: "edit_task_dueDate",
        payload: { taskId: selectedTaskId, newDueDate: edit },
      });
      const newDate = edit;
      updatedTask.dueDate = newDate;
      updatedTask.updatedAt = new Date().toISOString();
      changeSelectedDate(newDate);
    }

    await saveTaskFirebase(user.uid!, updatedTask);

    setNewTaskText("");
    finishModify();
  };

  const completedTask = async (
    taskId: string,
    difficulty: keyof TasksState
  ) => {
    customLogEvent({
      eventName: "toggle_task_completed",
      payload: { taskId, difficulty },
    });
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
    await saveTaskFirebase(user.uid!, updatedTask);
    changeStockData(updatedTask).then((result) => {
      if (result && !result.success) {
        console.error(result.msg);
      }
    });
  };

  const changeBottomSheetState = () => {
    setIsBottomSheetOpen((prev) => !prev);
    customLogEvent({
      eventName: isBottomSheetOpen ? "open_bottom_sheet" : "close_bottom_sheet",
      payload: { taskId: selectedTaskId },
    });
  };

  const changeShowDatePicker = () => {
    setShowDatePicker((prev) => !prev);
    customLogEvent({
      eventName: showDatePicker ? "open_date_picker" : "close_date_picker",
      payload: { taskId: selectedTaskId },
    });
  };

  const changeDifficultySheetState = () => {
    setIsModifyDifficultySheet((prev) => !prev);
    customLogEvent({
      eventName: isModifyDifficultySheet
        ? "open_difficulty_sheet"
        : "close_difficulty_sheet",
      payload: { taskId: selectedTaskId },
    });
  };

  const changeAddTaskState = () => {
    setIsAddTask((prev) => !prev);
    customLogEvent({
      eventName: isAddTask ? "open_add_task_mode" : "close_add_task_mode",
      payload: {},
    });
  };

  const changeEditTextState = () => {
    setIsEditText((prev) => !prev);
    customLogEvent({
      eventName: isEditText ? "open_edit_text_mode" : "close_edit_text_mode",
      payload: { taskId: selectedTaskId },
    });
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
        Math.round(
          (foundTask.appliedPriceChange + foundTask.priceChange * 0.5) * 10
        ) / 10,
      appliedPercentage:
        Math.round(
          (foundTask.appliedPercentage + foundTask.percentage * 0.5) * 10
        ) / 10,
      updatedAt: new Date().toISOString(),
    };

    await saveTaskFirebase(user.uid!, updatedTask);

    // 🔥 완료된 task인 경우에만 stock 업데이트
    await changeStockAfterNews(priceIncrease, percentageIncrease);
    customLogEvent({
      eventName: "change_task_price_after_news",
      payload: { taskId, difficulty },
    });
  };
  return (
    <TasksContext.Provider
      value={{
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
