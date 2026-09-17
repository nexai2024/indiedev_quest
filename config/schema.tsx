import { integer, json, pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

// -------------------------------------------------------------
// USER & CHARACTER SCHEMA
// -------------------------------------------------------------
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }),
  role: varchar({ length: 50 }).default('NOVICE'), // NOVICE, BUILDER, MENTOR, GUILD_MASTER, ADMIN
  characterClass: varchar({ length: 100 }).default('Frontend Specialist'), // Frontend Specialist, Full-Stack Artisan, AI Builder, Systems Engineer
  primaryGoal: varchar({ length: 255 }).default('Build First SaaS'),
  level: integer().default(1),
  xp: integer().default(0),
  gold: integer().default(100),
  talentPoints: integer().default(0),
  avatarUrl: varchar({ length: 500 }),
  partyId: integer(),
  points: integer().default(0),
  subscription: varchar({ length: 50 }).default('free')
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
  questTitle: varchar({ length: 255 }).notNull(),
  proofUrl: varchar({ length: 500 }).notNull(), // Repo, demo link, or Loom video
  notes: text(),
  isApproved: boolean().default(false),
  reviewNotes: text(),
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
  status: varchar({ length: 50 }).default('PENDING'), // PENDING, ACTIVE, COMPLETED, CANCELLED
  costInGold: integer().default(50),
  scheduledAt: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow()
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
