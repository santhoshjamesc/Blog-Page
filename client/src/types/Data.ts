// src/types/Data.ts

import { ReactNode } from "react";

// Reusable Comment type
export type Comment = {
  parent_id: number;
  id: number;
  parentId?: number | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  user: User;
  profilePic?: string;
  text: string;
  date: string;
  likes: number[];       // user IDs
  dislikes: number[];    // user IDs
  replies: Comment[];
  User?: any;
};


// Post type using Comment[]
export type Post = {
  created_at: ReactNode;
  userVote: number;
  User: any;
  author_id: any;
  id: number;
  author: User;
  date: string;
  title: string;
  category: string;
  description: string;
  readMoreLink: string;
  content?: string;
  profilePic?: string;
  is_published: boolean; // ✅ Add this
  upvotes?: number;
  downvotes?: number;
  comments?: Comment[];
  CreatedAt: string | Date;
  UpdatedAt?: string | Date;
};

// Authenticated user
export type User = {
  id: number;
  name: string;          // Full name
  email: string;
  phone: string;         // Phone number
  bio?: string;
  dob?: string;
  avatar: string;
  is_admin: boolean;        // Avatar is required
};

// Zustand store state

export type AuthState = {
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};
