import { sql } from "drizzle-orm";
import { numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const MockInterview=pgTable('mockInterview',{
    id:serial('id').primaryKey(),
    jsonMockResp:text('jsonMockResp').notNull(),
    jobPosition:varchar('jobPosition').notNull(),
    jobDesc:varchar('jobDesc').notNull(),
    jobExperience:varchar('jobExperience').notNull(),
    createdBy:varchar('createdBy').notNull(),
    createdAt:varchar('createdAt'),
    mockId:varchar('mockId').notNull()

})

export const UserAnswer=pgTable('userAnswer',{
    id:serial('id').primaryKey(),
    mockIdRef:varchar('mockId').notNull(),
    question:varchar('Question').notNull(),
    correctAns:text('correctAns'),
    userAns:text('userans'),
    feedback:text('feedback'),
    rating:varchar('rating'),
    userEmail:varchar('userEmail'),
    createdAt:varchar('createdAt'),
})

export const UserVoilation = pgTable("UserVoilation", {
  id: serial("id").primaryKey(),
  mockIdRef: varchar("mockIdRef").notNull(),
  userEmail: varchar("userEmail").notNull(),
  createdAt: timestamp("createdAt")
  .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'`)
  .notNull(),
  // violationTime: timestamp("violationTime").defaultNow(),
  faceAbsent: numeric("faceAbsent").default(0),
  focusLoss: numeric("focusLoss").default(0),
  // multipleFace: numeric("multipleFace").default(0),
  unAuthorizedItem: numeric("unAuthorizedItem").default(0),
})

export const CustomInterviewQnA = pgTable("custom_interview_qna", {
  id: serial("id").primaryKey(),   // unique id
  domain: varchar("domain", { length: 255 }).notNull(),
  skills: text("skills").notNull(),
  experience: varchar("experience", { length: 10 }).notNull(),
  jsonQnA: text("json_qna").notNull(),           // pura Q&A JSON string
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: varchar("created_at", { length: 50 }),
})