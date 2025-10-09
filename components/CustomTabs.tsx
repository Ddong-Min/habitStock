import { View, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Typo from "./Typo";
import { Ionicons } from "@expo/vector-icons";

// 각 탭의 아이콘 매핑
const getTabIcon = (routeName: string, isFocused: boolean) => {
  const iconColor = isFocused ? colors.blue100 : colors.neutral400;
  const size = 24;

  switch (routeName) {
    case "index":
      return (
        <Ionicons
          name={isFocused ? "checkmark-circle" : "checkmark-circle-outline"}
          size={size}
          color={iconColor}
        />
      );
    case "stock":
      return (
        <Ionicons
          name={isFocused ? "trending-up" : "trending-up-outline"}
          size={size}
          color={iconColor}
        />
      );
    case "news":
      return (
        <Ionicons
          name={isFocused ? "newspaper" : "newspaper-outline"}
          size={size}
          color={iconColor}
        />
      );
    case "profile":
      return (
        <Ionicons
          name={isFocused ? "person" : "person-outline"}
          size={size}
          color={iconColor}
        />
      );
    default:
      return (
        <Ionicons
          name={isFocused ? "ellipse" : "ellipse-outline"}
          size={size}
          color={iconColor}
        />
      );
  }
};

// 각 탭의 라벨 매핑
const getTabLabel = (routeName: string) => {
  switch (routeName) {
    case "index":
      return "할일";
    case "stock":
      return "주가";
    case "follow":
      return "팔로우";
    case "profile":
      return "프로필";
    default:
      return routeName;
  }
};

export function CustomTabs({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : getTabLabel(route.name);

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarItem}
          >
            {getTabIcon(route.name, isFocused)}
            <Typo
              style={{
                color: isFocused ? colors.blue100 : colors.neutral400,
                marginTop: spacingY._3,
              }}
            >
              {label}
            </Typo>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    width: "100%",
    height: Platform.OS === "ios" ? verticalScale(80) : verticalScale(70),
    backgroundColor: colors.white,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    paddingBottom: Platform.OS === "ios" ? spacingY._15 : spacingY._5,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacingY._10,
  },
});
