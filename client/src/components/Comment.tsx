import React, { useState } from "react";
import Report from "./Report";
import { Post, Comment as CommentType } from "../types/Data";
import useAuthStore from "../useAuthStore";
import { addCommentToPost, voteComment, deleteComment } from "../api/blogApi";

interface Props {
  post: Post;
  updatePost: (updated: Post) => void;
}

const Comment: React.FC<Props> = ({ post, updatePost }) => {
  const { user, isLoggedIn } = useAuthStore();
  const userId = isLoggedIn && user?.id ? user.id : 0;

  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const newComment = await addCommentToPost(post.id, {
        text: commentText.trim(),
        parentId: undefined,
        user_id: userId !== 0 ? userId : undefined,
      });
      if (user) newComment.user = user;

      updatePost({ ...post, comments: [newComment, ...(post.comments || [])] });
      setCommentText("");
    } catch {}
  };

  const submitReply = async (parentId: number) => {
    if (!replyText.trim()) return;
    try {
      const reply = await addCommentToPost(post.id, {
        text: replyText.trim(),
        parentId,
        user_id: userId !== 0 ? userId : undefined,
      });
      if (user) reply.user = user;

      const updated = [...(post.comments || []), reply];
      updatePost({ ...post, comments: updated });

      setReplyText("");
      setReplyingToId(null);
    } catch {}
  };

  const toggleReplyInput = (id: number) => {
    setReplyingToId(replyingToId === id ? null : id);
    setReplyText("");
  };

  const toggleReaction = async (commentId: number, type: "like" | "dislike") => {
    if (!isLoggedIn) return;

    const comments = [...(post.comments || [])];
    const index = comments.findIndex((c) => c.id === commentId);
    if (index === -1) return;

    const comment = comments[index];
    const alreadyLiked = comment.likes?.includes(userId);
    const alreadyDisliked = comment.dislikes?.includes(userId);

    const newComment = { ...comment };
    newComment.likes = [...(comment.likes || [])];
    newComment.dislikes = [...(comment.dislikes || [])];
    newComment.upvotes = comment.upvotes || 0;
    newComment.downvotes = comment.downvotes || 0;

    if (type === "like") {
      if (!alreadyLiked) {
        newComment.likes.push(userId);
        newComment.upvotes++;
        if (alreadyDisliked) {
          newComment.dislikes = newComment.dislikes.filter((id) => id !== userId);
          newComment.downvotes--;
        }
      }
    } else {
      if (!alreadyDisliked) {
        newComment.dislikes.push(userId);
        newComment.downvotes++;
        if (alreadyLiked) {
          newComment.likes = newComment.likes.filter((id) => id !== userId);
          newComment.upvotes--;
        }
      }
    }

    const updatedComments = [...comments];
    updatedComments[index] = newComment;
    updatePost({ ...post, comments: updatedComments });

    try {
      await voteComment(commentId, type, userId);
    } catch {}
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      const updated = (post.comments || []).filter(
        (c) => c.id !== commentId && c.parentId !== commentId
      );
      updatePost({ ...post, comments: updated });
    } catch {}
  };

  const nestComments = (comments: CommentType[]): CommentType[] => {
    const map = new Map<number, CommentType>();
    const roots: CommentType[] = [];
    const cloned = comments.map((c) => ({ ...c, replies: [] }));

    cloned.forEach((c) => map.set(c.id, c));
    cloned.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(c);
      } else {
        roots.push(c);
      }
    });

    return roots;
  };

  const renderComments = (comments: CommentType[], level = 0) => {
    return comments.map((c) => {
      const isLiked = c.likes?.includes(userId);
      const isDisliked = c.dislikes?.includes(userId);

      return (
        <div
          key={c.id}
          style={{ marginLeft: `${level * 26}px` }}
          className={`mt-4 transition-all duration-300 ease-out`}
        >
          <div
            className="
              group
              bg-[#0F172A]/70
              border border-[#1F6F6F]
              rounded-xl
              p-4
              shadow-md
              backdrop-blur
              hover:shadow-xl
              hover:-translate-y-[2px]
              hover:border-[#38BDF8]
              transition-all duration-300
            "
          >
            <div className="flex items-center gap-2 mb-1">
              <img
                src={c.user?.avatar || "/us.png"}
                alt={c.user?.name || ""}
                className="
                  w-8 h-8
                  rounded-full
                  object-cover
                  border border-[#1F6F6F]
                  transition
                  group-hover:scale-110
                  group-hover:border-[#38BDF8]
                "
              />
              <span className="font-semibold text-[#E2E8F0] tracking-wide">{c.user?.name || "Anonymous"}</span>
              <span className="text-xs text-slate-400">{c.date}</span>
            </div>

            <div className="text-slate-300 mb-2 leading-relaxed">{c.text}</div>

            <div className="flex gap-3 items-center text-sm flex-wrap">
              <button
                onClick={() => toggleReaction(c.id, "like")}
                disabled={!isLoggedIn}
                className={`
                  cursor-pointer
                  px-3 py-1.5 rounded-full text-sm border
                  transition-all duration-200
                  active:scale-90
                  hover:scale-105
                  ${isLiked
                    ? "bg-[#1F6F6F] text-[#38BDF8] border-[#38BDF8]"
                    : "border-[#1F6F6F] text-slate-300 hover:bg-[#1F6F6F]/40"
                  }
                `}
              >
                👍 {c.upvotes}
              </button>

              <button
                onClick={() => toggleReaction(c.id, "dislike")}
                disabled={!isLoggedIn}
                className={`
                  cursor-pointer
                  px-3 py-1.5 rounded-full text-sm border
                  transition-all duration-200
                  active:scale-90
                  hover:scale-105
                  ${isDisliked
                    ? "bg-[#3b1f1f] text-red-400 border-red-500"
                    : "border-[#1F6F6F] text-slate-300 hover:bg-[#1F6F6F]/40"
                  }
                `}
              >
                👎 {c.downvotes}
              </button>

              <button
                onClick={() => toggleReplyInput(c.id)}
                className="cursor-pointer text-slate-300 hover:text-[#38BDF8] transition text-sm flex items-center gap-1"
              >
                💬 Reply
              </button>

              {(c.user?.id === user?.id || user?.is_admin) && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="cursor-pointer text-red-400 hover:text-red-500 transition"
                >
                  🗑️ Delete
                </button>
              )}

              <Report mode="comment" predefinedData={{ postId: post.id, comment: c, user }} />
            </div>

            {replyingToId === c.id && (
              <div className="mt-3 animate-[fadeIn_.25s_ease]">
                <textarea
                  className="
                    w-full
                    bg-[#020617]
                    border border-[#1F6F6F]
                    rounded-lg
                    p-2
                    text-sm text-slate-200
                    focus:outline-none
                    focus:border-[#38BDF8]
                    transition
                  "
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  onClick={() => submitReply(c.id)}
                  className="
                    mt-2
                    px-4 py-1.5
                    rounded-lg
                    bg-[#1F6F6F]
                    text-white
                    text-sm
                    hover:bg-[#38BDF8]
                    hover:text-black
                    transition
                    active:scale-95
                    cursor-pointer
                  "
                >
                  Reply
                </button>
              </div>
            )}
          </div>

          {c.replies?.length > 0 && renderComments(c.replies, level + 1)}
        </div>
      );
    });
  };

  const nestedComments = nestComments(post.comments || []);

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold mb-3 text-[#38BDF8]">Comments</h3>

      <form onSubmit={handleComment} className="flex flex-col gap-2 mb-6">
        <textarea
          className="
            bg-[#020617]
            border border-[#1F6F6F]
            rounded-lg
            p-3
            min-h-[80px]
            text-slate-200
            focus:outline-none
            focus:border-[#38BDF8]
            transition
          "
          placeholder="Write your comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          required
        />
        <button
          type="submit"
          className="
            self-end
            px-5 py-2
            rounded-lg
            bg-[#1F6F6F]
            text-white
            font-medium
            hover:bg-[#38BDF8]
            hover:text-black
            transition
            cursor-pointer
            active:scale-95
          "
        >
          Publish
        </button>
      </form>

      {nestedComments.length ? renderComments(nestedComments, 0) : (
        <div className="text-slate-400">No comments yet. Be the first!</div>
      )}
    </div>
  );
};

export default Comment;