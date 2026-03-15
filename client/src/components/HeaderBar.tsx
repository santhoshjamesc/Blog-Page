import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../useAuthStore";

const HeaderBar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const navigate = useNavigate();

  const handleLoginClick = () => navigate("/signin");

  const handleLogoutClick = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    logout();
    navigate("/signin");
  };

  const handleProfileClick = () => navigate("/profile");
  const handleAdminClick = () => navigate("/admin/users");

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">

      {/* Navbar Container */}
      <div
        className="
        flex items-center justify-between
        px-5 py-2.5
        rounded-xl
        backdrop-blur-xl
        border
        shadow-lg
        bg-[#0F172A]/80
        border-[#1F6F6F]/40
        transition-all duration-300
        "
      >

        {/* Logo */}
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img
            src="/logo.png"
            alt="Mai Blogs"
            className="w-[38px] h-[36px] mr-3 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105"
          />

          <span
            className="
            text-[32px]
            font-bold
            tracking-tight
            text-[#38BDF8]
            group-hover:text-white
            transition-colors duration-300
            "
            style={{ fontFamily: "Inter Display" }}
          >
            Mai Blogs
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {isLoggedIn && user ? (
            <>
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="
                  px-4 py-1.5
                  rounded-lg
                  text-sm font-medium
                  text-white
                  bg-[#1F6F6F]
                  border border-[#38BDF8]/40
                  hover:bg-[#38BDF8]
                  hover:text-black
                  transition-all duration-300
                  hover:scale-[1.05]
                  active:scale-[0.97]
                  "
                >
                  Admin
                </button>
              )}

              <button
                onClick={handleProfileClick}
                className="
                px-4 py-1.5
                rounded-lg
                text-sm font-medium
                text-slate-200
                border border-[#1F6F6F]
                hover:border-[#38BDF8]
                hover:text-white
                transition-all duration-300
                hover:scale-[1.05]
                active:scale-[0.97]
                "
              >
                Profile
              </button>

              <button
                onClick={handleLogoutClick}
                className="
                px-4 py-1.5
                rounded-lg
                text-sm font-medium
                text-white
                bg-[#0D3B3B]
                border border-[#1F6F6F]
                hover:bg-[#1F6F6F]
                transition-all duration-300
                hover:scale-[1.05]
                active:scale-[0.97]
                "
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={handleLoginClick}
              className="
              px-5 py-1.5
              rounded-lg
              text-sm font-medium
              text-white
              bg-[#1F6F6F]
              border border-[#38BDF8]/40
              hover:bg-[#38BDF8]
              hover:text-black
              transition-all duration-300
              hover:scale-[1.05]
              active:scale-[0.97]
              "
            >
              Login
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default HeaderBar;