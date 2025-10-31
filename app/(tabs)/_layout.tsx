import { StyleSheet, View, Text, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { CustomTabs } from "@/components/CustomTabs";
import { useTheme } from "@/contexts/themeContext";
import { customLogScreenView } from "@/events/appEvent";
import {
  NativeAd,
  NativeAdView,
  TestIds,
} from "react-native-google-mobile-ads";

const SmallNativeAdBanner = ({ theme }: { theme: any }) => {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAd = async () => {
      try {
        const ad = await NativeAd.createForAdRequest(TestIds.NATIVE, {
          requestNonPersonalizedAdsOnly: true,
        });
        if (isMounted) setNativeAd(ad);
      } catch (error) {
        console.log("Ad failed to load:", error);
      }
    };
    loadAd();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!nativeAd) return null;

  return (
    <NativeAdView
      nativeAd={nativeAd}
      style={[
        styles.adContainer,
        { backgroundColor: theme.cardBackground || theme.background },
      ]}
    >
      <View style={styles.adInner}>
        {/* AD 라벨 */}
        <Text
          style={[
            styles.adLabel,
            { backgroundColor: theme.primary, color: theme.text },
          ]}
        >
          AD
        </Text>

        {/* 아이콘 */}
        {nativeAd.icon && (
          <Image
            source={nativeAd.icon}
            style={styles.adIcon}
            resizeMode="cover"
          />
        )}

        {/* 광고 제목 */}
        <Text
          style={[styles.adHeadline, { color: theme.text }]}
          numberOfLines={1}
        >
          {nativeAd.headline}
        </Text>

        {/* 버튼 */}
        {nativeAd.callToAction && (
          <View
            style={[
              styles.adButton,
              {
                backgroundColor: theme.primary,
                borderColor: theme.border || theme.primary,
              },
            ]}
          >
            <Text style={[styles.adButtonText, { color: theme.text }]}>
              {nativeAd.callToAction}
            </Text>
          </View>
        )}
      </View>
    </NativeAdView>
  );
};

const TabLayout = () => {
  const { theme } = useTheme();

  const CustomTabBarWithAd = (props: any) => {
    return (
      <View style={styles.tabBarContainer}>
        <CustomTabs {...props} theme={theme} />
        <SmallNativeAdBanner theme={theme} />
      </View>
    );
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBarWithAd {...props} />}
      screenOptions={{ headerShown: false }}
      screenListeners={({ route }) => ({
        focus: () => {
          const screenName = route.name === "index" ? "todo" : route.name;
          customLogScreenView(screenName);
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    width: "100%",
  },
  adContainer: {
    width: "100%",
    height: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    justifyContent: "center",
  },
  adInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 6,
  },
  adLabel: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  adIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  adHeadline: {
    flex: 1,
    fontSize: 11,
  },
  adButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  adButtonText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default TabLayout;
