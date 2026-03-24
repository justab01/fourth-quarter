import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Switch, Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePreferences } from "@/context/PreferencesContext";
import { TEAMS_BY_LEAGUE, SPORTS } from "@/constants/sports";
import { SearchButton } from "@/components/SearchButton";

const C = Colors.dark;

const LEAGUE_COLORS: Record<string, string> = {
  NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.nhl,
  WNBA: C.wnba, NCAAB: C.ncaab, EPL: C.eplBright, UCL: C.ucl, LIGA: C.liga,
  UFC: C.ufc, BOXING: C.boxing, ATP: C.atp, WTA: C.wta,
  OLYMPICS: C.olympics, XGAMES: C.xgames,
};

function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={statCard.container}>
      <Text style={[statCard.value, color ? { color } : {}]}>{value}</Text>
      <Text style={statCard.label}>{label}</Text>
    </View>
  );
}

const statCard = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  value: {
    color: C.text,
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
  },
  label: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

function FandomCommandCenter({ preferences, primaryColor }: { preferences: any; primaryColor: string }) {
  const SPORT_ICONS: Record<string, string> = {
    NBA: "🏀", NFL: "🏈", MLB: "⚾", MLS: "⚽", NHL: "🏒",
    EPL: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", UCL: "⭐", LIGA: "🇪🇸", NCAAB: "🎓", WNBA: "🏀",
    UFC: "🥋", BOXING: "🥊", ATP: "🎾", WTA: "🎾",
    OLYMPICS: "🏅", XGAMES: "🏂",
  };

  const favLeague = preferences.favoriteLeagues[0] ?? null;
  const teamsCount = preferences.favoriteTeams.length;
  const leaguesCount = preferences.favoriteLeagues.length;

  const fandomItems = [
    { icon: "people", label: "Teams", value: teamsCount.toString(), color: primaryColor },
    { icon: "trophy", label: "Sports", value: leaguesCount.toString(), color: C.accentGold },
    { icon: "stats-chart", label: "Profile", value: teamsCount > 0 && leaguesCount > 0 ? "Complete" : "Set up", color: C.accentGreen },
  ];

  const insights: string[] = [];
  if (favLeague) insights.push(`Your go-to league: ${SPORT_ICONS[favLeague] ?? "🏆"} ${favLeague}`);
  if (teamsCount >= 3) insights.push(`Following ${teamsCount} teams across ${leaguesCount} sports`);
  else if (teamsCount === 1) insights.push(`Following 1 team — add more for better recommendations`);
  if (leaguesCount === 0) insights.push("Add your favorite sports to personalize the app");

  return (
    <View style={fanS.section}>
      <Text style={fanS.heading}>My Fandom</Text>
      <View style={fanS.statsRow}>
        {fandomItems.map(item => (
          <View key={item.label} style={fanS.statBox}>
            <Text style={[fanS.statVal, { color: item.color }]}>{item.value}</Text>
            <Text style={fanS.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      {insights.length > 0 && (
        <View style={fanS.insightCard}>
          {insights.map((ins, i) => (
            <View key={i} style={fanS.insightRow}>
              <Ionicons name="sparkles" size={12} color={primaryColor} />
              <Text style={fanS.insightText}>{ins}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const fanS = StyleSheet.create({
  section: { gap: 10, paddingVertical: 4 },
  heading: {
    fontSize: 18, fontWeight: "800", color: C.text,
    fontFamily: "Inter_700Bold", letterSpacing: -0.2,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: C.cardBorder, gap: 4,
  },
  statVal: { fontSize: 24, fontWeight: "900", fontFamily: "Inter_700Bold" },
  statLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  insightCard: {
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14,
    padding: 12, gap: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  insightText: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { preferences, setPreferences, savePreferences } = usePreferences();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(preferences.name);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const handleSaveName = async () => {
    setEditingName(false);
    const newName = nameInput.trim() || "Sports Fan";
    await savePreferences({ ...preferences, name: newName });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleTeam = (team: string) => {
    Haptics.selectionAsync();
    const cur = preferences.favoriteTeams;
    const updated = cur.includes(team) ? cur.filter(t => t !== team) : [...cur, team];
    setPreferences({ favoriteTeams: updated });
  };

  const toggleLeague = (league: string) => {
    Haptics.selectionAsync();
    const cur = preferences.favoriteLeagues;
    const updated = cur.includes(league) ? cur.filter(l => l !== league) : [...cur, league];
    setPreferences({ favoriteLeagues: updated });
  };

  const handleReonboard = () => {
    savePreferences({ ...preferences, onboardingComplete: false });
    router.replace("/onboarding" as any);
  };

  const availableTeams = preferences.favoriteLeagues.length > 0
    ? preferences.favoriteLeagues.flatMap(l => TEAMS_BY_LEAGUE[l] ?? [])
    : Object.values(TEAMS_BY_LEAGUE).flat().slice(0, 16);

  const primaryColor = preferences.favoriteTeams.includes("Houston Rockets")
    ? C.accent
    : preferences.favoriteLeagues.length > 0
    ? (LEAGUE_COLORS[preferences.favoriteLeagues[0]] ?? C.accent)
    : C.accent;

  const initials = (preferences.name ?? "S").split(" ").map(w => w.charAt(0).toUpperCase()).slice(0, 2).join("");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <SearchButton />
        </View>

        {/* AVATAR + NAME CARD */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[`${primaryColor}18`, "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.profileTop}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={[primaryColor, `${primaryColor}88`]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <View style={[styles.avatarRing, { borderColor: `${primaryColor}55` }]} />
            </View>

            <View style={{ flex: 1 }}>
              {editingName ? (
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  onBlur={handleSaveName}
                  onSubmitEditing={handleSaveName}
                  autoFocus
                  returnKeyType="done"
                  selectTextOnFocus
                />
              ) : (
                <Pressable onPress={() => { setNameInput(preferences.name); setEditingName(true); }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName}>{preferences.name}</Text>
                    <Ionicons name="pencil" size={14} color={C.textTertiary} />
                  </View>
                </Pressable>
              )}
              <Text style={styles.profileSub}>
                {preferences.favoriteLeagues.join(" · ") || "No leagues selected"}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <StatCard value={preferences.favoriteTeams.length} label="Teams" color={primaryColor} />
            <StatCard value={preferences.favoriteLeagues.length} label="Leagues" />
            <StatCard value="100%" label="Ready" color={C.accentGreen} />
          </View>
        </View>

        {/* FANDOM COMMAND CENTER */}
        <FandomCommandCenter preferences={preferences} primaryColor={primaryColor} />

        {/* LEAGUES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Leagues</Text>
          <View style={styles.chipsWrap}>
            {SPORTS.map(sport => {
              const active = preferences.favoriteLeagues.includes(sport.id);
              const color = LEAGUE_COLORS[sport.id] ?? C.accent;
              return (
                <Pressable key={sport.id} onPress={() => toggleLeague(sport.id)}>
                  <View style={[styles.leagueChip, active && { borderColor: color, backgroundColor: `${color}18` }]}>
                    <Ionicons name={sport.icon as any} size={14} color={active ? color : C.textTertiary} />
                    <Text style={[styles.leagueChipText, active && { color }]}>{sport.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* TEAMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Teams</Text>
          <View style={styles.teamsList}>
            {availableTeams.slice(0, 14).map(team => {
              const active = preferences.favoriteTeams.includes(team);
              const leagueKey = Object.entries(TEAMS_BY_LEAGUE).find(([, teams]) => teams.includes(team))?.[0];
              const teamColor = leagueKey ? (LEAGUE_COLORS[leagueKey] ?? C.accent) : C.accent;
              return (
                <Pressable key={team} onPress={() => toggleTeam(team)}>
                  <View style={[styles.teamRow, active && { borderColor: `${teamColor}55`, backgroundColor: `${teamColor}0A` }]}>
                    <View style={[styles.teamAvatar, { backgroundColor: active ? `${teamColor}22` : "rgba(255,255,255,0.07)" }]}>
                      <Text style={[styles.teamAvatarText, active && { color: teamColor }]}>
                        {team.split(" ").map(w => w.charAt(0)).slice(0, 2).join("")}
                      </Text>
                    </View>
                    <Text style={[styles.teamText, active && { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                      {team}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={20} color={teamColor} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SETTINGS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="notifications-outline"
              label="Notifications"
              right={
                <Switch
                  value={preferences.notifications}
                  onValueChange={v => { Haptics.selectionAsync(); setPreferences({ notifications: v }); }}
                  trackColor={{ false: "#222", true: C.accent }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={styles.sep} />
            <SettingRow
              icon="moon-outline"
              label="Dark Mode"
              sublabel="Always on"
              right={
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: "#222", true: C.accent }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* REDO SETUP */}
        <Pressable onPress={handleReonboard}>
          <View style={styles.redoBtn}>
            <Ionicons name="refresh-outline" size={18} color={C.accent} />
            <Text style={styles.redoBtnText}>Redo Setup</Text>
          </View>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerApp}>FOURTH QUARTER</Text>
          <Text style={styles.footerSub}>Sports. Your way. 2026.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, label, sublabel, right }: { icon: string; label: string; sublabel?: string; right: React.ReactNode }) {
  return (
    <View style={settingRowS.row}>
      <View style={settingRowS.iconWrap}>
        <Ionicons name={icon as any} size={18} color={C.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={settingRowS.label}>{label}</Text>
        {sublabel && <Text style={settingRowS.sublabel}>{sublabel}</Text>}
      </View>
      {right}
    </View>
  );
}

const settingRowS = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: C.text,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  sublabel: {
    color: C.textTertiary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, gap: 4 },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },

  profileCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    gap: 20,
    overflow: "hidden",
    marginVertical: 8,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  nameInput: {
    color: C.text,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
    paddingBottom: 2,
  },
  profileSub: {
    color: C.textTertiary,
    fontSize: 13,
    marginTop: 3,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  section: { gap: 14, paddingVertical: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  leagueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  leagueChipText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  teamsList: { gap: 8 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  teamAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  teamAvatarText: {
    color: C.text,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  teamText: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  settingsCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  sep: { height: 1, backgroundColor: C.separator, marginHorizontal: 16 },
  redoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,59,48,0.08)",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,59,48,0.25)",
    marginVertical: 4,
  },
  redoBtnText: {
    color: C.accent,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 4,
  },
  footerApp: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 3,
    fontFamily: "Inter_700Bold",
  },
  footerSub: {
    color: C.textTertiary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
