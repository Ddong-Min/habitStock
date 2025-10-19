import { View, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Typo from "./Typo";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

// 각 탭의 아이콘 매핑
const getTabIcon = (routeName: string, isFocused: boolean, theme: Theme) => {
  const iconColor = isFocused ? theme.blue100 : theme.neutral400;
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
    case "market":
      return (
        <Ionicons
          name={isFocused ? "globe" : "globe-outline"}
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
    case "news":
      return "뉴스";
    case "market":
      return "마켓";
    case "profile":
      return "프로필";
    default:
      return routeName;
  }
};

interface CustomTabsProps extends BottomTabBarProps {
  theme: Theme;
}

export function CustomTabs({
  state,
  descriptors,
  navigation,
  theme,
}: CustomTabsProps) {
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.neutral200,
        },
      ]}
    >
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
            {getTabIcon(route.name, isFocused, theme)}
            <Typo
              style={{
                color: isFocused ? theme.blue100 : theme.neutral400,
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
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? spacingY._15 : spacingY._5,
    shadowColor: "#000",
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
