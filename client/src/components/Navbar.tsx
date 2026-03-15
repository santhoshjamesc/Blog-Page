import React from "react";
import { NavLink } from "react-router-dom";

type NavbarProps = {
  tabs: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabRoutes?: Record<string, string>;
};

const Navbar: React.FC<NavbarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  tabRoutes,
}) => {

  const baseStyle =
    "whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300";

  const inactiveStyle =
    "text-slate-300 bg-[#0D3B3B]/60 border border-[#1F6F6F]/40 hover:border-[#38BDF8] hover:text-white hover:scale-[1.05]";

  const activeStyle =
    "text-white bg-[#1F6F6F] border border-[#38BDF8]/40 shadow-md";

  return (
    <nav className="flex flex-wrap sm:flex-nowrap overflow-x-auto gap-3 mb-10 px-2 sm:px-0 pb-1">

      {tabs.map((tab) =>
        tabRoutes ? (
          <NavLink
            key={tab}
            to={tabRoutes[tab] || "/"}
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            {tab}
          </NavLink>
        ) : (
          <button
            key={tab}
            className={`${baseStyle} ${
              activeTab === tab ? activeStyle : inactiveStyle
            }`}
            onClick={() => onTabChange && onTabChange(tab)}
          >
            {tab}
          </button>
        )
      )}

    </nav>
  );
};

export default Navbar;