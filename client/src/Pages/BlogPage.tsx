import React, { useState, useEffect } from "react";
import BlogPostItem from "../components/BlogPostItem";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeaderBar from "../components/HeaderBar";
import { blogCategories } from "../config/blogCategories";
import { Post } from "../types/Data";
import { fetchPosts } from "../api/blogApi";

const tabs = ["All", ...blogCategories];
const INITIAL_COUNT = 8;
const LOAD_MORE_COUNT = 6;

type CategoryState = { [category: string]: number };
type LoadingState = { [category: string]: boolean };

const BlogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState<CategoryState>({ All: INITIAL_COUNT });
  const [loading, setLoading] = useState<LoadingState>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingPosts(true);
    fetchPosts()
      .then(setAllPosts)
      .catch((err) => {
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoadingPosts(false));
  }, []);

  const filteredPosts =
    activeTab === "All"
      ? allPosts
      : allPosts.filter((post) => post.category === activeTab);

  useEffect(() => {
    setVisibleCount((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] ?? INITIAL_COUNT,
    }));
    setLoading((prev) => ({
      ...prev,
      [activeTab]: false,
    }));
  }, [activeTab]);

  const handleLoadMore = () => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }));

    setTimeout(() => {
      setVisibleCount((prev) => ({
        ...prev,
        [activeTab]: Math.min(
          (prev[activeTab] ?? INITIAL_COUNT) + LOAD_MORE_COUNT,
          filteredPosts.length
        ),
      }));

      setLoading((prev) => ({ ...prev, [activeTab]: false }));
    }, 1200);
  };

  const currentVisibleCount = visibleCount[activeTab] ?? INITIAL_COUNT;
  const showLoadMore = currentVisibleCount < filteredPosts.length;
  const isLoading = loading[activeTab] ?? false;

  let content;

  if (loadingPosts) {
    content = (
      <div className="p-6 text-slate-400 animate-pulse">
        Loading posts...
      </div>
    );
  } else if (error) {
    content = (
      <div className="p-6 text-red-400">
        Something went wrong. Try again later.
      </div>
    );
  } else if (filteredPosts.length === 0) {
    content = (
      <div className="py-16 text-slate-400 text-center">
        Nothing to show
      </div>
    );
  } else {
    content = (
      <>
        <div className="flex flex-col gap-12 w-full">
          {filteredPosts.slice(0, currentVisibleCount).map((post, index) => (
            <div
              key={post.id}
              className="animate-fadeUp"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <BlogPostItem post={post} />
            </div>
          ))}
        </div>

        {showLoadMore && (
          <div className="flex justify-center mt-12 mb-10">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-7 py-3 text-sm rounded-lg font-medium transition-all duration-300
              bg-[#1F6F6F] text-white
              hover:bg-[#38BDF8] hover:text-black
              hover:scale-[1.04]
              active:scale-[0.98]
              disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] text-white font-[Inter] relative overflow-hidden">

      {/* Floating Teal Orbs */}
      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#1F6F6F] opacity-30 blur-[140px] animate-float" />

        <div className="absolute top-[200px] left-[55%] w-[260px] h-[260px] rounded-full bg-[#38BDF8] opacity-20 blur-[120px] animate-floatSlow" />

        <div className="absolute top-[480px] left-[18%] w-[260px] h-[260px] rounded-full bg-[#0D3B3B] opacity-30 blur-[140px] animate-float" />

      </div>

      <div className="flex-grow relative z-20 w-full">

        <HeaderBar />

        <div className="w-full max-w-[58rem] mx-auto px-6 relative pt-[96px]">

          <main>

            {/* Title */}
            <h1
              className="font-bold mt-12 mb-2 tracking-tight animate-fadeIn"
              style={{
                fontFamily: "Inter Display",
                fontWeight: 720,
                fontSize: "48px",
                lineHeight: "48px",
              }}
            >
              Mai Blogs
            </h1>

            <p className="text-lg text-slate-400 mb-16 max-w-xl">
              Insights for developers, product builders, and digital creators.
            </p>

            <div className="mb-40">

              <Navbar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <div className="mt-8">
                {content}
              </div>

            </div>

          </main>
        </div>
      </div>

      <Footer />

      {/* Animation Styles */}
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

      .animate-fadeUp {
        animation: fadeUp .6s ease forwards;
      }

      @keyframes fadeIn {
        from{opacity:0}
        to{opacity:1}
      }

      .animate-fadeIn {
        animation: fadeIn .8s ease forwards;
      }

      @keyframes float {
        0% { transform: translateY(0px) }
        50% { transform: translateY(-30px) }
        100% { transform: translateY(0px) }
      }

      @keyframes floatSlow {
        0% { transform: translateY(0px) }
        50% { transform: translateY(-60px) }
        100% { transform: translateY(0px) }
      }

      .animate-float {
        animation: float 12s ease-in-out infinite;
      }

      .animate-floatSlow {
        animation: floatSlow 18s ease-in-out infinite;
      }

      `}</style>

    </div>
  );
};

export default BlogPage;