package server

import (
	"net/http"
	"strconv"

	"skryfon_blog/internal/model"

	"github.com/gin-gonic/gin"
)

// --- Admin Handlers ---

// GetAllPostsAdmin returns all posts (published + unpublished) with search support
func (s *Server) GetAllPostsAdmin(c *gin.Context) {
	search := c.Query("search")

	query := s.db.Gorm().
		Preload("Author").
		Preload("Comments").
		Preload("Comments.User").
		Order("created_at DESC")

	// Add search functionality if search parameter is provided
	if search != "" {
		query = query.Where("title ILIKE ? OR content ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var posts []model.Post
	if err := query.Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

// DeletePost deletes a post and all related comments and votes
func (s *Server) DeletePost(c *gin.Context) {
	idStr := c.Param("id")
	postID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	db := s.db.Gorm()
	pid := uint(postID)

	// Start transaction for data consistency
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete votes on comments under the post
	if err := tx.Where("comment_id IN (SELECT id FROM comments WHERE post_id = ?)", pid).Delete(&model.Vote{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment votes"})
		return
	}

	// Delete votes on the post
	if err := tx.Where("post_id = ?", pid).Delete(&model.Vote{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post votes"})
		return
	}

	// Delete comments under the post
	if err := tx.Where("post_id = ?", pid).Delete(&model.Comment{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comments"})
		return
	}

	// Delete the post itself
	if err := tx.Delete(&model.Post{}, pid).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Post and related data deleted"})
}

// GetAllUsers lists all registered users with search support
func (s *Server) GetAllUsers(c *gin.Context) {
	search := c.Query("search")

	query := s.db.Gorm().Order("created_at DESC")

	// Add search functionality if search parameter is provided
	if search != "" {
		query = query.Where("username ILIKE ? OR email ILIKE ? OR name ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var users []model.User
	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// DeleteUser deletes a user and all associated data (posts, comments, votes)
func (s *Server) DeleteUsers(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db := s.db.Gorm()
	uid := uint(userID)

	// Start transaction for data consistency
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete votes on comments under user's posts
	if err := tx.Where("comment_id IN (SELECT id FROM comments WHERE post_id IN (SELECT id FROM posts WHERE author_id = ?))", uid).Delete(&model.Vote{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete votes on user's post comments"})
		return
	}

	// Delete votes on user's posts
	if err := tx.Where("post_id IN (SELECT id FROM posts WHERE author_id = ?)", uid).Delete(&model.Vote{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete votes on user's posts"})
		return
	}

	// Delete votes by user
	if err := tx.Where("user_id = ?", uid).Delete(&model.Vote{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user's votes"})
		return
	}

	// Delete comments under user's posts
	if err := tx.Where("post_id IN (SELECT id FROM posts WHERE author_id = ?)", uid).Delete(&model.Comment{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comments on user's posts"})
		return
	}

	// Delete comments by user
	if err := tx.Where("user_id = ?", uid).Delete(&model.Comment{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user's comments"})
		return
	}

	// Delete posts by user
	if err := tx.Where("author_id = ?", uid).Delete(&model.Post{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user's posts"})
		return
	}

	// Delete user
	if err := tx.Delete(&model.User{}, uid).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "User and all related data deleted"})
}
func (s *Server) GetAllReport(c *gin.Context) {
	var reports []model.Report
	db := s.db.Gorm()
	if err := db.Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reports"})
		return
	}

	if len(reports) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "No reports found",
			"data":    []model.Report{},
		})
		return
	}

	c.JSON(http.StatusOK, reports)
}

func (s *Server) CheckIfAdmin(c *gin.Context) {
	idParam := c.Param("userId")
	userID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user model.User
	if err := s.db.Gorm().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"name":     user.Name,
		"is_admin": user.IsAdmin,
	})
}

// DELETE /api/admin/reports/:type/:contentID
func (s *Server) IgnoreReport(c *gin.Context) {
	contentType := c.Param("type")    // "post" or "comment"
	contentID := c.Param("contentID") // the ID of the post or comment

	if contentType != "post" && contentType != "comment" {
		c.JSON(400, gin.H{"error": "Invalid report type"})
		return
	}

	if err := s.db.Where("type = ? AND content_id = ?", contentType, contentID).
		Delete(&models.Report{}).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to ignore report"})
		return
	}

	c.JSON(200, gin.H{"message": "Report ignored successfully"})
}
