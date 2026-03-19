import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Switch, Platform, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePreferences } from "@/context/PreferencesContext";
import { TEAMS_BY_LEAGUE, SPORTS } from "@/constants/sports";

const C = Colors.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { preferences, setPreferences, savePreferences } = usePreferences();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(preferences.name);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 70;

  const handleSaveName = async () => {
    setEditingName(false);
    await savePreferences({ ...preferences, name: nameInput.trim() || "Sports Fan" });
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

  const availableTeams = preferences.favoriteLeagues.flatMap(l => TEAMS_BY_LEAGUE[l] ?? []);
  const allTeams = availableTeams.length > 0 ? availableTeams : Object.values(TEAMS_BY_LEAGUE).flat().slice(0, 12);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(preferences.name ?? "S").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            {editingName ? (
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
                autoFocus
                returnKeyType="done"
              />
            ) : (
              <Pressable onPress={() => setEditingName(true)}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{preferences.name}</Text>
                  <Ionicons name="pencil" size={14} color={C.textTertiary} />
                </View>
              </Pressable>
            )}
            <Text style={styles.userSub}>
              {preferences.favoriteTeams.length} teams · {preferences.favoriteLeagues.length} leagues
            </Text>
          </View>
        </View>

        {/* My Leagues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Leagues</Text>
          <View style={styles.chipsGrid}>
            {SPORTS.map(sport => {
              const active = preferences.favoriteLeagues.includes(sport.id);
              return (
                <Pressable key={sport.id} onPress={() => toggleLeague(sport.id)}>
                  <View style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{sport.label}</Text>
                    {active && <Ionicons name="checkmark" size={14} color={C.accent} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* My Teams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Teams</Text>
          <View style={{ gap: 8 }}>
            {allTeams.slice(0, 16).map(team => {
              const active = preferences.favoriteTeams.includes(team);
              return (
                <Pressable key={team} onPress={() => toggleTeam(team)}>
                  <View style={[styles.teamRow, active && styles.teamRowActive]}>
                    <View style={[styles.teamDot, active && { backgroundColor: C.accent }]}>
                      <Text style={styles.teamDotText}>{team.charAt(0)}</Text>
                    </View>
                    <Text style={[styles.teamText, active && { color: C.text, fontFamily: "Inter_600SemiBold" }]}>{team}</Text>
                    {active && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="notifications-outline"
              label="Notifications"
              right={
                <Switch
                  value={preferences.notifications}
                  onValueChange={v => setPreferences({ notifications: v })}
                  trackColor={{ false: "#333", true: C.accent }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={styles.separator} />
            <SettingRow
              icon="moon-outline"
              label="Dark Mode"
              right={
                <Switch
                  value={preferences.darkMode}
                  onValueChange={v => setPreferences({ darkMode: v })}
                  trackColor={{ false: "#333", true: C.accent }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Redo Onboarding */}
        <View style={styles.section}>
          <Pressable onPress={handleReonboard}>
            <View style={styles.redoBtn}>
              <Ionicons name="refresh-outline" size={18} color={C.accent} />
              <Text style={styles.redoBtnText}>Redo Setup</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>FOURTH QUARTER</Text>
          <Text style={styles.footerSub}>Sports. Your way.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, label, right }: { icon: string; label: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={18} color={C.textSecondary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, gap: 4 },
  header: { paddingVertical: 20 },
  title: { fontSize: 32, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold" },
  userCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  nameInput: {
    color: C.text, fontSize: 20, fontFamily: "Inter_700Bold",
    borderBottomWidth: 1, borderBottomColor: C.accent, paddingBottom: 2,
  },
  userSub: { color: C.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { gap: 12, paddingVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  chipActive: { borderColor: C.accent, backgroundColor: "rgba(255,59,48,0.1)" },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  chipTextActive: { color: C.accent },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  teamRowActive: { borderColor: C.accent, backgroundColor: "rgba(255,59,48,0.06)" },
  teamDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamDotText: { color: C.text, fontSize: 13, fontWeight: "700" },
  teamText: { flex: 1, color: C.textSecondary, fontSize: 15, fontFamily: "Inter_500Medium" },
  settingsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { color: C.text, fontSize: 15, fontFamily: "Inter_500Medium" },
  separator: { height: 1, backgroundColor: C.separator, marginHorizontal: 16 },
  redoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,59,48,0.1)",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
  },
  redoBtnText: { color: C.accent, fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  footerSection: { alignItems: "center", paddingVertical: 24, gap: 4 },
  footerText: { color: C.textTertiary, fontSize: 13, fontWeight: "700", letterSpacing: 2, fontFamily: "Inter_700Bold" },
  footerSub: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
});
