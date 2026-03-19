import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userPreferences, insertUserPreferencesSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/user/preferences", async (req, res) => {
  const { userId } = req.query as { userId: string };
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const prefs = await db.query.userPreferences.findFirst({
      where: (u, { eq }) => eq(u.userId, userId),
    });

    if (!prefs) {
      return res.json({
        userId,
        name: "Sports Fan",
        favoriteTeams: [],
        favoriteLeagues: [],
        favoritePlayers: [],
        rivals: [],
        darkMode: true,
        notifications: true,
      });
    }

    return res.json({
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
    return res.json({
      userId,
      name: "Sports Fan",
      favoriteTeams: [],
      favoriteLeagues: [],
      favoritePlayers: [],
      rivals: [],
      darkMode: true,
      notifications: true,
    });
  }
});

router.post("/user/preferences", async (req, res) => {
  try {
    const data = req.body;
    
    await db.insert(userPreferences)
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

    return res.json({ success: true });
  } catch (err) {
    console.error("Save prefs error:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
