import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import QuickNav from "../components/QuickNav";
import Comment from "../components/Comment";
import HeaderBar from "../components/HeaderBar";
import { Post } from "../types/Data";
import useAuthStore from "../useAuthStore";
import { fetchPostById, updatePostVotes } from "../api/blogApi";
import Report from "../components/Report";

const Blog: React.FC = () => {

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const storedUserId = user?.id;

  const [post, setPost] = useState<Post | null>(null);
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"backend" | "notfound" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setPost(null);

      try {
        const found = await fetchPostById(id!, storedUserId);

        if (cancelled) return;

        setPost(found);
        setVotes({ up: found.upvotes || 0, down: found.downvotes || 0 });

        const vote =
          found.userVote === 1
            ? "up"
            : found.userVote === -1
            ? "down"
            : null;

        setUserVote(vote);

      } catch (err: any) {

        if (cancelled) return;

        setError(err.message === "notfound" ? "notfound" : "backend");

      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      cancelled = true;
    };

  }, [id, storedUserId]);

  const handleVote = async (type: "up" | "down") => {

    if (!isLoggedIn || !storedUserId) {
      alert("Login required to vote");
      return;
    }

    if (!post || !id) return;

    const isRemoving = userVote === type;

    try {

      const result = await updatePostVotes(
        id,
        isRemoving ? "remove" : type,
        storedUserId
      );

      const vote =
        result.userVote === 1
          ? "up"
          : result.userVote === -1
          ? "down"
          : null;

      setVotes({
        up: result.upvotes ?? 0,
        down: result.downvotes ?? 0,
      });

      setUserVote(vote);

    } catch (err: any) {
      alert(err.message);
    }
  };

  let mainContent: React.ReactNode;

  if (loading) {

    mainContent = (
      <div className="text-slate-400 text-lg animate-pulse">
        Loading post...
      </div>
    );

  } else if (error === "backend") {

    mainContent = (
      <div className="flex flex-col items-center">
        <div className="text-center text-lg text-slate-400 mb-4">
          Something went wrong.
        </div>

        <button
          className="px-4 py-2 bg-[#1F6F6F] text-white rounded-lg hover:bg-[#38BDF8] hover:text-black transition"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );

  } else if (error === "notfound") {

    mainContent = (
      <div className="flex flex-col items-center">
        <div className="text-xl text-slate-400 mb-4">
          Post not found
        </div>

        <button
          className="px-4 py-2 bg-[#1F6F6F] text-white rounded-lg hover:bg-[#38BDF8] hover:text-black transition"
          onClick={() => navigate("/")}
        >
          Go Back
        </button>
      </div>
    );

  } else if (post) {

    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content || "", "text/html");

    doc.querySelectorAll("h1").forEach((h1, i) =>
      h1.setAttribute("id", `heading-${i}`)
    );

    const sanitizedContent = doc.body.innerHTML;

    const authorName =
      typeof post.author === "object" && post.author !== null
        ? post.author.name
        : post.author;

    mainContent = (

      <main className="w-full max-w-7xl mx-auto px-2 flex gap-10">

        <div className="w-full lg:w-[calc(100%-18rem)] max-w-3xl mx-auto">

          <div className="mt-12 mb-6 animate-fadeUp">

            <div
              onClick={() => navigate(-1)}
              className="mb-6 cursor-pointer text-[#38BDF8] text-sm hover:underline"
            >
              ← Back to Blogs
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              {post.title}
            </h1>

            <div className="flex items-center text-xs text-slate-400 mb-6 flex-wrap">

              <img
                src={post.author.avatar}
                alt="Author"
                className="w-7 h-7 rounded-full mr-2"
              />

              <span className="text-white font-medium">
                {authorName}
              </span>

              <span className="mx-2">•</span>

              <span className="text-[#38BDF8] font-medium">
                {post.category}
              </span>

            </div>

            {/* Voting */}
            <div className="flex gap-3 mb-6">

              <button
                onClick={() => handleVote("up")}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm border transition
                ${
                  userVote === "up"
                    ? "bg-[#1F6F6F] text-white border-[#38BDF8]"
                    : "bg-[#0D3B3B] text-slate-300 border-[#1F6F6F]"
                }`}
              >
                👍 {votes.up}
              </button>

              <button
                onClick={() => handleVote("down")}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm border transition
                ${
                  userVote === "down"
                    ? "bg-[#1F6F6F] text-white border-[#38BDF8]"
                    : "bg-[#0D3B3B] text-slate-300 border-[#1F6F6F]"
                }`}
              >
                👎 {votes.down}
              </button>

            </div>

            {/* Blog Content */}
            <div
              className="blog-content prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Dates */}
            <div className="text-xs text-slate-500 mt-6 flex justify-between">

              <div>
                Created:
                <strong className="ml-1">
                  {new Date(post.CreatedAt).toLocaleDateString()}
                </strong>
              </div>

              {post.UpdatedAt && (
                <div>
                  Updated:
                  <strong className="ml-1">
                    {new Date(post.UpdatedAt).toLocaleDateString()}
                  </strong>
                </div>
              )}

            </div>

            <div className="mt-6">
              <Report
                mode="post"
                predefinedData={{
                  postId: post.id,
                  title: post.title,
                  content: post.content,
                  author: authorName,
                  user: user,
                }}
              />
            </div>

            <Comment post={post} updatePost={setPost} />

          </div>

        </div>

        <QuickNav content={sanitizedContent} />

      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] font-[Inter]">

      <HeaderBar />

      <div className="flex-1 flex items-center justify-center w-full max-w-[68rem] mx-auto px-6 pt-[120px]">
        {mainContent}
      </div>

      <Footer />

      <style>{`
        @keyframes fadeUp {
          from {
            opacity:0;
            transform:translateY(30px);
          }
          to {
            opacity:1;
            transform:translateY(0);
          }
        }

        .animate-fadeUp{
          animation: fadeUp .6s ease forwards;
        }
      `}</style>

    </div>
  );
};

export default Blog;