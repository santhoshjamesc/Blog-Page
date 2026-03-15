import React, { useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import { Pencil } from "lucide-react";
import { tabs, tabRoutes } from "../config/navbarTabs";
import useAuthStore from "../useAuthStore";
import { updateUser, deleteUser, changeUserPassword } from "../api/blogApi";

// Notification
const Notification = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
    <div className="flex items-center justify-between gap-4">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold">×</button>
    </div>
  </div>
);

// Confirm Box
const ConfirmBox = ({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40">
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
      <p className="text-gray-800 mb-4">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 bg-gray-200 text-sm rounded hover:bg-gray-300"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const Settings: React.FC = () => {
  const { user, login, logout } = useAuthStore();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [mode, setMode] = useState<"update" | "delete" | "changePassword" | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [notification, setNotification] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetSecurityState = () => {
    setMode(null);
    setNewPassword("");
    setPasswordInput("");
  };

  const handleModeChange = (newMode: typeof mode) => {
    resetSecurityState();
    setMode(newMode);
  };

  const handleConfirm = () => {
    if (!passwordInput) {
      setNotification("Enter password to proceed.");
      return;
    }

    if (mode === "update" && !/^\d+$/.test(form.phone)) {
      setNotification("Phone number must contain only digits.");
      return;
    }

    if (mode === "update" && !isEmailValid(form.email)) {
      setNotification("Enter a valid email.");
      return;
    }

    if (mode === "changePassword" && !newPassword) {
      setNotification("Enter a new password.");
      return;
    }

    if (mode === "changePassword" && newPassword.length < 6) {
      setNotification("Password must be at least 6 characters.");
      return;
    }

    setConfirmVisible(true);
  };

  const confirmAction = async () => {
    if (!user) return;

    try {
      if (mode === "update") {
        const updatedUser = await updateUser({ ...form, id: user.id }, passwordInput);
        login(updatedUser);
        setNotification("Profile updated.");
      }

      if (mode === "delete") {
        await deleteUser({ id: user.id }, passwordInput);
        logout();
        setNotification("Account deleted.");
      }

      if (mode === "changePassword") {
        await changeUserPassword({ id: user.id }, passwordInput, newPassword);
        setNotification("Password changed.");
      }

      resetSecurityState();
      setEditingField(null);
    } catch (err: any) {
      setNotification(err.message || "Something went wrong.");
    } finally {
      setConfirmVisible(false);
    }
  };

  const renderField = (field: string, label: string) => (
    <div key={field} className="mb-5">
      <div className="flex items-center justify-between">
        <label className="font-medium capitalize">{label}</label>
        {editingField !== field && (
          <button
            onClick={() => {
              setEditingField(field);
              resetSecurityState();
            }}
            className="text-blue-500 hover:text-blue-700"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {editingField === field ? (
        <>
          {field === "bio" ? (
            <textarea
              name={field}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full mt-1"
            />
          ) : field === "dob" ? (
            <input
              type="date"
              name={field}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full mt-1"
            />
          ) : field === "phone" ? (
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              name={field}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full mt-1"
            />
          ) : (
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full mt-1"
            />
          )}

          <button
            onClick={() => setEditingField(null)}
            className="text-sm mt-1 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </>
      ) : (
        <p className="mt-1 text-gray-800">
          {form[field as keyof typeof form] || (
            <span className="italic text-gray-400">Not set</span>
          )}
        </p>
      )}
    </div>
  );

  const isModified = Object.keys(form).some(
    (key) => form[key as keyof typeof form] !== (user?.[key as keyof typeof form] || "")
  );

  const getModeHeadingColor = () => {
    switch (mode) {
      case "delete": return "text-red-600";
      case "changePassword": return "text-blue-600";
      case "update": return "text-green-600";
      default: return "";
    }
  };

  const getModeHeadingText = () => {
    switch (mode) {
      case "delete": return "Delete Account";
      case "changePassword": return "Change Password";
      case "update": return "Save Changes";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-[Inter] relative overflow-hidden">
      {notification && <Notification message={notification} onClose={() => setNotification("")} />}
      {confirmVisible && (
        <ConfirmBox
          message={`Confirm ${getModeHeadingText().toLowerCase()}?`}
          onConfirm={confirmAction}
          onCancel={() => setConfirmVisible(false)}
        />
      )}

      {/* Background blur elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-190px] right-[-190px] w-[360px] h-[360px] rounded-full bg-blue-600 opacity-60 blur-[140px]" />
        <div className="absolute top-[200px] left-[55%] w-[220px] h-[220px] rounded-full bg-blue-500 opacity-40 blur-[140px]" />
        <div className="absolute top-[420px] left-[20%] w-[220px] h-[220px] rounded-full bg-blue-500 opacity-40 blur-[140px]" />
      </div>

      <header className="relative z-120 w-full">
        <HeaderBar />
        <div className="w-full max-w-[58rem] mx-auto px-4 relative pt-[126px]" />
        <div className="max-w-2xl mx-auto px-4">
          <Navbar tabs={tabs} tabRoutes={tabRoutes} />
        </div>
      </header>

      <main className="flex-grow w-full max-w-2xl mx-auto px-4 relative z-20">
        <h1 className="text-3xl font-bold mt-12 mb-8 text-center">Settings</h1>

        <div className="space-y-4">
          {renderField("name", "Name")}
          {renderField("email", "Email")}
          {renderField("phone", "Phone")}
          {renderField("dob", "Date of Birth")}
          {renderField("avatar", "Profile Picture URL")}
          {renderField("bio", "Bio")}

          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={() => handleModeChange("update")}
              disabled={!isModified}
              className={`px-4 py-2 rounded text-white ${
                isModified ? "bg-black hover:bg-gray-800" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Save
            </button>
            <button
              onClick={() => handleModeChange("changePassword")}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Change Password
            </button>
            <button
              onClick={() => handleModeChange("delete")}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Delete
            </button>
          </div>
        </div>

        {mode && (
          <div className="mt-8 border-t pt-6 bg-yellow-100 p-4 rounded">
            <h2 className={`text-xl font-bold mb-4 ${getModeHeadingColor()}`}>
              {getModeHeadingText()}
            </h2>

            <label className="font-medium">Enter your password</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="border border-gray-300 p-2 rounded mt-2 w-full"
            />

            {mode === "changePassword" && (
              <>
                <label className="font-medium mt-4 block">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border border-gray-300 p-2 rounded mt-2 w-full"
                />
              </>
            )}

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={handleConfirm}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={mode === "changePassword" && newPassword.length < 6}
              >
                Confirm
              </button>
              <button
                onClick={resetSecurityState}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
