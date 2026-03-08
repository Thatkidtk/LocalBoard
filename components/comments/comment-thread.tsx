"use client";

import Link from "next/link";
import { useState } from "react";

import type { CommentNode } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/shared/avatar";
import { VoteControls } from "@/components/post/vote-controls";
import { CommentForm } from "@/components/comments/comment-form";
import { ReportButton } from "@/components/post/report-button";

interface CommentThreadProps {
  comments: CommentNode[];
  isAuthenticated: boolean;
}

function CommentBranch({
  comment,
  isAuthenticated,
}: {
  comment: CommentNode;
  isAuthenticated: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div
        className="rounded-[1.5rem] border border-black/10 bg-white/80 p-4"
        style={{ marginLeft: `${comment.renderDepth * 16}px` }}
      >
        <div className="flex gap-4">
          <VoteControls
            endpoint={`/api/comments/${comment.id}/vote`}
            initialScore={comment.score}
            initialVote={comment.userVote}
            isAuthenticated={isAuthenticated}
            orientation="horizontal"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={comment.author.username} src={comment.author.avatarUrl} className="h-8 w-8" />
              <p className="text-sm font-semibold text-[var(--ink)]">{comment.author.username}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                {formatRelativeTime(comment.createdAt)}
              </p>
            </div>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{comment.body}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setReplyOpen((value) => !value)}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-black/20 hover:text-[var(--ink)]"
                >
                  {replyOpen ? "Close reply" : "Reply"}
                </button>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-black/20 hover:text-[var(--ink)]"
                >
                  Sign in to reply
                </Link>
              )}
              <ReportButton
                targetId={comment.id}
                targetType="comment"
                isAuthenticated={isAuthenticated}
              />
            </div>

            {replyOpen ? (
              <div className="mt-4">
                <CommentForm postId={comment.postId} parentCommentId={comment.id} compact />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {comment.replies.length ? (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentBranch
              key={reply.id}
              comment={reply}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentThread({ comments, isAuthenticated }: CommentThreadProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentBranch key={comment.id} comment={comment} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  );
}
