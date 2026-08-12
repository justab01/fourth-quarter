import { Link, router, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <AppHeader mode="utility" theme="dark" eyebrow="Fourth Quarter" title="Page unavailable" onBack={() => router.canGoBack() ? router.back() : router.replace("/" as any)} />
        <View style={styles.container}>
          <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Go to home</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: Colors.dark.text,
    fontFamily: FONTS.bodyBold,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontFamily: FONTS.bodyBold,
  },
});
