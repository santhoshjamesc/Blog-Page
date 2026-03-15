import React from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { tabs, tabRoutes } from "../config/navbarTabs";
import HeaderBar from "../components/HeaderBar";
import useAuthStore from "../useAuthStore";

const Profile: React.FC = () => {
  const { user, isLoggedIn } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] font-[Inter] relative overflow-hidden text-white">

      {/* Floating Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">

        <div className="absolute top-[-180px] right-[-160px] w-[420px] h-[420px] rounded-full bg-[#1F6F6F] opacity-30 blur-[150px] animate-float" />

        <div className="absolute top-[220px] left-[55%] w-[260px] h-[260px] rounded-full bg-[#38BDF8] opacity-20 blur-[120px] animate-floatSlow" />

        <div className="absolute top-[420px] left-[15%] w-[260px] h-[260px] rounded-full bg-[#0D3B3B] opacity-30 blur-[140px] animate-float" />

      </div>

      {/* Header */}
      <header className="relative z-20 w-full">
        <HeaderBar />

        <div className="w-full max-w-[58rem] mx-auto px-6 pt-[126px]">
          <div className="max-w-2xl mx-auto">
            <Navbar tabs={tabs} tabRoutes={tabRoutes} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow w-full max-w-[58rem] mx-auto px-6 relative z-10">

        <h1 className="text-3xl font-bold mt-12 mb-10 text-center animate-fadeUp">
          My Profile
        </h1>

        {isLoggedIn && user ? (

          <div className="flex justify-center">

            <div
              className="
              w-full max-w-md
              bg-[#0D3B3B]
              border border-[#1F6F6F]
              rounded-xl
              p-8
              flex flex-col items-center
              shadow-xl
              transition-all duration-300
              hover:scale-[1.03]
              hover:border-[#38BDF8]
              animate-fadeUp
              "
            >

              {/* Avatar */}
              <img
                src={user.avatar}
                alt={user.name}
                className="
                w-24 h-24 rounded-full mb-5
                border-2 border-[#38BDF8]
                transition-all duration-300
                hover:scale-110
                hover:rotate-2
                "
              />

              {/* Name */}
              <div className="text-xl font-semibold text-white mb-1">
                {user.name}
              </div>

              {/* Email */}
              <div className="text-slate-400 mb-4">
                {user.email}
              </div>

              {/* Message */}
              <div className="text-slate-300 text-sm text-center">
                Welcome back. Your personal dashboard and activity live here.
              </div>

            </div>

          </div>

        ) : (

          <div className="text-center text-slate-400">
            Not logged in
          </div>

        )}

      </main>

      <Footer />

      {/* Animations */}
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

        @keyframes float {
          0% { transform: translateY(0px) }
          50% { transform: translateY(-35px) }
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

export default Profile;