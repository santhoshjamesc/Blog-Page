import React from "react";
import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";

const Footer: React.FC = () => (
  <footer className="relative w-full bg-[#0F172A] text-slate-300 py-12 border-t border-[#1F6F6F]/40">

    <div className="max-w-6xl mx-auto px-6">

      {/* Top Section */}
      <div className="flex flex-col gap-12 md:flex-row md:justify-between">

        {/* Logo */}
        <div className="flex flex-col">

          <div className="flex items-center mb-3">

            <img
              src="/logo.png"
              alt="Mai Blogs"
              className="w-[34px] h-[32px] mr-3 transition-transform duration-300 hover:scale-110"
            />

            <span
              className="text-[28px] font-bold tracking-tight text-[#38BDF8]"
              style={{ fontFamily: "Inter Display" }}
            >
              Mai Blogs
            </span>

          </div>

          <span className="text-xs text-slate-400">
            © maiblogs.com — All rights reserved.
          </span>

        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-y-10 gap-x-14 sm:grid-cols-2 md:grid-cols-4 w-full">

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">
              Product
            </h4>

            <ul className="text-sm space-y-2">
              <li>
                <a className="hover:text-[#38BDF8] transition-colors">
                  Platform
                </a>
              </li>
              <li>
                <a className="hover:text-[#38BDF8] transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">
              Company
            </h4>

            <ul className="text-sm space-y-2">
              <li><a className="hover:text-[#38BDF8] transition-colors">About</a></li>
              <li><a className="hover:text-[#38BDF8] transition-colors">Blog</a></li>
              <li><a className="hover:text-[#38BDF8] transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">
              Resources
            </h4>

            <ul className="text-sm space-y-2">
              <li><a className="hover:text-[#38BDF8] transition-colors">Community</a></li>
              <li><a className="hover:text-[#38BDF8] transition-colors">Terms</a></li>
              <li><a className="hover:text-[#38BDF8] transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">
              Social
            </h4>

            <div className="flex space-x-4 mt-2 text-lg">

              <a
                href="#"
                className="text-slate-400 hover:text-[#38BDF8] transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>

              <a
                href="#"
                className="text-slate-400 hover:text-[#38BDF8] transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>

              <a
                href="#"
                className="text-slate-400 hover:text-[#38BDF8] transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>

            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Watermark */}
    <div className="absolute left-0 right-0 bottom-0 flex justify-center pointer-events-none select-none">

      <span className="text-[9vw] sm:text-[6vw] font-extrabold text-[#1F6F6F] opacity-20 tracking-widest leading-none">
        MAI BLOGS
      </span>

    </div>

  </footer>
);

export default Footer;