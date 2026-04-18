import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Animated, Dimensions, Platform, KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { SPORTS, TEAMS_BY_LEAGUE } from "@/constants/sports";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const STEPS = ["welcome", "sports", "teams", "mode", "name", "confirm"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { savePreferences, preferences } = usePreferences();

  const [step, setStep] = useState<Step>("welcome");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<"fan" | "nerd">("fan");
  const [userName, setUserName] = useState("Abraham");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : Math.max(insets.bottom, 16);

  const advance = (next: Step) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
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
      appMode: selectedMode,
      onboardingComplete: true,
    });
    router.replace("/(tabs)");
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: topPad }]}>
        <LinearGradient
          colors={["#0A0A0F", "#0D0D1A", "#0A0A0F"]}
          style={StyleSheet.absoluteFill}
        />

        {step !== "welcome" && (
          <View style={styles.progressBar}>
            {[1, 2, 3, 4, 5].map((i) => (
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
              botPad={botPad}
            />
          )}
          {step === "teams" && (
            <TeamsStep
              teams={availableTeams}
              selected={selectedTeams}
              onToggle={toggleTeam}
              onNext={() => advance("mode")}
              botPad={botPad}
            />
          )}
          {step === "mode" && (
            <ModeStep
              selected={selectedMode}
              onSelect={setSelectedMode}
              onNext={() => advance("name")}
              botPad={botPad}
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
              mode={selectedMode}
              onFinish={handleFinish}
              botPad={botPad}
            />
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Reusable pinned button ───────────────────────────────────────────────────
function PrimaryButton({
  label, icon = "arrow-forward", onPress, disabled = false, botPad,
}: { label: string; icon?: string; onPress: () => void; disabled?: boolean; botPad: number }) {
  return (
    <View style={[btnS.wrap, { paddingBottom: botPad }]}>
      <Pressable style={[btnS.btn, disabled && btnS.disabled]} onPress={disabled ? undefined : onPress}>
        <LinearGradient
          colors={disabled ? ["#2A2A2A", "#2A2A2A"] : [C.accent, "#FF6B35"]}
          style={btnS.grad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={btnS.text}>{label}</Text>
          <Ionicons name={icon as any} size={20} color={disabled ? C.textTertiary : "#fff"} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const btnS = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  btn: { borderRadius: 16, overflow: "hidden" },
  disabled: { opacity: 0.45 },
  grad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17,
  },
  text: { color: "#fff", fontSize: 17, fontWeight: "700", fontFamily: FONTS.bodyBold },
});

// ─── Welcome ──────────────────────────────────────────────────────────────────
function WelcomeStep({ onNext, botPad }: { onNext: () => void; botPad: number }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(logoAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.welcomeScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.logoContainer, {
          opacity: logoAnim,
          transform: [
            { scale: logoAnim },
            { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
        }]}>
          <LinearGradient colors={[C.accent, "#FF6B35"]} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="trophy" size={44} color="#fff" />
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
      </ScrollView>

      <PrimaryButton label="Get Started" onPress={onNext} botPad={botPad} />
    </View>
  );
}

// ─── Sports ───────────────────────────────────────────────────────────────────
function SportsStep({ selected, onToggle, onNext, canContinue, botPad }: {
  selected: string[]; onToggle: (id: string) => void; onNext: () => void;
  canContinue: boolean; botPad: number;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.stepScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>

      <PrimaryButton
        label="Continue"
        onPress={onNext}
        disabled={!canContinue}
        botPad={botPad}
      />
    </View>
  );
}

// ─── Teams ────────────────────────────────────────────────────────────────────
function TeamsStep({ teams, selected, onToggle, onNext, botPad }: {
  teams: string[]; selected: string[]; onToggle: (t: string) => void;
  onNext: () => void; botPad: number;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Pick Your Teams</Text>
        <Text style={styles.stepSubtitle}>Choose the teams you follow</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {teams.length === 0 ? (
          <Text style={{ color: C.textTertiary, textAlign: "center", marginTop: 32, fontFamily: FONTS.body }}>
            No teams available for the selected sports
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

      <PrimaryButton
        label={selected.length > 0 ? `Continue (${selected.length})` : "Skip"}
        onPress={onNext}
        botPad={botPad}
      />
    </View>
  );
}

// ─── Mode ─────────────────────────────────────────────────────────────────────
function ModeStep({ selected, onSelect, onNext, botPad }: {
  selected: "fan" | "nerd"; onSelect: (m: "fan" | "nerd") => void; onNext: () => void; botPad: number;
}) {
  const isFan = selected === "fan";
  const isNerd = selected === "nerd";
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.stepScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>How do you watch?</Text>
        <Text style={styles.stepSubtitle}>Pick your experience — you can change this anytime</Text>

        <Pressable
          onPress={() => { Haptics.selectionAsync(); onSelect("fan"); }}
          style={[modeS.card, isFan && modeS.cardActiveFan]}
        >
          <View style={[modeS.iconWrap, isFan && { backgroundColor: `${C.accent}33` }]}>
            <Ionicons name="heart" size={26} color={isFan ? C.accent : C.textTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[modeS.cardTitle, isFan && { color: C.text }]}>Fan Mode</Text>
            <Text style={modeS.cardDesc}>Clean scores, key moments, simple stats. Perfect for casual fans who want the story.</Text>
          </View>
          {isFan && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
        </Pressable>

        <Pressable
          onPress={() => { Haptics.selectionAsync(); onSelect("nerd"); }}
          style={[modeS.card, isNerd && modeS.cardActiveNerd]}
        >
          <View style={[modeS.iconWrap, isNerd && { backgroundColor: `${C.accentGold}33` }]}>
            <Ionicons name="analytics" size={26} color={isNerd ? C.accentGold : C.textTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[modeS.cardTitle, isNerd && { color: C.text }]}>Nerd Mode</Text>
            <Text style={modeS.cardDesc}>Win probability, advanced metrics, full data. For the analytics-obsessed.</Text>
          </View>
          {isNerd && <Ionicons name="checkmark-circle" size={22} color={C.accentGold} />}
        </Pressable>
      </ScrollView>

      <PrimaryButton label="Continue" onPress={onNext} botPad={botPad} />
    </View>
  );
}

const modeS = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: C.glassLight,
    borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: C.glassMedium,
    marginBottom: 14,
  },
  cardActiveFan: {
    borderColor: C.accent,
    backgroundColor: `${C.accent}10`,
  },
  cardActiveNerd: {
    borderColor: C.accentGold,
    backgroundColor: `${C.accentGold}10`,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    color: C.textSecondary, fontSize: 17, fontWeight: "800",
    fontFamily: FONTS.bodyBold, marginBottom: 4,
  },
  cardDesc: {
    color: C.textTertiary, fontSize: 13,
    fontFamily: FONTS.body, lineHeight: 18,
  },
});

// ─── Name ─────────────────────────────────────────────────────────────────────
function NameStep({ name, onChange, onNext, botPad }: {
  name: string; onChange: (v: string) => void; onNext: () => void; botPad: number;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.stepScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>

      <PrimaryButton label="Continue" onPress={onNext} botPad={botPad} />
    </View>
  );
}

// ─── Confirm ──────────────────────────────────────────────────────────────────
function ConfirmStep({ name, sports, teams, mode, onFinish, botPad }: {
  name: string; sports: string[]; teams: string[]; mode: "fan" | "nerd"; onFinish: () => void; botPad: number;
}) {
  const SPORT_EMOJIS: Record<string, string> = {
    NBA: "🏀", NFL: "🏈", MLB: "⚾", MLS: "⚽", NHL: "🏒",
    EPL: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", UCL: "⭐", LIGA: "🇪🇸", NCAAB: "🎓", WNBA: "🏀", UFC: "🥋",
  };
  const modeColor = mode === "nerd" ? C.accentGold : C.accent;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.stepScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>Looks good, {name.trim() || "friend"}!</Text>
        <Text style={styles.stepSubtitle}>Here's your personalized hub setup</Text>

        <View style={confirmS.card}>
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

          <View style={confirmS.row}>
            <View style={[confirmS.iconBox, { backgroundColor: `${modeColor}22` }]}>
              <Ionicons name={mode === "nerd" ? "analytics" : "heart"} size={16} color={modeColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={confirmS.rowLabel}>Experience</Text>
              <Text style={[confirmS.rowValue, { color: modeColor }]}>
                {mode === "nerd" ? "⚡ Nerd Mode" : "❤️ Fan Mode"}
              </Text>
            </View>
          </View>

          <View style={confirmS.sep} />

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
      </ScrollView>

      <PrimaryButton label="Enter My Hub" icon="trophy" onPress={onFinish} botPad={botPad} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    backgroundColor: C.glassMedium,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rowLabel: {
    color: C.textTertiary, fontSize: 11, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  rowValue: { color: C.text, fontSize: 17, fontWeight: "700", marginTop: 2, fontFamily: FONTS.bodyBold },
  teamNames: { color: C.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  sep: { height: 1, backgroundColor: C.glassMedium },
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
    paddingVertical: 14,
    paddingHorizontal: 24,
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

  // Welcome scroll content
  welcomeScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    paddingVertical: 24,
  },

  // Generic step scroll content
  stepScroll: {
    flexGrow: 1,
    gap: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Step header (used when scroll starts inside)
  stepHeader: {
    gap: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },

  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,59,48,0.18)",
    zIndex: -1,
  },
  welcomeText: {
    alignItems: "center",
    gap: 6,
  },
  appName: {
    fontSize: 40,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 4,
    lineHeight: 46,
    fontFamily: FONTS.bodyBold,
  },
  tagline: {
    fontSize: 15,
    color: C.textSecondary,
    marginTop: 6,
    fontFamily: FONTS.body,
  },
  featureList: {
    gap: 12,
    width: "100%",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,59,48,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: C.textSecondary,
    fontSize: 15,
    fontFamily: FONTS.bodyMedium,
  },

  stepTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: C.text,
    fontFamily: FONTS.bodyBold,
    lineHeight: 36,
  },
  stepSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: FONTS.body,
  },

  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sportChip: {
    width: (width - 48 - 10) / 2,
    height: 64,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  sportChipActive: {
    borderColor: C.accent,
  },
  sportLabel: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
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
    paddingVertical: 13,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamInitialText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
  },
  teamChipText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: FONTS.bodyMedium,
  },
  teamChipTextActive: {
    color: C.text,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
  },

  nameInput: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 17,
    color: C.text,
    fontSize: 18,
    fontFamily: FONTS.bodyMedium,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
});
