
import CourseList from "@/app/(routes)/courses/_components/CourseList";
import { id } from "date-fns/locale";
import { integer, json, pgTable, varchar, serial, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  points:integer().default(0),
  subscription:varchar()
});


export const CourseTable=pgTable("courses",{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId:integer().notNull().unique(),
  title:varchar().notNull(),
  desc:varchar().notNull(),
  bannerImage:varchar().notNull(),
  level:varchar().default('Beginner'),
  tags:varchar(),
  editorType: varchar()
})


export const CourseChaptersTable=pgTable('courseChapters',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chapterId:integer(),
  courseId: integer("courseId").notNull(),
  name:varchar(),
  desc:varchar(),
  exercises:json(),
})

export const EnrolledCourseTable=pgTable('enrollCourse',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  CourseId: integer(),
  userId: varchar(),
  enrolledDate: timestamp().defaultNow(),
  xpEarned:integer()
})

export const CompleteExerciseTable=pgTable('completeExerciseTable',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId:integer(),
  chapterId:integer(),
  exerciseId:integer(),
  userId:varchar(),
})

export const ExerciseTable=pgTable('exercise',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer(),
  chapterId: integer(),
  exerciseId: varchar(),
  exerciseContent: json(),
  exerciseName: varchar()
})