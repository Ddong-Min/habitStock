import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal, // ✅ [추가] Modal 임포트
  ActivityIndicator, // ✅ [추가] ActivityIndicator 임포트
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import DifficultyHeader from "./DifficultyHeader";
import { useTasks } from "@/contexts/taskContext";
import { scale, verticalScale } from "@/utils/styling";
import { useCalendar } from "@/contexts/calendarContext";
import { TasksState } from "@/types";
import NewTask from "./NewTask";
import { useNews } from "@/contexts/newsContext";
import { useAuth } from "@/contexts/authContext";
import { useTheme } from "@/contexts/themeContext";
import { ViewStyle } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { customLogEvent } from "@/events/appEvent";
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

const TaskList: React.FC<{
  diffStyle?: ViewStyle;
  taskStyle?: ViewStyle;
  diffFontSize?: number;
  taskFontSize?: number;
  isNewsMode?: boolean;
}> = ({
  diffStyle,
  taskStyle,
  diffFontSize,
  taskFontSize,
  isNewsMode = false,
}) => {
  const { theme } = useTheme();
  const {
    taskByDate,
    selectedDifficulty,
    isAddTask,
    isEditText,
    selectedTaskId,
    chooseDifficulty,
    changeAddTaskState,
    completedTask,
    startModify,
    changeBottomSheetState,
    changePriceAfterNews,
    markTaskAsNewsGenerated,
  } = useTasks();
  const { user } = useAuth();
  const { selectedDate } = useCalendar();
  const { createNews } = useNews();

  // ✅ [추가] 뉴스 생성 로딩 상태를 관리할 state
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);

  // 보상형 광고 인스턴스
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  // 광고 로드
  useEffect(() => {
    const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });

    const loadedListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setAdLoaded(true);
        console.log("✅ 보상형 광고 로드 완료");
      }
    );

    rewarded.load();
    setRewardedAd(rewarded);

    return () => {
      loadedListener();
    };
  }, []);

  const flatData = useMemo(() => {
    const tasksForSelectedDate = taskByDate[selectedDate] || [];
    return (
      Object.keys(tasksForSelectedDate) as Array<keyof TasksState>
    ).flatMap((difficulty) => [
      { type: "header" as const, difficulty },
      ...tasksForSelectedDate[difficulty].map((task) => ({
        ...task,
        type: "task" as const,
      })),
    ]);
  }, [selectedDate, taskByDate]);

  // 보상형 광고 시청 후 뉴스 생성
  const showRewardedAdAndCreateNews = async (
    taskId: string,
    dueDate: string,
    difficulty: keyof TasksState,
    imageUrl: string | null
  ) => {
    if (!rewardedAd || !adLoaded) {
      Alert.alert(
        "오류",
        "광고를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
      customLogEvent({ eventName: "ad_not_loaded" });
      return;
    }

    try {
      // 보상 획득 리스너 등록
      const earnedListener = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        async (reward) => {
          console.log("🎁 보상 획득:", reward);
          customLogEvent({
            eventName: "rewarded_ad_earned",
            payload: { amount: reward.amount, type: reward.type },
          });

          // 뉴스 생성
          try {
            // ✅ [수정] 로딩 시작
            setIsGeneratingNews(true);

            await createNews(taskId, dueDate, true, imageUrl || "");
            await markTaskAsNewsGenerated(taskId, difficulty);

            // ✅ [수정] 로딩 종료 (성공 시)
            setIsGeneratingNews(false);
            Alert.alert("완료", "AI 뉴스가 생성되었습니다!");
            customLogEvent({ eventName: "success_create_news" });
            changePriceAfterNews(taskId, difficulty);
          } catch (error: any) {
            // ✅ [수정] 로딩 종료 (실패 시)
            setIsGeneratingNews(false);
            console.error("뉴스 생성 실패:", error);
            Alert.alert("오류", error.message || "뉴스 생성에 실패했습니다.");
            customLogEvent({ eventName: "fail_create_news" });
          }

          // 새 광고 로드
          earnedListener();
          setAdLoaded(false);
          const newAd = RewardedAd.createForAdRequest(TestIds.REWARDED);

          const newLoadedListener = newAd.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => {
              setAdLoaded(true);
              console.log("✅ 새 보상형 광고 로드 완료");
              newLoadedListener();
            }
          );

          newAd.load();
          setRewardedAd(newAd);
        }
      );

      // 광고 표시
      customLogEvent({ eventName: "rewarded_ad_show" });
      rewardedAd.show();
    } catch (error) {
      console.error("광고 표시 실패:", error);
      Alert.alert("오류", "광고를 표시할 수 없습니다.");
      customLogEvent({ eventName: "rewarded_ad_show_fail" });
    }
  };

  const handleNewsGeneration = async (
    taskId: string,
    dueDate: string,
    taskText: string,
    difficulty: keyof TasksState
  ) => {
    // 3. 광고 시청 알림창 (이미지 URL을 파라미터로 받음)
    const showAdAlert = (imageUrl: string | null = null) => {
      Alert.alert(
        "광고 시청",
        "15초 보상형 광고를 시청하고 뉴스를 생성하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel",
            onPress: () => {
              customLogEvent({ eventName: "cancel_create_news_in_ad" });
            },
          },
          {
            text: "시청하기",
            onPress: () => {
              // 실제 보상형 광고 표시
              showRewardedAdAndCreateNews(
                taskId,
                dueDate,
                difficulty,
                imageUrl
              );
            },
          },
        ]
      );
    };

    // 2. 이미지 픽커 실행 함수
    const pickImageAndShowAd = async () => {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "권한 필요",
          "이미지를 선택하려면 카메라 롤 접근 권한이 필요합니다."
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (pickerResult.canceled) {
        console.log("Image picker cancelled");
        customLogEvent({ eventName: "cancel_image_picker" });
        return;
      }

      if (pickerResult.assets && pickerResult.assets.length > 0) {
        customLogEvent({ eventName: "image_selected_for_news" });
        showAdAlert(pickerResult.assets[0].uri);
      }
    };

    // 1. 가장 먼저 이미지 추가 여부를 묻는 알림창
    Alert.alert("이미지 추가", "AI 뉴스에 이미지를 추가하시겠습니까?", [
      {
        text: "아니요 (이미지 없이 생성)",
        onPress: () => {
          showAdAlert(null);
          customLogEvent({ eventName: "create_news_no_image" });
        },
      },
      {
        text: "예 (이미지 선택)",
        onPress: () => {
          pickImageAndShowAd();
          customLogEvent({ eventName: "create_news_with_image" });
        },
      },
      {
        text: "취소",
        style: "cancel",
        onPress: () => {
          customLogEvent({ eventName: "cancel_create_news_in_image" });
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ✅ [추가] 뉴스 생성 로딩 모달 */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isGeneratingNews}
        onRequestClose={() => {
          // Android에서 뒤로가기 버튼으로 닫히지 않도록
        }}
      >
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.cardBackground }, // 테마 적용
            ]}
          >
            <ActivityIndicator size="large" color={theme.main || colors.main} />
            <Typo
              size={16}
              color={theme.text}
              style={{ marginTop: spacingY._12 }}
            >
              AI 뉴스를 생성 중입니다...
            </Typo>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: theme.background, borderColor: theme.neutral200 },
        ]}
        contentContainerStyle={{
          paddingBottom:
            Platform.OS === "ios" ? verticalScale(150) : verticalScale(140),
        }}
      >
        {flatData.map((item) => {
          if (item.type === "header") {
            return (
              <View key={item.difficulty}>
                <DifficultyHeader
                  difficulty={item.difficulty}
                  setNewTaskDifficulty={chooseDifficulty}
                  isAddMode={changeAddTaskState}
                  style={diffStyle}
                  fontSize={diffFontSize}
                />
                {selectedDifficulty === item.difficulty && isAddTask && (
                  <NewTask />
                )}
              </View>
            );
          }

          const hasGeneratedNews = item.hasGeneratedNews || false;
          const dueDateTimeString = `${item.dueDate}T${user?.duetime}:00`;
          const dueDateTime = new Date(dueDateTimeString);
          const isOverdue = !item.completed && dueDateTime < new Date();

          return (
            <View key={item.id}>
              {isEditText && selectedTaskId === item.id ? (
                <NewTask />
              ) : (
                <View
                  style={[
                    styles.taskRow,
                    { borderBottomColor: theme.neutral200 },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      completedTask(item.id, item.difficulty);
                    }}
                    style={styles.checkBoxContainer}
                  >
                    <View
                      style={[
                        styles.checkBox,
                        {
                          borderColor: theme.neutral300,
                          backgroundColor: theme.cardBackground,
                        },
                        item.completed && styles.checkedBox,
                        !item.completed && isOverdue && styles.overDueBox,
                      ]}
                    >
                      {item.completed && (
                        <Feather name="check" size={14} color={theme.white} />
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.taskContent}>
                    <Typo
                      size={16}
                      fontWeight={"600"}
                      color={item.completed ? theme.red100 : theme.blue100}
                      style={item.completed ? styles.completedText : undefined}
                    >
                      {item.text}
                    </Typo>

                    {(item.completed || isOverdue) && (
                      <Typo
                        size={13}
                        fontWeight={"600"}
                        color={item.completed ? theme.red100 : theme.blue100}
                      >
                        {item.completed ? "▲" : "▼"} {item.appliedPriceChange}(
                        {item.appliedPercentage}%)
                      </Typo>
                    )}
                  </View>

                  <View style={styles.rightActions}>
                    {isNewsMode && item.completed && (
                      <TouchableOpacity
                        style={[
                          styles.newsButton,
                          // { backgroundColor: theme.main },
                        ]}
                        onPress={() =>
                          handleNewsGeneration(
                            item.id,
                            item.dueDate,
                            item.text,
                            item.difficulty
                          )
                        }
                        disabled={hasGeneratedNews}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={hasGeneratedNews ? "x" : "edit-3"}
                          size={16}
                          color={theme.text}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        startModify(
                          item.id,
                          item.dueDate,
                          item.difficulty,
                          item.text
                        ),
                          changeBottomSheetState();
                      }}
                      style={styles.moreButton}
                    >
                      <Feather
                        name="more-horizontal"
                        size={verticalScale(20)}
                        color={theme.neutral400}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
  },
  checkBoxContainer: {
    paddingRight: spacingX._12,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#d1706980",
    borderColor: "#d1706980",
  },
  overDueBox: {
    backgroundColor: "#7693a580",
    borderColor: "#7693a580",
  },
  taskContent: {
    flex: 1,
    gap: spacingY._5,
  },
  completedText: {
    textDecorationLine: "line-through",
  },
  dueDateText: {},
  priceText: {
    fontSize: verticalScale(12),
    fontWeight: "600",
  },
  priceUp: {},
  priceDown: {},
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._7,
  },
  newsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  newsButtonText: {
    fontSize: 18,
  },
  moreButton: {
    padding: spacingX._7,
  },
  // ✅ [추가] 로딩 모달 관련 스타일
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingContainer: {
    padding: spacingX._20,
    borderRadius: radius._10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TaskList;
