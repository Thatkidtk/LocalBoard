import { z } from "zod";

import { POST_CATEGORIES, REPORT_TARGET_TYPES } from "@/lib/constants";

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = signInSchema.extend({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or less.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only."),
  communitySlug: z.string().min(1, "Select a community."),
});

export const postCreateSchema = z.object({
  title: z.string().trim().min(6).max(120),
  body: z.string().trim().min(20).max(5_000),
  category: z.enum(POST_CATEGORIES),
  communityId: z.uuid(),
});

export const commentCreateSchema = z.object({
  body: z.string().trim().min(2).max(2_000),
  postId: z.uuid(),
  parentCommentId: z.uuid().nullable().optional(),
});

export const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.uuid(),
  reason: z.string().trim().min(4).max(120),
  details: z.string().trim().max(500).optional().nullable(),
});

export const notificationReadSchema = z.object({
  notificationIds: z.array(z.uuid()).min(1),
});

export const reportResolutionSchema = z.object({
  action: z.enum(["dismiss", "remove_post", "remove_comment", "suspend_author"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export const settingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  homeCommunityId: z.uuid(),
});
