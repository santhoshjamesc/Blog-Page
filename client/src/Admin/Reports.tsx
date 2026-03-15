import React, { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import {
  getCommentById,
  getUserById,
  getPostById,
  fetchReports,
  deleteReportedContent,
  ignoreReport,
} from "../api/AdminApi";

// Types
type Report = {
  ID: number;
  id: number; // post/comment ID
  type: "post" | "comment";
  reporterId: number;
  CreatedAt: string;
};

type EnrichedReport = Report & {
  reporterName: string;
  reportedUser: string;
  contentSummary: string;
};

// Notification component
const Notification: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="fixed top-4 right-4 z-[9999] bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
    <div className="flex items-center justify-between gap-4">
      <span>{message}</span>
      <button onClick={onClose} className="text-white font-bold hover:text-gray-300">×</button>
    </div>
  </div>
);

// Main Component
const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [enrichedReports, setEnrichedReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setError(true);
      showNotification("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const enrich = async () => {
      try {
        const enriched = await Promise.all(
          reports.map(async (r) => {
            let reportedUser = "Unknown";
            let contentSummary = "";

            try {
              if (r.type === "post") {
                const post = await getPostById(r.id);
                const user = await getUserById(post.author_id);
                reportedUser = user.name;
                contentSummary = post.title;
              } else {
                const comment = await getCommentById(r.id);
                const user = comment.user_id
                  ? await getUserById(comment.user_id)
                  : { name: "Unknown" };
                reportedUser = user.name;
                contentSummary = comment.text;
              }

              const reporter = await getUserById(r.reporterId);

              return {
                ...r,
                reportedUser,
                contentSummary,
                reporterName: reporter.name,
              };
            } catch (err) {
              console.error("Failed to enrich report", r, err);
              return {
                ...r,
                reportedUser,
                contentSummary,
                reporterName: "Unknown",
              };
            }
          })
        );

        setEnrichedReports(enriched);
      } catch (err) {
        console.error("Enrichment failed", err);
        showNotification("Failed to enrich reports");
      }
    };

    if (reports.length > 0) enrich();
  }, [reports]);

  const handleReview = async (type: "post" | "comment", id: number) => {
    try {
      if (type === "post") {
        window.open(`/blog/${id}`, "_blank");
      } else {
        const comment = await getCommentById(id);
        if (comment?.post_id) {
          window.open(`/blog/${comment.post_id}`, "_blank");
        } else {
          showNotification("Post not found for this comment.");
        }
      }
    } catch (err) {
      console.error("Review failed", err);
      showNotification("Could not open content for review.");
    }
  };

  const handleIgnore = async (reportId: number) => {
    try {
      await ignoreReport("", reportId);
      showNotification("Report ignored");
      setEnrichedReports((prev) => prev.filter((r) => r.ID !== reportId));
    } catch (err) {
      console.error("Ignore failed", err);
      showNotification("Failed to ignore report.");
    }
  };

  const handleDelete = async (
    type: "post" | "comment",
    id: number,
    reportId: number
  ) => {
    try {
      await deleteReportedContent(type, id);
      await ignoreReport("", reportId);
      showNotification(`${type} deleted and report resolved`);
      setEnrichedReports((prev) => prev.filter((r) => r.ID !== reportId));
    } catch (err) {
      console.error("Delete failed", err);
      showNotification("Failed to delete content.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative text-white">
      <HeaderBar />
      <div className="pt-24 px-6 max-w-5xl mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-1 rounded bg-gray-800 hover:bg-gray-700 text-sm transition"
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-red-500">Something went wrong.</p>
        ) : enrichedReports.length === 0 ? (
          <p className="text-gray-400">No reports found.</p>
        ) : (
          <div className="space-y-4">
            {enrichedReports.map((r) => {
              const date = new Date(r.CreatedAt).toISOString().split("T")[0];

              const label =
                r.type === "comment"
                  ? `Comment "${r.contentSummary}" by ${r.reportedUser} was reported by ${r.reporterName} on ${date}.`
                  : `Post "${r.contentSummary}" by ${r.reportedUser} was reported by ${r.reporterName} on ${date}.`;

              return (
                <div
                  key={r.ID}
                  className="
                    p-4
                    bg-gray-800
                    rounded-xl
                    shadow-lg
                    border border-gray-700
                    transform
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.03]
                    hover:shadow-2xl
                    hover:border-teal-500
                    cursor-pointer
                  "
                >
                  <p className="text-sm text-gray-300 mb-3">{label}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleReview(r.type, r.id)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleDelete(r.type, r.id, r.ID)}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition"
                    >
                      Delete {r.type}
                    </button>
                    <button
                      onClick={() => handleIgnore(r.ID)}
                      className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-500 rounded text-white transition"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <Notification message={notification} onClose={() => setNotification(null)} />
      )}
    </div>
  );
};

export default Reports;