import { Router, type IRouter } from "express";
import { db, userPreferences, insertUserPreferencesSchema } from "@workspace/db";

const router: IRouter = Router();

const defaultPrefs = (userId: string) => ({
  userId,
  name: "Sports Fan",
  favoriteTeams: [],
  favoriteLeagues: [],
  favoritePlayers: [],
  rivals: [],
  darkMode: true,
  notifications: true,
});

router.get("/user/preferences", async (req, res) => {
  const { userId } = req.query as { userId: string };
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  // Return defaults if no database
  if (!db) {
    res.json(defaultPrefs(userId));
    return;
  }

  try {
    const prefs = await db!.query.userPreferences.findFirst({
      where: (u, { eq }) => eq(u.userId, userId),
    });

    if (!prefs) {
      res.json(defaultPrefs(userId));
      return;
    }

    res.json({
      userId: prefs.userId,
      name: prefs.name,
      favoriteTeams: prefs.favoriteTeams,
      favoriteLeagues: prefs.favoriteLeagues,
      favoritePlayers: prefs.favoritePlayers,
      rivals: prefs.rivals,
      darkMode: prefs.darkMode,
      notifications: prefs.notifications,
    });
  } catch (err) {
    console.error("Get prefs error:", err);
    res.json(defaultPrefs(userId));
  }
});

router.post("/user/preferences", async (req, res) => {
  // Return success if no database (mock mode)
  if (!db) {
    res.json({ success: true });
    return;
  }

  try {
    const data = req.body;

    await db!.insert(userPreferences)
      .values({
        userId: data.userId,
        name: data.name,
        favoriteTeams: data.favoriteTeams ?? [],
        favoriteLeagues: data.favoriteLeagues ?? [],
        favoritePlayers: data.favoritePlayers ?? [],
        rivals: data.rivals ?? [],
        darkMode: data.darkMode ?? true,
        notifications: data.notifications ?? true,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          name: data.name,
          favoriteTeams: data.favoriteTeams ?? [],
          favoriteLeagues: data.favoriteLeagues ?? [],
          favoritePlayers: data.favoritePlayers ?? [],
          rivals: data.rivals ?? [],
          darkMode: data.darkMode ?? true,
          notifications: data.notifications ?? true,
          updatedAt: new Date(),
        },
      });

    res.json({ success: true });
  } catch (err) {
    console.error("Save prefs error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;