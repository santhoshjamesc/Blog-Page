import React from "react";
import { useNavigate } from "react-router-dom";
import { Post } from "../types/Data";

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
};

const BlogPostItem: React.FC<{ post: Post }> = ({ post }) => {
  const navigate = useNavigate();

  const tempElement = document.createElement("div");
  tempElement.innerHTML = post.content ?? "";
  const plainText = tempElement.textContent || tempElement.innerText || "";
  const words = plainText.split(/\s+/);
  const preview = words.slice(0, 60).join(" ") + (words.length > 60 ? "..." : "");

  return (
    <div
      className="
        flex w-full items-start gap-4 p-5 rounded-xl
        bg-[#0F172A]/80 border border-[#1F6F6F]/30
        shadow-md transition-transform duration-300
        hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]
        cursor-pointer group
      "
      onClick={() => navigate(`/blog/${post.id}`)}
    >
      {/* Accent bar */}
      <div className="w-[4px] h-full bg-[#38BDF8] rounded-sm transition-all duration-300 group-hover:h-full" />

      {/* Post content */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <div className="flex items-center gap-2">
            <img
              src={post.author?.avatar || "/us.png"}
              alt={post.author?.name || "DeletedUser"}
              className="
                w-6 h-6 rounded-full object-cover border border-[#38BDF8]/50
                transition-transform duration-300 group-hover:scale-110
              "
            />
            <span className="font-semibold text-[#E2E8F0]">{post.author?.name || "DeletedUser"}</span>
            <span className="mx-2 text-gray-500">•</span>
            <span className="text-gray-400">{post.date}</span>
          </div>

          <div className="flex items-center gap-2 text-[#38BDF8] font-medium">
            <span title="Upvotes">{formatNumber(post.upvotes || 0)} likes</span>
          </div>
        </div>

        <h2
          className="
            text-[27px] leading-[34px] font-bold text-[#E2E8F0]
            hover:text-[#38BDF8] transition-colors duration-300
            font-['Inter_Display']
          "
        >
          {post.title}
        </h2>

        <p className="text-[#94A3B8] text-[16px] leading-[24px] mb-2 break-words font-['Inter']">
          {preview}{" "}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/blog/${post.id}`);
            }}
            className="
              text-[#38BDF8] font-medium hover:underline transition-all duration-200
              hover:scale-105
            "
          >
            Read more
          </button>
        </p>
      </div>
    </div>
  );
};

export default BlogPostItem;