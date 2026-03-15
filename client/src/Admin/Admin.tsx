import React, { useState, useEffect } from "react";
import HeaderBar from "../components/HeaderBar";
import { Bell } from "lucide-react";
import * as adminApi from "../api/AdminApi";
import { useNavigate } from "react-router-dom";

type User = {
  avatar: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
};

type Post = {
  CreatedAt: string | number | Date;
  UpdatedAt: string | number | Date;
  id: number;
  title: string;
  author: string;
  created_at: string;
};

const ConfirmBox = ({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-[#0f172a] p-6 rounded-xl shadow-2xl max-w-sm w-full text-white">
      <p className="mb-4">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Notification = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center gap-4">
    <span>{message}</span>
    <button onClick={onClose} className="font-bold hover:text-gray-200">×</button>
  </div>
);

const Admin: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "posts">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [confirmData, setConfirmData] = useState<{
    type: "user" | "post";
    id: number;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");

    const fetchData = async () => {
      try {
        if (activeTab === "users") {
          const data = await adminApi.fetchUsers(searchTerm || undefined);
          setUsers(data);
        } else {
          const data = await adminApi.fetchPosts(searchTerm || undefined);
          setPosts(data);
        }
      } catch {
        setError("Something went wrong");
        activeTab === "users" ? setUsers([]) : setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, activeTab]);

  const handleDelete = async (type: "user" | "post", id: number) => {
    setConfirmData({ type, id });
  };

  const confirmDelete = async () => {
    if (!confirmData) return;
    const { type, id } = confirmData;

    try {
      if (type === "user") {
        await adminApi.deleteUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        await adminApi.deletePost(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      setNotification("Deletion failed");
    } finally {
      setConfirmData(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <HeaderBar />
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-1 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 transition"
            >
              ← Back
            </button>
            {["users", "posts"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-1 rounded-lg text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-teal-500 text-white shadow-lg"
                    : "bg-gray-800 text-gray-300 hover:bg-teal-600 hover:text-white"
                }`}
                onClick={() => setActiveTab(tab as "users" | "posts")}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 bg-gray-800 placeholder-gray-400 text-white"
          />
          <div className="ml-4 relative">
            <button onClick={() => navigate("/admin/reports")}>
              <Bell className="w-6 h-6 text-gray-400 hover:text-teal-400 transition" />
            </button>
            <span className="absolute top-0 right-0 -mt-1 -mr-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-4">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : activeTab === "users" ? (
            users.length === 0 ? (
              <p className="text-gray-400">No users found.</p>
            ) : (
              <ul className="space-y-4">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between border-b border-gray-700 pb-2 transition transform hover:scale-[1.01] hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name
                          )}&background=random`
                        }
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-teal-500 transition hover:scale-110"
                      />
                      <div>
                        <div className="font-semibold text-teal-400">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete("user", user.id)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : posts.length === 0 ? (
            <p className="text-gray-400">No posts found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 shadow-lg rounded-xl p-4 flex flex-col gap-2 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  <h2 className="text-[20px] md:text-[22px] font-bold text-teal-400 hover:text-teal-300 transition-colors">
                    {post.title}
                  </h2>
                  <div className="text-sm text-gray-400">
                    <p>
                      <span className="font-medium">Post ID:</span> {post.id}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(post.CreatedAt).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Updated:</span>{" "}
                      {new Date(post.UpdatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete("post", post.id);
                      }}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmData && (
        <ConfirmBox
          message={`Delete this ${confirmData.type}?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmData(null)}
        />
      )}

      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification("")}
        />
      )}
    </div>
  );
};

export default Admin;