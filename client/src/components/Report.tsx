import React, { useState } from "react";
import { reportSubmit } from "../api/blogApi";

interface ReportProps {
  mode: "post" | "comment";
  predefinedData?: Record<string, any>;
}

const Report: React.FC<ReportProps> = ({ mode, predefinedData = {} }) => {
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      reporterId: predefinedData?.user?.id || "unknown",
      reportedId: mode === "post" ? predefinedData?.postId : predefinedData?.comment?.id,
      type: mode,
      details,
    };

    try {
      await reportSubmit(payload);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="relative">
      <details className="p-3">
        <summary className="cursor-pointer text-sm text-red-600 opacity-55">
          Report
        </summary>

        {submitted ? (
          <div className="mt-3 text-green-600 text-sm">✅ Report submitted.</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
            <label className="text-sm text-gray-700">
              Details
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Additional information..."
                className="w-full mt-1 p-2 border border-gray-300 rounded"
              />
            </label>
            <button
              type="submit"
              disabled={details.trim().length === 0}
              className={`self-start px-4 py-2 text-sm rounded text-white ${
                details.trim().length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Submit Report
            </button>
          </form>
        )}
      </details>

      {error && (
        <div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center">


          <div className="bg-white p-4 rounded shadow-lg w-full max-w-xs text-center">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button
              onClick={() => setError(null)}
              className="bg-red-600 text-white text-sm px-4 py-1 rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
