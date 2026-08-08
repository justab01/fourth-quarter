import React from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { SportFloatingNav, SPORT_NAV_CLEARANCE } from "@/components/SportFloatingNav";
import { FONTS } from "@/constants/typography";
import { api } from "@/utils/api";

const P = { ink: "#2C3E50", inkDeep: "#1E2D38", paper: "#F4F1EC", pearl: "#E8DED6", sage: "#C8CDC7", green: "#315847", blueGray: "#758789", sand: "#C9B48B", white: "#FFFFFF", muted: "#6C777B", line: "rgba(44,62,80,.14)" };

export default function CourseAtlasRoute() {
  const { id, tour, name, tournament } = useLocalSearchParams<{ id: string; tour?: string; name?: string; tournament?: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({
    queryKey: ["golf-course-tournament", id, tour],
    queryFn: () => api.getGolfTournament(id!, tour === "LPGA" || tour === "LIV" ? tour : "PGA"),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
  const event = data?.tournament;
  const course = event?.course;
  const courseName = event?.venue || name || "Course Atlas";
  const eventName = event?.name || tournament || "Current tournament";

  return (
    <View style={[styles.root, { paddingTop: Platform.OS === "web" ? 48 : insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPORT_NAV_CLEARANCE + 38 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="chevron-back" size={23} color={P.ink} /></Pressable>
          <View style={styles.headerCenter}><Text style={styles.headerBrand}>THE FOURTH QUARTER</Text><Text style={styles.headerTitle}>COURSE ATLAS</Text></View>
          <View style={styles.iconButton}><Ionicons name="compass-outline" size={21} color={P.green} /></View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.eyebrow}>KNOW THE GROUND</Text>
          <Text style={styles.courseName}>{courseName}</Text>
          <Text style={styles.eventName}>{eventName}{event?.location ? ` · ${event.location}` : ""}</Text>
        </View>

        <LinearGradient colors={[P.blueGray, P.green, P.inkDeep]} style={styles.atlasCanvas}>
          <View style={styles.atlasTop}><View style={styles.dataPill}><Ionicons name="shield-checkmark" size={14} color={P.sand} /><Text style={styles.dataPillText}>VERIFIED DATA ONLY</Text></View><Ionicons name="layers-outline" size={24} color={P.sage} /></View>
          <View style={styles.atlasMessage}>
            <View style={styles.mapIcon}><Ionicons name="map-outline" size={35} color={P.paper} /></View>
            <Text style={styles.atlasTitle}>{isLoading ? "Checking course coverage…" : course ? `${course.par ? `Par ${course.par}. ` : ""}${course.totalYards ? `${course.totalYards.toLocaleString()} yards.` : "The full routing is verified."}` : "Interactive geometry is not available yet"}</Text>
            <Text style={styles.atlasText}>{course ? `Every published hole at ${course.name} is mapped below with verified par and yardage. Exact shot locations stay hidden until licensed coordinates are available.` : "The current scoring provider supplies the tournament and hole scorecards, but not licensed course coordinates. This route will become pan-and-zoom interactive only when verified geometry is available."}</Text>
            {course ? (
              <View style={styles.courseFacts}>
                <View style={styles.courseFact}><Text style={styles.courseFactValue}>{course.par ?? "—"}</Text><Text style={styles.courseFactLabel}>PAR</Text></View>
                <View style={styles.courseFact}><Text style={styles.courseFactValue}>{course.totalYards?.toLocaleString() ?? "—"}</Text><Text style={styles.courseFactLabel}>YARDS</Text></View>
                <View style={styles.courseFact}><Text style={styles.courseFactValue}>{course.holes.length || "—"}</Text><Text style={styles.courseFactLabel}>HOLES</Text></View>
              </View>
            ) : null}
          </View>
          {isLoading ? <ActivityIndicator color={P.paper} /> : null}
        </LinearGradient>

        {course?.weather ? (
          <View style={styles.weatherCard}>
            <View style={styles.weatherIcon}><Ionicons name="partly-sunny-outline" size={23} color={P.green} /></View>
            <View style={{ flex: 1 }}><Text style={styles.weatherEyebrow}>ON THE GROUND</Text><Text style={styles.weatherTitle}>{course.weather.condition || "Current conditions"}</Text><Text style={styles.weatherMeta}>{course.weather.windDirection ? `${course.weather.windDirection} wind` : "Wind"}{course.weather.windSpeed != null ? ` at ${course.weather.windSpeed} mph` : ""}{course.weather.precipitation != null ? ` · ${course.weather.precipitation}% rain` : ""}</Text></View>
            <Text style={styles.weatherTemp}>{course.weather.temperature != null ? `${course.weather.temperature}°` : "—"}</Text>
          </View>
        ) : null}

        {course && course.holes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>THE ROUTING</Text>
            <Text style={styles.sectionTitle}>Every hole at a glance</Text>
            {[{ label: "Front nine", holes: course.holes.slice(0, 9), par: course.parOut }, { label: "Back nine", holes: course.holes.slice(9, 18), par: course.parIn }].map((side) => (
              <View key={side.label} style={styles.nineCard}>
                <View style={styles.nineHeader}><Text style={styles.nineTitle}>{side.label}</Text><Text style={styles.ninePar}>{side.par != null ? `PAR ${side.par}` : ""}</Text></View>
                <View style={styles.holeGrid}>{side.holes.map((hole) => <View key={hole.number} style={styles.holeCard}><Text style={styles.holeNumber}>{hole.number}</Text><Text style={styles.holePar}>PAR {hole.par ?? "—"}</Text><Text style={styles.holeYards}>{hole.yards != null ? `${hole.yards} YDS` : "—"}</Text></View>)}</View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>AVAILABLE NOW</Text>
          <Text style={styles.sectionTitle}>What the current feed can show</Text>
          <View style={styles.capabilities}>
            <View style={styles.capability}><View style={styles.capabilityIcon}><Ionicons name="podium-outline" size={20} color={P.green} /></View><View style={{ flex: 1 }}><Text style={styles.capabilityTitle}>Live leaderboard</Text><Text style={styles.capabilityText}>Position, total, round score and accurate holes completed.</Text></View><Ionicons name={event?.coverage.leaderboard ? "checkmark-circle" : "remove-circle-outline"} size={21} color={event?.coverage.leaderboard ? P.green : P.blueGray} /></View>
            <View style={styles.capability}><View style={styles.capabilityIcon}><Ionicons name="grid-outline" size={20} color={P.green} /></View><View style={{ flex: 1 }}><Text style={styles.capabilityTitle}>Hole scorecards</Text><Text style={styles.capabilityText}>Every published hole remains in the golfer’s true playing order.</Text></View><Ionicons name={event?.coverage.scorecards ? "checkmark-circle" : "remove-circle-outline"} size={21} color={event?.coverage.scorecards ? P.green : P.blueGray} /></View>
            <View style={styles.capability}><View style={styles.capabilityIcon}><Ionicons name="navigate-outline" size={20} color={P.green} /></View><View style={{ flex: 1 }}><Text style={styles.capabilityTitle}>Shot trails and ball locations</Text><Text style={styles.capabilityText}>Hidden until a licensed shot-coordinate provider is connected.</Text></View><Ionicons name="lock-closed-outline" size={19} color={P.blueGray} /></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>THE ATLAS STANDARD</Text>
          <Text style={styles.sectionTitle}>What this route is built to become</Text>
          <View style={styles.futureGrid}>
            {[{ icon: "scan-outline", title: "Real hole paths", text: "Tee, fairway, hazards and green from licensed or attributed geometry." }, { icon: "expand-outline", title: "Native gestures", text: "Pan, pinch, rotate, reset and tap a hole without trapping page scroll." }, { icon: "analytics-outline", title: "Difficulty overlay", text: "Field scoring distribution when the data provider supports it." }, { icon: "flag-outline", title: "Leader progress", text: "Where groups are on the course—without inventing exact ball positions." }].map((item) => <View key={item.title} style={styles.futureCard}><Ionicons name={item.icon as any} size={22} color={P.sand} /><Text style={styles.futureTitle}>{item.title}</Text><Text style={styles.futureText}>{item.text}</Text></View>)}
          </View>
        </View>

        <Pressable onPress={() => router.push({ pathname: "/golf/tournament/[id]", params: { id, tour } } as any)} style={styles.returnButton}><Text style={styles.returnButtonText}>Return to Tournament Room</Text><Ionicons name="arrow-forward" size={17} color={P.paper} /></Pressable>
      </ScrollView>
      <SportFloatingNav active="sports" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper }, header: { height: 68, marginHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", position: "relative" }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, headerCenter: { position: "absolute", left: 54, right: 54, alignItems: "center" }, headerBrand: { fontFamily: FONTS.bodyBold, fontSize: 8, letterSpacing: 1.7, color: P.blueGray }, headerTitle: { fontFamily: FONTS.display, fontSize: 21, color: P.ink, marginTop: 1 }, identity: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 }, eyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.5, color: P.green }, courseName: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 41, color: P.ink, marginTop: 6 }, eventName: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, color: P.muted, marginTop: 6 }, atlasCanvas: { minHeight: 405, marginHorizontal: 20, borderRadius: 28, padding: 20, justifyContent: "space-between", overflow: "hidden" }, atlasTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, dataPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 15, backgroundColor: "rgba(255,255,255,.12)", flexDirection: "row", gap: 7, alignItems: "center" }, dataPillText: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1, color: P.paper }, atlasMessage: { maxWidth: 520 }, mapIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: "rgba(255,255,255,.12)", alignItems: "center", justifyContent: "center" }, atlasTitle: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 35, color: P.white, marginTop: 20 }, atlasText: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: P.sage, marginTop: 9 }, courseFacts: { flexDirection: "row", marginTop: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.18)" }, courseFact: { flex: 1, paddingTop: 13 }, courseFactValue: { fontFamily: FONTS.display, fontSize: 19, color: P.white }, courseFactLabel: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1, color: P.sage, marginTop: 2 }, weatherCard: { marginHorizontal: 20, marginTop: 12, minHeight: 82, borderRadius: 22, padding: 14, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, flexDirection: "row", alignItems: "center", gap: 12 }, weatherIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: P.pearl, alignItems: "center", justifyContent: "center" }, weatherEyebrow: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1.1, color: P.green }, weatherTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: P.ink, marginTop: 3 }, weatherMeta: { fontFamily: FONTS.body, fontSize: 9, color: P.muted, marginTop: 3 }, weatherTemp: { fontFamily: FONTS.display, fontSize: 28, color: P.ink }, section: { paddingHorizontal: 20, marginTop: 34 }, sectionEyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.4, color: P.green }, sectionTitle: { fontFamily: FONTS.display, fontSize: 27, lineHeight: 32, color: P.ink, marginTop: 5, marginBottom: 14 }, nineCard: { borderRadius: 22, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, padding: 12, marginBottom: 12 }, nineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 3, paddingBottom: 10 }, nineTitle: { fontFamily: FONTS.display, fontSize: 20, color: P.ink }, ninePar: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.1, color: P.green }, holeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, holeCard: { width: "31.8%", minHeight: 72, borderRadius: 13, backgroundColor: P.paper, padding: 10 }, holeNumber: { fontFamily: FONTS.display, fontSize: 21, color: P.ink }, holePar: { fontFamily: FONTS.bodyBold, fontSize: 8, color: P.green, marginTop: 4 }, holeYards: { fontFamily: FONTS.mono, fontSize: 7, color: P.muted, marginTop: 2 }, capabilities: { borderRadius: 22, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, overflow: "hidden" }, capability: { minHeight: 88, padding: 14, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: P.line }, capabilityIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: P.pearl, alignItems: "center", justifyContent: "center" }, capabilityTitle: { fontFamily: FONTS.bodyBold, fontSize: 12, color: P.ink }, capabilityText: { fontFamily: FONTS.body, fontSize: 9.5, lineHeight: 14, color: P.muted, marginTop: 4 }, futureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, futureCard: { width: "48%", minHeight: 162, borderRadius: 21, backgroundColor: P.ink, padding: 15 }, futureTitle: { fontFamily: FONTS.display, fontSize: 19, color: P.paper, marginTop: 16 }, futureText: { fontFamily: FONTS.body, fontSize: 9.5, lineHeight: 14, color: P.sage, marginTop: 6 }, returnButton: { minHeight: 52, marginHorizontal: 20, marginTop: 28, borderRadius: 26, backgroundColor: P.green, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, returnButtonText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: P.paper },
});
