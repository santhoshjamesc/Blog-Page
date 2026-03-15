import React, { useEffect, useState } from "react";

interface NavItem {
  id: string;
  heading: string;
  preview: string;
}

interface Props {
  content: string;
}

const QuickNav: React.FC<Props> = ({ content }) => {

  const [items, setItems] = useState<NavItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    const headings = Array.from(doc.querySelectorAll("h1"));

    const navItems = headings.map((h1, i) => {

      const id = `heading-${i}`;
      h1.setAttribute("id", id);

      let text = "";
      let node = h1.nextSibling;
      let wordCount = 0;

      while (node && wordCount < 20) {

        if (
          node.nodeType === Node.TEXT_NODE ||
          node.nodeType === Node.ELEMENT_NODE
        ) {
          const content = node.textContent || "";
          const words = content.trim().split(/\s+/);
          const remaining = 20 - wordCount;

          text += words.slice(0, remaining).join(" ") + " ";
          wordCount += words.length;
        }

        node = node.nextSibling;
      }

      return {
        id,
        heading: h1.textContent || "Untitled",
        preview: text.trim() + (wordCount > 20 ? "..." : ""),
      };

    });

    setItems(navItems);

  }, [content]);

  useEffect(() => {

    const handleScroll = () => {

      let closestId: string | null = null;
      let minOffset = Infinity;

      items.forEach((item) => {

        const el = document.getElementById(item.id);

        if (el) {

          const rect = el.getBoundingClientRect();
          const offset = Math.abs(rect.top);

          if (rect.top <= window.innerHeight / 2 && offset < minOffset) {
            minOffset = offset;
            closestId = item.id;
          }

        }

      });

      if (closestId) setActiveId(closestId);

    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);

  }, [items]);

  return (

    <div className="hidden lg:block w-72 pl-8">

      <div
        className="
        sticky top-28
        bg-[#0D3B3B]/80
        backdrop-blur-xl
        border border-[#1F6F6F]
        rounded-xl
        p-5
        shadow-lg
        space-y-3
        "
      >

        <h2 className="text-sm font-semibold text-[#38BDF8] uppercase tracking-wide">
          On this page
        </h2>

        <ul className="space-y-1">

          {items.map((item) => (

            <li key={item.id}>

              <button
                onClick={() => {
                  const el = document.getElementById(item.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}

                className={`
                w-full text-left
                text-sm
                px-3 py-2
                rounded-md
                transition-all duration-200
                ${
                  activeId === item.id
                    ? "bg-[#1F6F6F] text-white border-l-2 border-[#38BDF8]"
                    : "text-slate-300 hover:text-white hover:bg-[#1F6F6F]/40"
                }
                `}
              >

                {item.heading}

              </button>

            </li>

          ))}

        </ul>

      </div>

    </div>

  );

};

export default QuickNav;