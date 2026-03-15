const BASE_URL = "/api/admin";

export const fetchUsers = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${BASE_URL}/users${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const fetchPosts = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${BASE_URL}/posts${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
};

export const deleteUser = async (id: number) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete user");
};

export const deletePost = async (id: number) => {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete post");
};

export const fetchReports = async () => {
  const res = await fetch(`${BASE_URL}/reports`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return await res.json();
};
export const ignoreReport = async (type: string, reportId: number) => {
  const res = await fetch(`/api/admin/reports/${reportId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to ignore report");
};
export const deleteReportedContent = async (
  type: "post" | "comment",
  id: number
) => {
  const res = await fetch(`/api/admin/reports/content/${type}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete reported content");
};

export const getCommentById = async (commentId: number) => {
  try {
    const res = await fetch(`/api/comments/${commentId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch comment: ${res.status}`);
    }

    const comment = await res.json();
    return comment;
  } catch (error) {

    throw error;
  }
};

export const getUserById = async (userId: number) => {
  try {
    const res = await fetch(`/api/usersid/${userId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch user: ${res.status}`);
    }

    const user = await res.json();
    return user;
  } catch (error) {
 
    throw error;
  }
};
export const getPostById = async (postId: number) => {
  try {
    const res = await fetch(`/api/postsid/${postId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.status}`);
    }

    const post = await res.json();
    return post;
  } catch (error) {

    throw error;
  }
};
