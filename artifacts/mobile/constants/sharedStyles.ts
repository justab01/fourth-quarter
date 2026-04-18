import Colors from "./colors";
import { SPACING, RADIUS } from "./theme";

const C = Colors.dark;

export const sharedStyles = {
  // Standard card container
  cardContainer: {
    backgroundColor: C.card,
    borderRadius: RADIUS.lg,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  // Chip/pill button
  chipButton: {
    borderRadius: RADIUS.pill,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  // Live badge
  liveBadge: {
    backgroundColor: C.live,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },

  // Section header text
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },

  // Glass overlay
  glassOverlay: {
    backgroundColor: C.glassLight,
  },
};

export default sharedStyles;