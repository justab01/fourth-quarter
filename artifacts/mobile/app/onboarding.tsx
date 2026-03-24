import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Animated, Dimensions, Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { SPORTS, TEAMS_BY_LEAGUE } from "@/constants/sports";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const STEPS = ["welcome", "sports", "teams", "name", "confirm"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { savePreferences, preferences } = usePreferences();

  const [step, setStep] = useState<Step>("welcome");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [userName, setUserName] = useState("Abraham");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const advance = (next: Step) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(next);
  };

  const toggleSport = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleTeam = (team: string) => {
    Haptics.selectionAsync();
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const availableTeams = selectedSports.flatMap(s => TEAMS_BY_LEAGUE[s] ?? []);

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await savePreferences({
      ...preferences,
      name: userName.trim() || "Sports Fan",
      favoriteLeagues: selectedSports,
      favoriteTeams: selectedTeams,
      onboardingComplete: true,
    });
    router.replace("/(tabs)");
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <LinearGradient
        colors={["#0A0A0F", "#0D0D1A", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      {step !== "welcome" && (
        <View style={styles.progressBar}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.progressDot, stepIndex >= i && styles.progressDotActive]} />
          ))}
        </View>
      )}

      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        {step === "welcome" && <WelcomeStep onNext={() => advance("sports")} botPad={botPad} />}
        {step === "sports" && (
          <SportsStep
            selected={selectedSports}
            onToggle={toggleSport}
            onNext={() => advance("teams")}
            canContinue={selectedSports.length > 0}
          />
        )}
        {step === "teams" && (
          <TeamsStep
            teams={availableTeams}
            selected={selectedTeams}
            onToggle={toggleTeam}
            onNext={() => advance("name")}
          />
        )}
        {step === "name" && (
          <NameStep
            name={userName}
            onChange={setUserName}
            onNext={() => advance("confirm")}
            botPad={botPad}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            name={userName}
            sports={selectedSports}
            teams={selectedTeams}
            onFinish={handleFinish}
          />
        )}
      </Animated.View>
    </View>
  );
}

function WelcomeStep({ onNext, botPad }: { onNext: () => void; botPad: number }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(logoAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.welcomeContainer}>
      <Animated.View style={[styles.logoContainer, {
        opacity: logoAnim,
        transform: [{ scale: logoAnim }, { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
      }]}>
        <LinearGradient colors={[C.accent, "#FF6B35"]} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="trophy" size={48} color="#fff" />
        </LinearGradient>
        <View style={styles.logoGlow} />
      </Animated.View>

      <View style={styles.welcomeText}>
        <Text style={styles.appName}>FOURTH</Text>
        <Text style={[styles.appName, { color: C.accent }]}>QUARTER</Text>
        <Text style={styles.tagline}>Your sports. Your way. One app.</Text>
      </View>

      <View style={styles.featureList}>
        {[
          { icon: "flash", label: "Live scores & updates" },
          { icon: "sparkles", label: "AI-powered game recaps" },
          { icon: "newspaper", label: "Personalized news feed" },
        ].map(f => (
          <View key={f.label} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={C.accent} />
            </View>
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <LinearGradient colors={[C.accent, "#FF6B35"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function SportsStep({ selected, onToggle, onNext, canContinue }: {
  selected: string[]; onToggle: (id: string) => void; onNext: () => void; canContinue: boolean;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pick Your Sports</Text>
      <Text style={styles.stepSubtitle}>Select all that you follow</Text>
      <View style={styles.sportsGrid}>
        {SPORTS.map(sport => {
          const active = selected.includes(sport.id);
          return (
            <Pressable key={sport.id} onPress={() => onToggle(sport.id)} style={[styles.sportChip, active && styles.sportChipActive]}>
              {active && <LinearGradient colors={[C.accent, "#FF6B35"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
              <Ionicons name={sport.icon as any} size={22} color={active ? "#fff" : C.textSecondary} />
              <Text style={[styles.sportLabel, active && styles.sportLabelActive]}>{sport.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]} onPress={canContinue ? onNext : undefined}>
        <LinearGradient colors={canContinue ? [C.accent, "#FF6B35"] : ["#333", "#333"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function TeamsStep({ teams, selected, onToggle, onNext }: {
  teams: string[]; selected: string[]; onToggle: (t: string) => void; onNext: () => void;
}) {
  return (
    <View style={[styles.stepContainer, { flex: 1 }]}>
      <Text style={styles.stepTitle}>Pick Your Teams</Text>
      <Text style={styles.stepSubtitle}>Choose the teams you follow</Text>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
        {teams.length === 0 ? (
          <Text style={{ color: C.textTertiary, textAlign: "center", marginTop: 40, fontFamily: "Inter_400Regular" }}>
            No teams available for selected sports
          </Text>
        ) : (
          teams.map(team => {
            const active = selected.includes(team);
            return (
              <Pressable key={team} onPress={() => onToggle(team)} style={[styles.teamChip, active && styles.teamChipActive]}>
                <View style={styles.teamChipLeft}>
                  <View style={[styles.teamInitial, active && { backgroundColor: C.accent }]}>
                    <Text style={styles.teamInitialText}>{team.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.teamChipText, active && styles.teamChipTextActive]}>{team}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
              </Pressable>
            );
          })
        )}
      </ScrollView>
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <LinearGradient colors={[C.accent, "#FF6B35"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryBtnText}>{selected.length > 0 ? `Continue (${selected.length})` : "Skip"}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function NameStep({ name, onChange, onNext, botPad }: { name: string; onChange: (v: string) => void; onNext: () => void; botPad: number }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>We'll personalize your hub just for you</Text>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onChange}
        placeholder="Enter your name"
        placeholderTextColor={C.textTertiary}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onNext}
      />
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <LinearGradient colors={[C.accent, "#FF6B35"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function ConfirmStep({ name, sports, teams, onFinish }: {
  name: string; sports: string[]; teams: string[]; onFinish: () => void;
}) {
  const SPORT_EMOJIS: Record<string, string> = {
    NBA: "🏀", NFL: "🏈", MLB: "⚾", MLS: "⚽", NHL: "🏒",
    EPL: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", UCL: "⭐", LIGA: "🇪🇸", NCAAB: "🎓", WNBA: "🏀", UFC: "🥋",
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Looks good, {name.trim() || "friend"}!</Text>
      <Text style={styles.stepSubtitle}>Here's what your hub will look like</Text>

      <View style={confirmS.card}>
        {/* Name row */}
        <View style={confirmS.row}>
          <View style={confirmS.iconBox}>
            <Ionicons name="person" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={confirmS.rowLabel}>Name</Text>
            <Text style={confirmS.rowValue}>{name.trim() || "Sports Fan"}</Text>
          </View>
        </View>

        <View style={confirmS.sep} />

        {/* Sports row */}
        <View style={confirmS.row}>
          <View style={confirmS.iconBox}>
            <Ionicons name="trophy" size={16} color={C.accentGold} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={confirmS.rowLabel}>Sports ({sports.length})</Text>
            <View style={confirmS.pillWrap}>
              {sports.map(s => (
                <View key={s} style={confirmS.pill}>
                  <Text style={confirmS.pillEmoji}>{SPORT_EMOJIS[s] ?? "🏆"}</Text>
                  <Text style={confirmS.pillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={confirmS.sep} />

        {/* Teams row */}
        <View style={confirmS.row}>
          <View style={confirmS.iconBox}>
            <Ionicons name="star" size={16} color={C.accentGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={confirmS.rowLabel}>Teams following</Text>
            <Text style={confirmS.rowValue}>
              {teams.length > 0 ? `${teams.length} team${teams.length !== 1 ? "s" : ""}` : "None selected"}
            </Text>
            {teams.length > 0 && (
              <Text style={confirmS.teamNames} numberOfLines={2}>
                {teams.slice(0, 4).join(", ")}{teams.length > 4 ? ` +${teams.length - 4} more` : ""}
              </Text>
            )}
          </View>
        </View>
      </View>

      <Pressable style={styles.primaryBtn} onPress={onFinish}>
        <LinearGradient colors={[C.accent, "#FF6B35"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryBtnText}>Enter My Hub</Text>
          <Ionicons name="trophy" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const confirmS = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
    gap: 16,
  },
  row: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rowLabel: {
    color: C.textTertiary, fontSize: 11, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  rowValue: { color: C.text, fontSize: 17, fontWeight: "700", marginTop: 2, fontFamily: "Inter_700Bold" },
  teamNames: { color: C.textSecondary, fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  sep: { height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 2 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${C.accent}22`, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${C.accent}44`,
  },
  pillEmoji: { fontSize: 12 },
  pillText: { color: C.accent, fontSize: 12, fontWeight: "700" },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  progressBar: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressDotActive: {
    backgroundColor: C.accent,
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,59,48,0.2)",
    zIndex: -1,
  },
  welcomeText: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 44,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 4,
    lineHeight: 50,
    fontFamily: "Inter_700Bold",
  },
  tagline: {
    fontSize: 16,
    color: C.textSecondary,
    marginTop: 8,
    fontFamily: "Inter_400Regular",
  },
  featureList: {
    gap: 14,
    width: "100%",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,59,48,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: C.textSecondary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  stepContainer: {
    flex: 1,
    paddingTop: 20,
    gap: 20,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  stepSubtitle: {
    fontSize: 15,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: -12,
  },
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sportChip: {
    width: (width - 48 - 12) / 2,
    height: 70,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  sportChipActive: {
    borderColor: C.accent,
  },
  sportLabel: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sportLabelActive: {
    color: "#fff",
  },
  teamChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  teamChipActive: {
    borderColor: C.accent,
    backgroundColor: "rgba(255,59,48,0.08)",
  },
  teamChipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamInitial: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamInitialText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  teamChipText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  teamChipTextActive: {
    color: C.text,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  nameInput: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: C.text,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
});
