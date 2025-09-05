import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Profile table that syncs with Supabase auth.users
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// You can add your own application-specific tables here
// Example:
// export const posts = pgTable("posts", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   userId: uuid("user_id").references(() => profiles.id),
//   title: text("title").notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
// });