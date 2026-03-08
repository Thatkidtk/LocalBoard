"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CurrentUser, CommunitySummary } from "@/lib/types";

interface ProfileSettingsFormProps {
  user: CurrentUser;
  communities: CommunitySummary[];
}

export function ProfileSettingsForm({
  user,
  communities,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-5 rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const avatarFile = formData.get("avatar") as File | null;
        const username = String(formData.get("username") ?? "");
        const homeCommunityId = String(formData.get("homeCommunityId") ?? "");

        startTransition(async () => {
          try {
            setMessage(null);
            const supabase = getSupabaseBrowserClient();
            let avatarPath = user.avatarUrl;

            if (avatarFile && avatarFile.size > 0) {
              const extension = avatarFile.name.split(".").pop() ?? "jpg";
              const storagePath = `${user.id}/${Date.now()}.${extension}`;
              const uploadResult = await supabase.storage.from("avatars").upload(storagePath, avatarFile, {
                upsert: true,
              });

              if (uploadResult.error) {
                throw uploadResult.error;
              }

              const { data } = supabase.storage.from("avatars").getPublicUrl(storagePath);
              avatarPath = data.publicUrl;
            }

            const { error } = await supabase
              .from("profiles")
              .update({
                username,
                home_community_id: homeCommunityId,
                avatar_path: avatarPath,
              })
              .eq("id", user.id);

            if (error) {
              throw error;
            }

            setMessage("Profile updated.");
            router.refresh();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to save settings.");
          }
        });
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Profile settings
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)]">Tune your local identity</h1>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--ink)]">Username</span>
        <input
          defaultValue={user.username}
          name="username"
          required
          minLength={3}
          maxLength={24}
          className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--ink)]">Home community</span>
        <select
          defaultValue={user.homeCommunityId ?? ""}
          name="homeCommunityId"
          className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
        >
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.city}, {community.stateCode} ({community.zipCode})
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--ink)]">Profile picture</span>
        <input
          type="file"
          accept="image/*"
          name="avatar"
          className="block w-full rounded-2xl border border-dashed border-black/15 bg-[var(--panel)] px-4 py-4 text-sm text-[var(--muted)]"
        />
      </label>

      {message ? (
        <div className="rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)]">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
