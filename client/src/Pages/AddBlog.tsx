import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { FaBold, FaListUl, FaHeading } from "react-icons/fa";
import { blogCategories } from "../config/blogCategories";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { tabs, tabRoutes } from "../config/navbarTabs";
import HeaderBar from "../components/HeaderBar";
import useAuthStore from "../useAuthStore";

const AddBlogPage: React.FC = () => {
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(blogCategories[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: { levels: [1, 2] },
      }),
      BulletList,
      OrderedList,
      ListItem,
      TextStyle,
      Underline,
      Strike,
      Code,
      Blockquote,
      Link,
      Image,
    ],
    content: "",
  });

  const handleSubmit = async () => {
    if (!title.trim() || !editor || !user?.id) {
      setToast("Title and User ID are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          content: editor.getHTML(),
          author_id: user.id,
          is_published: isPublic,
          profile_pic: user.avatar || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to post blog");
      }

      setToast("Published!");
      setTitle("");
      editor.commands.clearContent();

      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      setToast(err.message || "Failed to publish");
     //console.error("Post error:", err);
    }
  };

  if (!editor) return null;

  // Toolbar handlers
  const toolbarActions = {
    bold: () => editor.chain().focus().toggleBold().run(),
    italic: () => editor.chain().focus().toggleItalic().run(),
    underline: () => editor.chain().focus().toggleUnderline().run(),
    strike: () => editor.chain().focus().toggleStrike().run(),
    code: () => editor.chain().focus().toggleCode().run(),
    blockquote: () => editor.chain().focus().toggleBlockquote().run(),
    bulletList: () => editor.chain().focus().toggleBulletList().run(),
    orderedList: () => editor.chain().focus().toggleOrderedList().run(),
    heading: (level: 1 | 2) => editor.chain().focus().toggleHeading({ level }).run(),
    link: () => {
      const url = prompt("Enter URL");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    },
    image: () => {
      const url = prompt("Enter image URL");
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
    undo: () => editor.chain().focus().undo().run(),
    redo: () => editor.chain().focus().redo().run(),
    clear: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-[Inter] relative overflow-hidden">
      {/* Toaster */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg z-200 transition-all duration-300 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-190px] right-[-190px] w-[360px] h-[360px] rounded-full bg-blue-600 opacity-60 blur-[140px]" />
        <div className="absolute top-[200px] left-[55%] w-[220px] h-[220px] rounded-full bg-blue-500 opacity-40 blur-[140px]" />
        <div className="absolute top-[420px] left-[20%] w-[220px] h-[220px] rounded-full bg-blue-500 opacity-40 blur-[140px]" />
      </div>

      <header className="relative z-120 w-full">
        <HeaderBar />
        <div className="w-full max-w-[58rem] mx-auto px-4 relative pt-[126px]">
          <div className="max-w-2xl mx-auto px-4">
            <Navbar tabs={tabs} tabRoutes={tabRoutes} />
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[58rem] mx-auto px-4 sm:px-6 relative z-20 pt-[126px]">

        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">Create a New Blog Post</h1>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="Enter blog title"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            {blogCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Public Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Public</label>
          <div className="flex gap-4">
            <button
              onClick={() => setIsPublic(true)}
              className={`px-4 py-2 rounded-lg border ${isPublic ? "bg-blue-600 text-white" : "bg-white text-gray-800 border-gray-300"}`}
            >
              Yes
            </button>
            <button
              onClick={() => setIsPublic(false)}
              className={`px-4 py-2 rounded-lg border ${!isPublic ? "bg-blue-600 text-white" : "bg-white text-gray-800 border-gray-300"}`}
            >
              No
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={toolbarActions.bold} title="Bold" className="toolbar-btn"><FaBold /></button>
          <button onClick={toolbarActions.italic} title="Italic" className="toolbar-btn"><i>I</i></button>
          <button onClick={toolbarActions.underline} title="Underline" className="toolbar-btn"><u>U</u></button>
          <button onClick={toolbarActions.strike} title="Strike" className="toolbar-btn"><s>S</s></button>
          <button onClick={toolbarActions.code} title="Code" className="toolbar-btn">{`</>`}</button>
          <button onClick={toolbarActions.blockquote} title="Blockquote" className="toolbar-btn">“”</button>
          <button onClick={toolbarActions.bulletList} title="Bullet List" className="toolbar-btn"><FaListUl /></button>
          <button onClick={toolbarActions.orderedList} title="Numbered List" className="toolbar-btn">1.</button>
          <button onClick={() => toolbarActions.heading(1)} title="Heading 1" className="toolbar-btn"><FaHeading /> H1</button>
          <button onClick={() => toolbarActions.heading(2)} title="Heading 2" className="toolbar-btn"><FaHeading /> H2</button>
          <button onClick={toolbarActions.link} title="Add Link" className="toolbar-btn">🔗</button>
          <button onClick={toolbarActions.image} title="Add Image" className="toolbar-btn">🖼️</button>
          <button onClick={toolbarActions.undo} title="Undo" className="toolbar-btn">↺</button>
          <button onClick={toolbarActions.redo} title="Redo" className="toolbar-btn">↻</button>
          <button onClick={toolbarActions.clear} title="Clear Formatting" className="toolbar-btn">🧹</button>
        </div>

        {/* Editor */}
        <div className="border border-gray-300 bg-white rounded-xl p-4 shadow-sm min-h-[250px]">
          <EditorContent editor={editor} />
        </div>

        {/* Submit */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Publish Blog
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddBlogPage;
 