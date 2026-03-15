import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { tabs, tabRoutes } from "../config/navbarTabs";
import HeaderBar from "../components/HeaderBar";
import { blogCategories } from "../config/blogCategories";
import useAuthStore from "../useAuthStore";
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
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough, FaCode, FaQuoteRight,
  FaListUl, FaListOl, FaHeading, FaUndo, FaRedo, FaLink, FaImage, FaEdit, FaTrash, FaEyeSlash, FaEye
} from "react-icons/fa";
import { fetchUserPosts, updatePost, deletePost, togglePublish } from "../api/blogApi";
import { Post } from "../types/Data";

const ManageMyBlogs: React.FC = () => {
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState(blogCategories[0]);
  const [toast, setToast] = useState<string | null>(null);

  const { user } = useAuthStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      TextStyle, BulletList, OrderedList, ListItem, Underline,
      Strike, Code, Blockquote, Link, Image
    ],
    content: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserPosts(user.id.toString()).then(setMyPosts);
    }
  }, [user]);

  useEffect(() => {
    if (editPost && editor) {
      setEditTitle(editPost.title);
      setEditCategory(editPost.category);
      editor.commands.setContent(editPost.content || "");
    }
  }, [editPost, editor]);

  const handleDelete = async (id: number) => {
    await deletePost(id);
    setMyPosts(prev => prev.filter(p => p.id !== id));
    showToast("Deleted!");
  };

  const handleEditSave = async () => {
    if (!editPost || !editor) return;
    const updated: Post = {
      ...editPost,
      title: editTitle,
      category: editCategory,
      content: editor.getHTML(),
      description: editor.getText(),
      date: new Date().toISOString(),
    };
    await updatePost(updated);
    setMyPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditPost(null);
    showToast("Updated!");
  };

  const handleTogglePublish = async (id: number) => {
    const postToUpdate = myPosts.find(p => p.id === id);
    if (!postToUpdate) return;

    const newStatus = !postToUpdate.is_published;

    try {
      const updated = await togglePublish(id, newStatus);
      setMyPosts(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  const openEdit = (post: Post) => {
    setEditPost(post);
    setTimeout(() => editor?.commands.setContent(post.content || ""), 0);
  };

  return (
    <><div className="min-h-screen flex flex-col bg-[#F9FAFB] font-[Inter] relative overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg z-150">
          {toast}
        </div>
      )}

      {/* Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-190px] right-[-190px] w-[360px] h-[360px] rounded-full bg-blue-600 opacity-60 blur-[140px]" />
        <div className="absolute top-[200px] left-[55%] w-[220px] h-[220px] rounded-full bg-blue-500 opacity-40 blur-[140px]" />
        <div className="absolute top-[420px] left-[20%] w-[220px] h-[220px] rounded-full bg-blue-500 opacity-40 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-120 w-full">
        <HeaderBar />
        <div className="w-full max-w-[58rem] mx-auto px-4 relative pt-[126px]">
          <div className="max-w-2xl mx-auto px-4">
            <Navbar tabs={tabs} tabRoutes={tabRoutes} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[58rem] mx-auto px-4 sm:px-6 relative z-10">
        <h1 className="text-3xl font-bold mt-12 mb-8 text-center">Manage My Blogs</h1>

        {user?.id ? (
          myPosts.length === 0 ? (
            <p className="text-center text-gray-600">You have no blog posts yet.</p>
          ) : (
            <div className="space-y-6">
              {myPosts.map((post) => (
                <div key={post.id} className="bg-transparent rounded-xl shadow p-5 flex flex-col gap-2 relative">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-2xl font-bold mb-1">{post.title}</div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Category: <strong className="text-gray-700">{post.category}</strong></div>
                        <div className="flex gap-4">
                          <div><strong className="text-green-700">Likes:</strong> {post.upvotes}</div>
                          <div><strong className="text-red-700">Dislikes:</strong> {post.downvotes}</div>
                        </div>
                        <div>Created at: <strong className="text-gray-700">{new Date(post.CreatedAt).toLocaleDateString()}</strong></div>
                        {post.UpdatedAt && (
                          <div>Updated at: <strong className="text-gray-700">{new Date(post.UpdatedAt).toLocaleDateString()}</strong></div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <button onClick={() => handleTogglePublish(post.id)} className="px-2 py-1 text-sm rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                        {post.is_published ? <><FaEye /> Unpublish</> : <><FaEyeSlash /> Publish</>}
                      </button>
                      <button onClick={() => openEdit(post)} className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1">
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1">
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-2 line-clamp-3">{post.description}</p>
                </div>
              ))}
            </div>
          )
        ) : null}
      </main>

      {/* Editor Modal */}
      {editPost && editor && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-640">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl" onClick={() => setEditPost(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Edit Blog Post</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2">
                {blogCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => editor.chain().focus().toggleBold().run()}><FaBold /></button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()}><FaItalic /></button>
              <button onClick={() => editor.chain().focus().toggleUnderline().run()}><FaUnderline /></button>
              <button onClick={() => editor.chain().focus().toggleStrike().run()}><FaStrikethrough /></button>
              <button onClick={() => editor.chain().focus().toggleCode().run()}><FaCode /></button>
              <button onClick={() => editor.chain().focus().toggleBlockquote().run()}><FaQuoteRight /></button>
              <button onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl /></button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><FaHeading />1</button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><FaHeading />2</button>
              <button onClick={() => {
                const url = prompt("Enter link:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              } }><FaLink /></button>
              <button onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) editor.chain().focus().setImage({ src: url }).run();
              } }><FaImage /></button>
              <button onClick={() => editor.chain().focus().undo().run()}><FaUndo /></button>
              <button onClick={() => editor.chain().focus().redo().run()}><FaRedo /></button>
            </div>

            <div className="border border-gray-300 bg-white rounded-xl p-4 shadow-sm min-h-[180px] max-h-[300px] overflow-y-auto mb-4">
              <EditorContent editor={editor} />
            </div>

            <div className="text-center">
              <button onClick={handleEditSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}


    </div><Footer /></>
  );
};

export default ManageMyBlogs;
 