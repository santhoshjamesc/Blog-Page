// src/api/authApi.ts

import type { User } from "../useAuthStore";

// Payloads for API requests
export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar: string;
}

export interface SigninPayload {
  email: string;
  password: string;
}

// SIGNUP FUNCTION
export async function signup(payload: SignupPayload): Promise<User> {
  const response = await fetch("api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    // Try to parse error message from server
    let message = "Signup failed";
    try {
      const errorData = JSON.parse(responseBody);
      if (errorData.message) message = errorData.message;
    } catch {}
   //console.error("Signup error response:", responseBody);
    throw new Error(message);
  }

  // Parse the successful response as a User object
  return JSON.parse(responseBody) as User;
}

// SIGNIN FUNCTION
export async function signin(payload: SigninPayload): Promise<User> {
  const response = await fetch("api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    let message = "Sign in failed.";
    try {
      const errorData = JSON.parse(responseBody);
      if (errorData.message) message = errorData.message;
    } catch {}
    throw new Error(message);
  }

  // Parse the successful response as a User object
  return JSON.parse(responseBody) as User;
}
