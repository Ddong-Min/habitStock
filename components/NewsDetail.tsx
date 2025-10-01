import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typo from "@/components/Typo";
import { spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

const NewsDetail = ({ item, onBack }: { item: any; onBack: () => void }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [...prev, comment.trim()]);
    setComment("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Typo size={18} fontWeight={"600"}>
          뉴스 상세
        </Typo>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.detailContainer}>
          {/* 날짜 */}
          <Typo size={14} color="#6B7280" style={styles.date}>
            {item.date}
          </Typo>

          {/* 제목 */}
          <Typo size={26} fontWeight={"700"} style={styles.title}>
            {item.title}
          </Typo>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 본문 */}
          <Typo size={18} style={styles.contentText} fontWeight={"400"}>
            {item.content}
          </Typo>
        </View>

        {/* 댓글 섹션 */}
        <View style={styles.commentSection}>
          <Typo size={20} fontWeight="600" style={styles.commentTitle}>
            댓글
          </Typo>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <Typo size={16} color="#9CA3AF">
              아직 댓글이 없습니다.
            </Typo>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c, i) => `${c}-${i}`}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Ionicons name="person-circle" size={28} color="#6B7280" />
                  <Typo size={16} style={styles.commentText}>
                    {item}
                  </Typo>
                </View>
              )}
            />
          )}

          {/* 댓글 입력창 */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="댓글을 입력하세요"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={handleAddComment}
              style={styles.commentButton}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: spacingX._5,
  },
  content: {
    flex: 1,
  },
  detailContainer: {
    padding: spacingX._20,
  },
  date: {
    marginBottom: spacingY._10,
  },
  title: {
    marginBottom: spacingY._20,
    lineHeight: verticalScale(34),
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: spacingY._20,
  },
  contentText: {
    lineHeight: verticalScale(28),
    color: "#374151",
    marginBottom: spacingY._30,
  },
  commentSection: {
    padding: spacingX._20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  commentTitle: {
    marginBottom: spacingY._15,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  commentText: {
    marginLeft: 8,
    color: "#374151",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    color: "#111827",
  },
  commentButton: {
    marginLeft: 8,
    backgroundColor: "#3B82F6",
    padding: 8,
    borderRadius: 8,
  },
});

export default NewsDetail;
