import { Post, Comment } from "../types/Data";

// 👇 Strongly typed comment input type
type CommentInput = {
  text: string;
  post_id: number;
  parent_id?: number | null;
};

// ----------- Posts -----------

// Fetch all posts
export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch("/api/posts");
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    if (contentType?.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch posts");
    } else {
      throw new Error("Failed to fetch posts. Server returned non-JSON response.");
    }
  }

  if (contentType?.includes("application/json")) {
    return await response.json();
  } else {
    throw new Error("Invalid response format. Expected JSON.");
  }
}

// Fetch a single post by ID
export async function fetchPostById(id: string | number, userId?: string | number): Promise<Post> {
  const url = userId ? `/api/posts/${id}?user_id=${userId}` : `/api/posts/${id}`;
  const response = await fetch(url);

  if (response.status === 404) {
    // Explicitly throw a "not found" error
    throw new Error("notfound");
  }
  if (!response.ok) {
    // For all other errors, throw a generic error
    throw new Error("backend");
  }
  return await response.json();
}


// Update votes for a post


export const updatePostVotes = async (
  postId: string,
  type: "up" | "down" | "remove",
  userId: string | number
): Promise<Post> => {
  const payload = {
    vote: type,        // ✅ Always send the string "remove"
    user_id: userId,
  };

  try {
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
     //console.error("Vote request failed:", res.status, errorText);
      throw new Error("Failed to update vote");
    }

    return await res.json();
  } catch (err) {
   //console.error("Vote request error:", err);
    throw err;
  }
};


// ----------- Comments -----------

// Add a  comment (no post_id in body — it's in the URL)
export async function addCommentToPost(
  postId: string | number,
  comment: { text: string; parentId?: number; user_id?: number }
): Promise<Comment> {
  const payload = JSON.stringify(comment);
 //console.log("Sending comment to backend:", payload);

  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  if (!response.ok) throw new Error("Failed to add comment");
  return await response.json();
}


// Post a reply or nested comment (requires post_id and parent_id)


// Delete a comment by ID
export async function deleteComment(id: number): Promise<void> {
  const response = await fetch(`/api/comments/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Failed to delete comment");
}

// Vote on a comment
export async function voteComment(
  commentId: number,
  type: "like" | "dislike" | "remove",
  userId: number
): Promise<Comment> {
  const response = await fetch(`/api/comments/${commentId}/vote`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, user_id: userId }),
  });

  if (!response.ok) throw new Error("Failed to vote on comment");
  return await response.json(); // return updated comment
}

//Add blog post
export async function createPost(post: {
  title: string;
  category: string;
  content: string;
  author_id: number; // or string, depending on your model
  is_public?: boolean;
}): Promise<Post> {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || "Failed to create post");
  }

  return await response.json();
}

 // Adjust if needed

// Fetch posts by user ID
const BASE_URL = "/api/userposts";

// Fix query param name: use snake_case to match Go handler
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const res = await fetch(`${BASE_URL}?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return await res.json();
}



// Update an entire post (title, category, content, description, published)
export async function updatePost(post: Post): Promise<Post> {
  const res = await fetch(`/api/posts/${post.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  if (!res.ok) {
    const errorText = await res.text();
   //console.error("Update error response:", errorText);
    throw new Error("Failed to update post");
  }

  return await res.json();
}


// Toggle publish status only
export async function togglePublish(id: number, is_published: boolean): Promise<Post> {
  const res = await fetch(`/api/posts/${id}/publish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_published }),
  });

  if (!res.ok) {
    throw new Error("Failed to update publish status");
  }

  return await res.json();
}


// Delete a post
export async function deletePost(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete post");
}
// Corrected updateUser call
export const updateUser = async (user: any, password: string) => {
  const payload = { ...user, password };
  const res = await fetch(`/api/user/${user.id}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return parseError(res);
  return await res.json();
};

// Corrected deleteUser
export const deleteUser = async (user: any, password: string) => {
  const res = await fetch(`/api/user/${user.id}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) return parseError(res);
  return await res.json();
};

// Corrected changeUserPassword
export const changeUserPassword = async (user: any, password: string, newPassword: string) => {
  const res = await fetch(`/api/user/${user.id}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, newPassword }),
  });

  if (!res.ok) return parseError(res);
  return await res.json();
};
function parseError(res: Response) {
  throw new Error("Function not implemented.");
}




// REPORT SUBMISSION

export const reportSubmit = async (payload: {
  reporterId: number | string;
  reportedId: number;
  type: "post" | "comment";
  details: string;
}) => {

  const res = await fetch("/api/user/${user.id}/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to submit report");
  }

  return res.json();
};
