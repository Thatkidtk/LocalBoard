import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const hasLiveSupabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const serviceClient = hasLiveSupabase
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const adminCredentials = {
  email: "admin@localboard.dev",
  password: "password123",
};

const createdUserIds: string[] = [];

type TestUser = {
  email: string;
  password: string;
  userId: string;
  username: string;
};

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto("/auth/sign-in");
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}

async function createTestUser(prefix: string): Promise<TestUser> {
  if (!serviceClient) {
    throw new Error("Live Supabase test helper requires service role credentials.");
  }

  const timestamp = Date.now();
  const username = `${prefix}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
  const email = `${prefix}-${timestamp}@example.com`;
  const password = "Pass12345!";
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      home_community_slug: "chelsea-ny-10001",
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("Unable to create test user.");
  }

  const { data: community, error: communityError } = await serviceClient
    .from("communities")
    .select("id")
    .eq("slug", "chelsea-ny-10001")
    .maybeSingle();

  if (communityError || !community) {
    throw communityError ?? new Error("Unable to locate default test community.");
  }

  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: data.user.id,
    username,
    home_community_id: String(community.id),
    role: "member",
  });

  if (profileError && profileError.code !== "23505") {
    throw profileError;
  }

  createdUserIds.push(data.user.id);

  return {
    email,
    password,
    userId: data.user.id,
    username,
  };
}

async function getCommunityId(slug: string) {
  if (!serviceClient) {
    throw new Error("Live Supabase test helper requires service role credentials.");
  }

  const { data, error } = await serviceClient
    .from("communities")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error(`Community ${slug} not found.`);
  }

  return String(data.id);
}

async function createPost(authorId: string, communityId: string, title: string, body: string) {
  if (!serviceClient) {
    throw new Error("Live Supabase test helper requires service role credentials.");
  }

  const { data, error } = await serviceClient
    .from("posts")
    .insert({
      author_id: authorId,
      community_id: communityId,
      title,
      body,
      category: "question",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create test post.");
  }

  return String(data.id);
}

async function createComment(authorId: string, postId: string, body: string) {
  if (!serviceClient) {
    throw new Error("Live Supabase test helper requires service role credentials.");
  }

  const { data, error } = await serviceClient
    .from("comments")
    .insert({
      author_id: authorId,
      post_id: postId,
      body,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create test comment.");
  }

  return String(data.id);
}

async function latestReportForComment(commentId: string) {
  if (!serviceClient) {
    throw new Error("Live Supabase test helper requires service role credentials.");
  }

  const { data, error } = await serviceClient
    .from("reports")
    .select("id, status")
    .eq("target_type", "comment")
    .eq("target_id", commentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Expected report was not created.");
  }

  return {
    id: String(data.id),
    status: String(data.status),
  };
}

async function getNotificationMessages(userId: string, postId?: string) {
  if (!serviceClient) {
    throw new Error("Live Supabase test helper requires service role credentials.");
  }

  let query = serviceClient
    .from("notifications")
    .select("message, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (postId) {
    query = query.eq("post_id", postId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

test.afterAll(async () => {
  if (!serviceClient || !createdUserIds.length) {
    return;
  }

  for (const userId of createdUserIds) {
    try {
      await serviceClient.auth.admin.deleteUser(userId);
    } catch {
      // Test fixtures leave related content behind, so auth cleanup is best-effort.
    }
  }
});

test("home page shows LocalBoard hero and trending posts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Every neighborhood needs a live pulse.")).toBeVisible();
  await expect(page.getByText("What neighbors are talking about")).toBeVisible();
});

test("community page loads feed content", async ({ page }) => {
  await page.goto("/c/chelsea-ny-10001");
  await expect(page.getByText("Community board")).toBeVisible();
  await expect(page.getByText("Power outage near 14th Street and 8th Ave")).toBeVisible();
});

test("mobile nav exposes primary actions", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.getByRole("link", { name: "New post" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Join your board" })).toBeVisible();

  await context.close();
});

test("authenticated users can create posts, vote, and receive reply notifications", async ({
  page,
}) => {
  test.skip(!hasLiveSupabase, "Live Supabase credentials are required for mutation smoke tests.");

  const author = await createTestUser("author");
  const responder = await createTestUser("responder");

  await signIn(page, author);
  await page.goto("/submit?community=chelsea-ny-10001");

  const title = `Auth smoke post ${Date.now()}`;
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page
    .getByRole("textbox", { name: "Body" })
    .fill("This post is created by the end-to-end suite to verify posting, voting, and notifications.");
  await page.getByRole("button", { name: "Publish post" }).click();
  await page.waitForURL(/\/p\/.+/);

  const postUrl = page.url();
  const postId = postUrl.split("/p/")[1]!;

  const upvote = page.getByRole("button", { name: "Upvote" }).first();
  await upvote.click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole("button", { name: "Upvote" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page
    .getByRole("textbox", { name: "Add context, sources, or updates" })
    .fill("Author-side comment to verify the comment form works.");
  await page.getByRole("button", { name: "Add comment" }).click();
  await expect(page.getByText("Author-side comment to verify the comment form works.")).toBeVisible();

  await createComment(responder.userId, postId, "Reply from the second test account.");

  await expect
    .poll(
      async () => {
        const notifications = await getNotificationMessages(author.userId, postId);
        return notifications.length;
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  await page.goto("/");
  await page.reload();
  await page.getByRole("button", { name: "Alerts" }).click();
  await expect(page.getByText(/replied to your post\./)).toBeVisible();

  await expect
    .poll(
      async () => {
        const notifications = await getNotificationMessages(author.userId, postId);
        return notifications[0]?.read_at ?? null;
      },
      { timeout: 15_000 },
    )
    .not.toBeNull();

  await page.goto(`/p/${postId}`);
  await page.getByRole("button", { name: "Upvote" }).first().click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole("button", { name: "Upvote" }).first()).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("reported comments can be resolved by an admin", async ({ browser, page }) => {
  test.skip(!hasLiveSupabase, "Live Supabase credentials are required for moderation smoke tests.");

  const author = await createTestUser("report_author");
  const reporter = await createTestUser("reporter");
  const communityId = await getCommunityId("chelsea-ny-10001");
  const postId = await createPost(
    author.userId,
    communityId,
    `Moderation smoke post ${Date.now()}`,
    "This post exists to verify report submission and admin resolution.",
  );
  const commentId = await createComment(
    author.userId,
    postId,
    "Comment that should be removed by the moderation smoke test.",
  );

  await signIn(page, reporter);
  await page.goto(`/p/${postId}`);

  const reason = `Needs moderation ${Date.now()}`;
  await page.getByRole("button", { name: "Report" }).nth(1).click();
  await page.getByPlaceholder("Short reason").fill(reason);
  await page.getByPlaceholder("Optional details").fill("Generated by the moderation smoke test.");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText("Thanks. A moderator will review this.")).toBeVisible();

  const report = await latestReportForComment(commentId);
  expect(report.status).toBe("open");

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await signIn(adminPage, adminCredentials);
  await adminPage.goto("/admin");

  const reportCard = adminPage.locator("article").filter({ hasText: reason });
  await expect(reportCard).toBeVisible();
  await reportCard.getByRole("button", { name: "Remove comment" }).click();

  await expect
    .poll(async () => {
      if (!serviceClient) {
        return null;
      }

      const { data } = await serviceClient
        .from("comments")
        .select("deleted_at")
        .eq("id", commentId)
        .maybeSingle();

      return data?.deleted_at ?? null;
    })
    .not.toBeNull();

  await adminContext.close();
});
