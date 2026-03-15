import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./useAuthStore";
import BlogPage from "./Pages/BlogPage";
import SigninPage from "./Pages/SigninPage";
import SignupPage from "./Pages/SignupPage";
import BlogDetail from "./Pages/Blog";
import AddBlog from "./Pages/AddBlog";
import Profile from "./Pages/Profile";
import ManageMyBlogs from "./Pages/ManageMyBlogs";
import Settings from "./Pages/Settings";
import Admin from "./Admin/Admin";
import React from "react";
import Reports from "./Admin/Reports"; // Adjust path if needed


function App() {
  const { isLoggedIn, isAdmin } = useAuthStore(); // ✅ fixed

  return (
    <div className="w-full h-full min-h-screen">
      <Routes>
        <Route path="/" element={<BlogPage />} />
        <Route path="/signin" element={isLoggedIn ? <Navigate to="/" /> : <SigninPage />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/" /> : <SignupPage />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/add-blog" element={isLoggedIn ? <AddBlog /> : <Navigate to="/signin" />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/signin" />} />
        <Route path="/manage-my-blogs" element={isLoggedIn ? <ManageMyBlogs /> : <Navigate to="/signin" />} />
        <Route path="/settings" element={isLoggedIn ? <Settings /> : <Navigate to="/signin" />} />
        <Route path="/admin/users" element={isLoggedIn && isAdmin ? <Admin /> : <Navigate to="/" />} />
        <Route path="/admin/reports" element={isLoggedIn && isAdmin ? <Reports /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
