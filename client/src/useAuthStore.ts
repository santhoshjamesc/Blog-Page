import { create } from "zustand";

export type User = {
  [x: string]: string;
  id: number;
  is_admin: boolean;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  dob?: string;
  bio?: string;
};

const initialUserJson = localStorage.getItem("user");
const initialUser: User | null = initialUserJson ? JSON.parse(initialUserJson) : null;

type AuthState = {
  isLoggedIn: boolean;
  user: User | null;
  isAdmin: boolean;
  login: (user: User) => boolean;
  logout: () => void;
};

const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: !!initialUser,
  user: initialUser,
  isAdmin: initialUser?.is_admin ?? false,

  login: (user) => {
    const currentUser = get().user;

    if (currentUser && currentUser.id !== user.id) {
      return false;
    }

    set({ isLoggedIn: true, user, isAdmin: user.is_admin });
    localStorage.setItem("user", JSON.stringify(user));
    return true;
  },

  logout: () => {
    set({ isLoggedIn: false, user: null, isAdmin: false });
    localStorage.removeItem("user");
  },
}));

export default useAuthStore;
