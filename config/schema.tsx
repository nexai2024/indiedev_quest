import { integer, json, pgTable, uniqueIndex, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

// -------------------------------------------------------------
// USER & CHARACTER SCHEMA
// -------------------------------------------------------------
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }),
  role: varchar({ length: 50 }).default('NOVICE'), // NOVICE, BUILDER, MENTOR, GUILD_MASTER, ADMIN
  characterClass: varchar({ length: 100 }).default(''),
  primaryGoal: varchar({ length: 255 }).default(''),
  level: integer().default(1),
  xp: integer().default(0),
  gold: integer().default(0),
  talentPoints: integer().default(0),
  avatarUrl: varchar({ length: 500 }),
  partyId: integer(),
  points: integer().default(0),
  subscription: varchar({ length: 50 }).default('free'),
  stripeConnectId: varchar({ length: 255 }),
});

// -------------------------------------------------------------
// QUEST LOG & SUBMISSIONS (PROOF-OF-WORK VAULT)
// -------------------------------------------------------------
export const questsTable = pgTable("quests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  questId: varchar({ length: 100 }).notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  xpReward: integer().default(100),
  goldReward: integer().default(50),
  levelReq: integer().default(1),
  category: varchar({ length: 50 }).default('Main'), // Main, Side, Fullstack, DevOps, Marketing, AI
  requirements: text()
});

export const userQuestsTable = pgTable("userQuests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  questId: varchar({ length: 100 }).notNull(),
  status: varchar({ length: 50 }).default('AVAILABLE'), // AVAILABLE, IN_PROGRESS, UNDER_REVIEW, COMPLETED, FAILED
  startedAt: timestamp().defaultNow(),
  completedAt: timestamp()
});

export const submissionsTable = pgTable("submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userQuestId: integer(),
  userId: varchar({ length: 255 }).notNull(),
  userName: varchar({ length: 255 }),
  questId: varchar({ length: 100 }),
  questTitle: varchar({ length: 255 }).notNull(),
  proofUrl: varchar({ length: 2000 }).notNull(), // First proof URL (compat)
  proofUrls: json().$type<string[]>(),
  notes: text(),
  isApproved: boolean().default(false),
  reviewNotes: text(),
  validationStatus: varchar({ length: 50 }).default("PENDING"), // PENDING, PASSED, FAILED
  validationReport: json().$type<{
    summary: string;
    requiredCount: number;
    submittedCount: number;
    passedCount: number;
    items: Array<{
      url: string;
      passed: boolean;
      reason: string;
      httpStatus?: number;
      title?: string;
    }>;
  }>(),
  createdAt: timestamp().defaultNow()
});

// -------------------------------------------------------------
// GUILD PARTIES & COHORTS
// -------------------------------------------------------------
export const partiesTable = pgTable("parties", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  mentorId: varchar({ length: 255 }),
  mentorName: varchar({ length: 255 }),
  avatar: varchar({ length: 500 }),
  createdAt: timestamp().defaultNow()
});

// -------------------------------------------------------------
// MENTORSHIP SYSTEM
// -------------------------------------------------------------
export const mentorshipsTable = pgTable("mentorships", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  mentorId: varchar({ length: 255 }).notNull(),
  mentorName: varchar({ length: 255 }),
  menteeId: varchar({ length: 255 }).notNull(),
  menteeName: varchar({ length: 255 }),
  topic: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).default('PENDING'),
  costInGold: integer().default(50),
  scheduledAt: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow(),
  sessionKind: varchar({ length: 20 }).default("LIVE"),
  paymentKind: varchar({ length: 20 }).default("GOLD"),
  slotId: integer(),
  projectUrl: varchar({ length: 2000 }),
  question: text(),
  mentorRecap: text(),
  menteeRating: integer(),
  mentorRating: integer(),
  menteeCompleted: boolean().default(false),
  mentorCompleted: boolean().default(false),
  escrowStatus: varchar({ length: 20 }).default("HELD"),
  guildCutGold: integer().default(0),
  mentorPayoutGold: integer().default(0),
  cashUsdCents: integer().default(0),
  guildCutUsdCents: integer().default(0),
  mentorPayoutUsdCents: integer().default(0),
  stripeCheckoutId: varchar({ length: 255 }),
  stripeTransferId: varchar({ length: 255 }),
  cashPaid: boolean().default(false),
});

export const mentorProfilesTable = pgTable("mentorProfiles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).notNull().default("VETTING"),
  bio: text().notNull(),
  headline: varchar({ length: 200 }),
  specialties: json().$type<string[]>(),
  hourlyRateGold: integer().notNull().default(100),
  hourlyRateUsdCents: integer().notNull().default(0),
  githubLogin: varchar({ length: 100 }),
  githubUrl: varchar({ length: 500 }),
  proofUrls: json().$type<string[]>(),
  ratingSum: integer().default(0),
  ratingCount: integer().default(0),
  sessionsCompleted: integer().default(0),
  stripeConnectId: varchar({ length: 255 }),
  rejectReason: text(),
  reviewedBy: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow(),
  reviewedAt: timestamp(),
});

export const mentorVouchesTable = pgTable(
  "mentorVouches",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    applicantId: varchar({ length: 255 }).notNull(),
    voucherId: varchar({ length: 255 }).notNull(),
    voucherName: varchar({ length: 255 }),
    note: varchar({ length: 300 }),
    createdAt: timestamp().defaultNow(),
  },
  (table) => [uniqueIndex("mentor_vouches_unique").on(table.applicantId, table.voucherId)]
);

export const mentorSlotsTable = pgTable("mentorSlots", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  mentorUserId: varchar({ length: 255 }).notNull(),
  startsAt: timestamp().notNull(),
  endsAt: timestamp().notNull(),
  status: varchar({ length: 20 }).default("OPEN"),
  sessionId: integer(),
  createdAt: timestamp().defaultNow(),
});

// -------------------------------------------------------------
// GUILD HALL MARKETPLACE (PRODUCTS)
// -------------------------------------------------------------
export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sellerId: varchar({ length: 255 }).notNull(),
  sellerName: varchar({ length: 255 }),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  priceInCents: integer().default(1000),
  priceInGold: integer().default(100),
  assetUrl: varchar({ length: 500 }).notNull(),
  category: varchar({ length: 100 }).default('Templates'), // Templates, Starters, API Wrappers, Component Libraries
  salesCount: integer().default(0),
  createdAt: timestamp().defaultNow()
});

// -------------------------------------------------------------
// NET NEW FEATURE 1: BOSS RAIDS
// -------------------------------------------------------------
export const bossRaidsTable = pgTable("bossRaids", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  bossName: varchar({ length: 255 }).notNull(),
  description: text(),
  maxHp: integer().default(1000),
  currentHp: integer().default(1000),
  goldReward: integer().default(500),
  xpReward: integer().default(1000),
  status: varchar({ length: 50 }).default('ACTIVE') // ACTIVE, DEFEATED
});

export const raidContributionsTable = pgTable("raidContributions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  raidId: integer().notNull(),
  userId: varchar({ length: 255 }).notNull(),
  userName: varchar({ length: 255 }),
  damage: integer().default(50),
  proofUrl: varchar({ length: 500 }),
  createdAt: timestamp().defaultNow()
});

// -------------------------------------------------------------
// BADGES & SKILL TREE NODES
// -------------------------------------------------------------
export const userBadgesTable = pgTable("userBadges", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  badgeName: varchar({ length: 255 }).notNull(),
  badgeIcon: varchar({ length: 255 }),
  unlockedAt: timestamp().defaultNow()
});

export const userSkillsTable = pgTable("userSkills", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  skillId: varchar({ length: 100 }).notNull(),
  unlockedAt: timestamp().defaultNow()
});

// -------------------------------------------------------------
// LEGACY / COMPATIBILITY TABLES
// -------------------------------------------------------------
export const CourseTable = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer().notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  desc: text().notNull(),
  bannerImage: varchar({ length: 500 }).notNull(),
  level: varchar({ length: 50 }).default('Beginner'),
  tags: varchar({ length: 255 }),
  editorType: varchar({ length: 50 })
});

export const CourseChaptersTable = pgTable("courseChapters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chapterId: integer(),
  courseId: integer("courseId").notNull(),
  name: varchar({ length: 255 }),
  desc: text(),
  exercises: json()
});

export const EnrolledCourseTable = pgTable("enrollCourse", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  CourseId: integer(),
  userId: varchar({ length: 255 }),
  enrolledDate: timestamp().defaultNow(),
  xpEarned: integer()
});

export const CompleteExerciseTable = pgTable("completeExerciseTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer(),
  chapterId: integer(),
  exerciseId: integer(),
  userId: varchar({ length: 255 })
});

export const ExerciseTable = pgTable("exercise", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer(),
  chapterId: integer(),
  exerciseId: varchar({ length: 100 }),
  exerciseContent: json(),
  exerciseName: varchar({ length: 255 })
});

export const hackathonsTable = pgTable("hackathons", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar({ length: 120 }).notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  theme: varchar({ length: 120 }).notNull(),
  description: text().notNull(),
  hostId: varchar({ length: 255 }).notNull(),
  hostName: varchar({ length: 255 }),
  startsAt: timestamp().notNull(),
  endsAt: timestamp().notNull(),
  status: varchar({ length: 50 }).default("OPEN"),
  winnerId: varchar({ length: 255 }),
  winnerName: varchar({ length: 255 }),
  xpReward: integer().default(250),
  goldReward: integer().default(120),
  sponsorId: varchar({ length: 80 }),
  sponsorName: varchar({ length: 255 }),
  sponsorUrl: varchar({ length: 500 }),
  prizeCashUsd: integer().default(0),
  createdAt: timestamp().defaultNow(),
});

export const hackathonEntriesTable = pgTable("hackathonEntries", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  hackathonId: integer().notNull(),
  userId: varchar({ length: 255 }).notNull(),
  userName: varchar({ length: 255 }),
  status: varchar({ length: 50 }).default("JOINED"),
  projectTitle: varchar({ length: 255 }),
  projectUrl: varchar({ length: 2000 }),
  repoUrl: varchar({ length: 2000 }),
  notes: text(),
  joinedAt: timestamp().defaultNow(),
  submittedAt: timestamp(),
});

export const hackathonVotesTable = pgTable(
  "hackathonVotes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    hackathonId: integer().notNull(),
    voterId: varchar({ length: 255 }).notNull(),
    candidateUserId: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => [uniqueIndex("hackathon_votes_voter").on(table.hackathonId, table.voterId)]
);

export const userAcademyProgressTable = pgTable("userAcademyProgress", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  courseId: varchar({ length: 100 }).notNull(),
  completedChapterIds: json().$type<string[]>(),
  chapterStars: json().$type<Record<string, number>>(),
  xpEarned: integer().default(0),
  finalPercent: integer().default(0),
  finalPassed: boolean().default(false),
  startedAt: timestamp().defaultNow(),
  completedAt: timestamp(),
});
