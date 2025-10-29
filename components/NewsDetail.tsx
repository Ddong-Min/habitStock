import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typo from "@/components/Typo";
import { spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useTheme } from "@/contexts/themeContext";
import { useNews } from "@/contexts/newsContext";
import * as newsApi from "@/api/newsApi";
import { useAuth } from "@/contexts/authContext";
import * as ImagePicker from "expo-image-picker";
import { customLogEvent } from "@/events/appEvent";

const { width } = Dimensions.get("window");

interface CommentWithReaction extends newsApi.Comment {
  userReaction?: "like" | "dislike";
}

const NewsDetail = ({
  item,
  onBack,
}: {
  item: newsApi.NewsItem;
  onBack: () => void;
}) => {
  // --- 상태 관리 ---
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentWithReaction[]>([]);
  const [reactions, setReactions] = useState<
    Record<string, "like" | "dislike">
  >({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editContent, setEditContent] = useState(item.content);
  const [editImage, setEditImage] = useState<string | null>(
    item.imageURL || null
  );

  const { theme } = useTheme();
  const {
    currentUserId,
    toggleNewsLike,
    myNewsLikes,
    followingNewsLikes,
    myNews,
    followingNews,
    updateNews: contextUpdateNews,
    deleteNews: contextDeleteNews,
    addComment: contextAddComment,
    deleteComment: contextDeleteComment,
  } = useNews();
  const { user } = useAuth();
  const isMyNews = currentUserId === item.userId;
  const isLiked = isMyNews
    ? !!myNewsLikes[item.id]
    : !!followingNewsLikes[item.id];
  // Get the most up-to-date news item from the context
  const currentNewsItem = (
    isMyNews
      ? myNews.find((n) => n.id === item.id)
      : followingNews.find((n) => n.id === item.id)
  ) as newsApi.NewsItem | undefined;

  const displayItem = currentNewsItem || item;

  // --- 댓글 실시간 구독 ---
  useEffect(() => {
    if (!item.id || !item.userId) return;

    const unsubscribe = newsApi.subscribeToComments(
      item.userId,
      item.id,
      (fetchedComments) => {
        setComments(fetchedComments as CommentWithReaction[]);
      },
      (error) => {
        console.error("댓글 구독 실패:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [item.id, item.userId]);

  // --- 댓글 반응 실시간 구독 ---
  useEffect(() => {
    if (!item.id || !item.userId || !currentUserId) return;

    const unsubscribe = newsApi.subscribeToCommentReactions(
      item.userId,
      item.id,
      currentUserId,
      (fetchedReactions) => {
        setReactions(fetchedReactions);
      },
      (error) => {
        console.error("댓글 반응 구독 실패:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [item.id, item.userId, currentUserId]);

  // 댓글과 반응을 합쳐서 최종 데이터 생성
  const commentsWithReactions: CommentWithReaction[] = comments.map((c) => ({
    ...c,
    userReaction: reactions[c.id],
  }));

  // --- 핸들러 함수 ---

  // 뉴스 좋아요 핸들러
  const handleLikeNews = () => {
    toggleNewsLike(item.userId, item.id);
  };

  // 댓글 추가 핸들러 - Context 사용
  const handleAddComment = async () => {
    if (!comment.trim() || !currentUserId) return;
    try {
      await contextAddComment(item.userId, item.id, comment.trim());
      setComment("");
      // 구독 방식이므로 자동 업데이트
    } catch (error) {
      Alert.alert("오류", "댓글 작성에 실패했습니다.");
    }
  };

  // 댓글 삭제 핸들러 - Context 사용
  const handleDeleteComment = async (commentId: string) => {
    Alert.alert("댓글 삭제", "이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await contextDeleteComment(item.userId, item.id, commentId);
            // 구독 방식이므로 자동 업데이트
          } catch (error) {
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  // 댓글 좋아요 핸들러
  const handleCommentReaction = async (commentId: string) => {
    if (!currentUserId) {
      Alert.alert("알림", "로그인이 필요합니다.");
      return;
    }
    try {
      customLogEvent({ eventName: "toggle_comment_like" });
      await newsApi.toggleCommentReaction(
        item.userId,
        item.id,
        commentId,
        currentUserId,
        "like"
      );
      // 구독 방식이므로 자동 업데이트
    } catch (error) {
      Alert.alert("오류", "반응 처리에 실패했습니다.");
    }
  };

  // 뉴스 삭제 핸들러 - Context 사용
  const handleDeleteNews = () => {
    Alert.alert("뉴스 삭제", "이 뉴스를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await contextDeleteNews(item.id);
            Alert.alert("성공", "뉴스가 삭제되었습니다.");
            onBack();
          } catch (error) {
            Alert.alert("오류", "뉴스 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  // 이미지 픽커 핸들러
  const handlePickImage = async () => {
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

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setEditImage(pickerResult.assets[0].uri);
    }
  };

  // 뉴스 수정 핸들러 - Context 사용
  const handleEditNews = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert("오류", "제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      // Context의 updateNews 사용
      await contextUpdateNews(
        item.id,
        editTitle.trim(),
        editContent.trim(),
        editImage || undefined
      );
      setEditModalVisible(false);
      Alert.alert("성공", "뉴스가 수정되었습니다.");
    } catch (error) {
      Alert.alert("오류", "뉴스 수정에 실패했습니다.");
    }
  };

  // 수정 모달 열기
  const openEditModal = () => {
    setEditTitle(displayItem.title);
    setEditContent(displayItem.content);
    setEditImage(displayItem.imageURL || null);
    setEditModalVisible(true);
  };

  // 수정 모달 닫기
  const closeEditModal = () => {
    setEditModalVisible(false);
    // 원래 값으로 복원
    setEditTitle(displayItem.title);
    setEditContent(displayItem.content);
    setEditImage(displayItem.imageURL || null);
  };

  // --- 렌더링 ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.neutral200 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerRightContainer}>
          {isMyNews && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={openEditModal}
                style={styles.iconButton}
              >
                <Ionicons name="pencil" size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteNews}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.detailContainer}>
          <Typo size={14} color={theme.neutral500} style={styles.date}>
            {displayItem.date}
          </Typo>
          <Typo
            size={26}
            fontWeight={"700"}
            style={styles.title}
            color={theme.text}
          >
            {displayItem.title}
          </Typo>

          {displayItem.imageURL && (
            <Image
              source={{ uri: displayItem.imageURL }}
              style={[styles.newsImage, { backgroundColor: theme.neutral200 }]}
            />
          )}

          <View
            style={[styles.divider, { backgroundColor: theme.neutral200 }]}
          />
          <Typo
            size={18}
            style={styles.contentText}
            fontWeight={"400"}
            color={theme.text}
          >
            {displayItem.content}
          </Typo>
        </View>

        {/* 뉴스 좋아요 섹션 */}
        <View style={styles.likeSection}>
          <TouchableOpacity
            style={[styles.likeButton, { borderColor: theme.neutral200 }]}
            onPress={handleLikeNews}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#FF4444" : theme.neutral500}
            />
            <Typo
              size={16}
              color={isLiked ? "#FF4444" : theme.neutral500}
              style={styles.likeText}
              fontWeight="600"
            >
              {displayItem.likesCount || 0}
            </Typo>
          </TouchableOpacity>
        </View>

        {/* 댓글 섹션 */}
        <View
          style={[styles.commentSection, { borderTopColor: theme.neutral200 }]}
        >
          <Typo
            size={20}
            fontWeight="600"
            style={styles.commentTitle}
            color={theme.text}
          >
            댓글 ({commentsWithReactions.length})
          </Typo>

          {commentsWithReactions.length === 0 ? (
            <View style={styles.emptyComments}>
              <Typo size={16} color={theme.neutral400}>
                아직 댓글이 없습니다.
              </Typo>
            </View>
          ) : (
            <FlatList
              data={commentsWithReactions}
              keyExtractor={(c) => c.id}
              scrollEnabled={false}
              renderItem={({ item: commentItem }) => (
                <View
                  style={[
                    styles.commentItem,
                    { borderBottomColor: theme.neutral200 },
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      <Ionicons
                        name="person-circle"
                        size={32}
                        color={theme.neutral500}
                      />
                      <View style={styles.commentUserDetails}>
                        <Typo size={15} fontWeight="600" color={theme.text}>
                          {commentItem.userName}
                        </Typo>
                        <Typo size={12} color={theme.neutral400}>
                          {commentItem.createdAt
                            ? new Date(
                                commentItem.createdAt.toMillis()
                              ).toLocaleString("ko-KR")
                            : "방금 전"}
                        </Typo>
                      </View>
                    </View>
                    {currentUserId === commentItem.userId && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(commentItem.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.neutral400}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Typo
                    size={15}
                    style={styles.commentContent}
                    color={theme.text}
                  >
                    {commentItem.content}
                  </Typo>
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      style={styles.reactionButton}
                      onPress={() => handleCommentReaction(commentItem.id)}
                    >
                      <Ionicons
                        name={
                          commentItem.userReaction === "like"
                            ? "thumbs-up"
                            : "thumbs-up-outline"
                        }
                        size={18}
                        color={
                          commentItem.userReaction === "like"
                            ? theme.blue100
                            : theme.neutral400
                        }
                      />
                      <Typo
                        size={14}
                        color={
                          commentItem.userReaction === "like"
                            ? theme.blue100
                            : theme.neutral400
                        }
                        style={styles.reactionText}
                      >
                        {commentItem.likesCount || 0}
                      </Typo>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {currentUserId && (
            <View
              style={[
                styles.commentInputContainer,
                {
                  borderColor: theme.neutral200,
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <TextInput
                style={[styles.commentInput, { color: theme.text }]}
                value={comment}
                onChangeText={setComment}
                placeholder="댓글을 입력하세요"
                placeholderTextColor={theme.neutral400}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                style={[
                  styles.commentButton,
                  { backgroundColor: theme.blue100 },
                ]}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 개선된 뉴스 수정 모달 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={editModalVisible}
        onRequestClose={closeEditModal}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          {/* 모달 헤더 */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.neutral200 },
            ]}
          >
            <TouchableOpacity
              onPress={closeEditModal}
              style={styles.modalBackButton}
            >
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            <Typo size={18} fontWeight="600" color={theme.text}>
              뉴스 수정
            </Typo>
            <TouchableOpacity
              onPress={handleEditNews}
              style={styles.modalSaveButton}
            >
              <Typo size={16} fontWeight="600" color={theme.blue100}>
                완료
              </Typo>
            </TouchableOpacity>
          </View>

          {/* 모달 콘텐츠 */}
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalFormContainer}>
              {/* 제목 입력 */}
              <View style={styles.inputSection}>
                <Typo
                  size={14}
                  fontWeight="600"
                  color={theme.neutral500}
                  style={styles.inputLabel}
                >
                  제목
                </Typo>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      borderColor: theme.neutral200,
                      color: theme.text,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="제목을 입력하세요"
                  placeholderTextColor={theme.neutral400}
                  maxLength={100}
                />
                <Typo
                  size={12}
                  color={theme.neutral400}
                  style={styles.charCount}
                >
                  {editTitle.length}/100
                </Typo>
              </View>

              {/* 이미지 섹션 */}
              <View style={styles.inputSection}>
                <Typo
                  size={14}
                  fontWeight="600"
                  color={theme.neutral500}
                  style={styles.inputLabel}
                >
                  이미지
                </Typo>
                {editImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: editImage }}
                      style={[
                        styles.imagePreview,
                        { backgroundColor: theme.neutral200 },
                      ]}
                    />
                    <View style={styles.imageActions}>
                      <TouchableOpacity
                        style={[
                          styles.imageActionButton,
                          { backgroundColor: theme.blue100 },
                        ]}
                        onPress={handlePickImage}
                      >
                        <Ionicons
                          name="images-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.imageActionText}>변경</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.imageActionButton,
                          { backgroundColor: "#FF4444" },
                        ]}
                        onPress={() => setEditImage(null)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.imageActionText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.imageUploadButton,
                      {
                        borderColor: theme.neutral200,
                        backgroundColor: theme.cardBackground,
                      },
                    ]}
                    onPress={handlePickImage}
                  >
                    <Ionicons
                      name="image-outline"
                      size={48}
                      color={theme.neutral400}
                    />
                    <Typo
                      size={14}
                      color={theme.neutral400}
                      style={styles.uploadText}
                    >
                      이미지를 추가하세요
                    </Typo>
                  </TouchableOpacity>
                )}
              </View>

              {/* 내용 입력 */}
              <View style={styles.inputSection}>
                <Typo
                  size={14}
                  fontWeight="600"
                  color={theme.neutral500}
                  style={styles.inputLabel}
                >
                  내용
                </Typo>
                <TextInput
                  style={[
                    styles.contentInput,
                    {
                      borderColor: theme.neutral200,
                      color: theme.text,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="내용을 입력하세요"
                  placeholderTextColor={theme.neutral400}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Typo
                  size={12}
                  color={theme.neutral400}
                  style={styles.charCount}
                >
                  {editContent.length}/2000
                </Typo>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
  },
  backButton: { padding: spacingX._5 },
  headerRightContainer: { minWidth: 60, alignItems: "flex-end" },
  headerActions: { flexDirection: "row" },
  iconButton: { marginLeft: spacingX._15, padding: spacingX._5 },
  content: { flex: 1 },
  detailContainer: { padding: spacingX._20 },
  date: { marginBottom: spacingY._10 },
  title: { marginBottom: spacingY._20, lineHeight: verticalScale(34) },
  newsImage: {
    width: "100%",
    height: verticalScale(250),
    borderRadius: 8,
    marginBottom: spacingY._20,
  },
  divider: { height: 1, marginBottom: spacingY._20 },
  contentText: { lineHeight: verticalScale(28) },
  likeSection: { alignItems: "center", paddingVertical: spacingY._15 },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: 20,
    borderWidth: 1,
  },
  likeText: { marginLeft: spacingX._10 },
  commentSection: { padding: spacingX._20, borderTopWidth: 8 },
  commentTitle: { marginBottom: spacingY._15 },
  emptyComments: { alignItems: "center", paddingVertical: spacingY._30 },
  commentItem: { paddingVertical: spacingY._15, borderBottomWidth: 1 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacingY._10,
  },
  commentUserInfo: { flexDirection: "row", alignItems: "center" },
  commentUserDetails: { marginLeft: spacingX._10 },
  commentContent: {
    lineHeight: verticalScale(22),
    marginLeft: spacingX._10 + 32,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: spacingY._10,
    marginLeft: spacingX._10 + 32,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  reactionText: { marginLeft: spacingX._5, fontWeight: "600" },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._15,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  commentInput: { flex: 1, height: 40, fontSize: 16 },
  commentButton: { marginLeft: 8, padding: 8, borderRadius: 16 },

  // 개선된 모달 스타일
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    padding: spacingX._5,
  },
  modalSaveButton: {
    padding: spacingX._5,
  },
  modalScrollView: {
    flex: 1,
  },
  modalFormContainer: {
    padding: spacingX._20,
  },
  inputSection: {
    marginBottom: spacingY._25,
  },
  inputLabel: {
    marginBottom: spacingY._10,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacingX._15,
    fontSize: 16,
    fontWeight: "500",
  },
  charCount: {
    textAlign: "right",
    marginTop: spacingY._5,
  },
  imagePreviewContainer: {
    width: "100%",
  },
  imagePreview: {
    width: "100%",
    height: verticalScale(200),
    borderRadius: 12,
    marginBottom: spacingY._10,
  },
  imageActions: {
    flexDirection: "row",
    gap: spacingX._10,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacingY._12,
    borderRadius: 10,
    gap: spacingX._8,
  },
  imageActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  imageUploadButton: {
    width: "100%",
    height: verticalScale(200),
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    marginTop: spacingY._10,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacingX._15,
    fontSize: 16,
    height: verticalScale(250),
    lineHeight: 24,
  },
});

export default NewsDetail;
