// Package server defines all HTTP handlers for the Skryfon blog platform.
package server

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"skryfon_blog/internal/model"
	"strconv"
	"strings"
	"time"
)

// CreateUser inserts a new user
func (s *Server) CreateUser(c *gin.Context) {
	var user model.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	// ✅ Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	user.Password = string(hashedPassword)
	user.CreatedAt = time.Now()

	if err := s.db.Gorm().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// 🚫 Don't send hashed password back in response
	user.Password = ""
	c.JSON(http.StatusOK, user)
}

// LoginUser handles user login (testing only)
func (s *Server) LoginUser(c *gin.Context) {
	var creds struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&creds); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var user model.User
	// ✅ Look up by email only
	if err := s.db.Gorm().Where("email = ?", creds.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// ✅ Compare hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// 🚫 Don't send password back
	user.Password = ""

	c.JSON(http.StatusOK, user)
}

// CreatePost inserts a new post
func (s *Server) CreatePost(c *gin.Context) {
	var post model.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()
	if err := s.db.Gorm().Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, post)
}

// GetAllPosts returns all posts with authors and comments, and includes userVote
func (s *Server) GetAllPosts(c *gin.Context) {
	var posts []model.Post
	userIDStr := c.Query("user_id")
	var userID uint
	if userIDStr != "" {
		if parsed, err := strconv.ParseUint(userIDStr, 10, 64); err == nil {
			userID = uint(parsed)
		}
	}

	if err := s.db.Gorm().
		Preload("Author").
		Preload("Comments").
		Preload("Comments.User").
		Where("is_published = ?", true).
		Order("created_at DESC").
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	if userID != 0 {
		var votes []model.Vote
		s.db.Gorm().Where("user_id = ? AND post_id IS NOT NULL", userID).Find(&votes)

		voteMap := make(map[uint]int8)
		for _, vote := range votes {
			if vote.PostID != nil {
				voteMap[*vote.PostID] = vote.VoteType
			}
		}

		for i := range posts {
			if v, ok := voteMap[posts[i].ID]; ok {
				posts[i].UserVote = v
			}
		}
	}

	c.JSON(http.StatusOK, posts)
}

// GetUserPosts retrieves all posts created by a specific user.
func (s *Server) GetUserPosts(c *gin.Context) {
	var posts []model.Post

	userIDStr := c.Query("user_id")
	log.Println("user_id from query:", userIDStr)
	fmt.Println("user_id from query:", userIDStr)

	var userID uint
	if userIDStr != "" {
		if parsed, err := strconv.ParseUint(userIDStr, 10, 64); err == nil {
			userID = uint(parsed)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_id"})
		return
	}

	// ✅ Filter by author_id
	if err := s.db.Gorm().
		Preload("Author").
		Preload("Comments").
		Preload("Comments.User").
		Where("author_id = ?", userID).
		Order("created_at DESC").
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	// Optional: attach votes
	var votes []model.Vote
	s.db.Gorm().Where("user_id = ? AND post_id IS NOT NULL", userID).Find(&votes)

	voteMap := make(map[uint]int8)
	for _, vote := range votes {
		if vote.PostID != nil {
			voteMap[*vote.PostID] = vote.VoteType
		}
	}
	for i := range posts {
		if v, ok := voteMap[posts[i].ID]; ok {
			posts[i].UserVote = v
		}
	}

	c.JSON(http.StatusOK, posts)
}

// GetPostByID returns one post with author, comments, and userVote
func (s *Server) GetPostByID(c *gin.Context) {
	id := c.Param("id")
	userIDStr := c.Query("user_id")
	var userID uint
	if userIDStr != "" {
		if parsed, err := strconv.ParseUint(userIDStr, 10, 64); err == nil {
			userID = uint(parsed)
		}
	}

	var post model.Post
	if err := s.db.Gorm().
		Preload("Author").
		Preload("Comments").
		Preload("Comments.User").
		First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Attach post-level user vote
	if userID != 0 {
		var vote model.Vote
		if err := s.db.Gorm().
			Where("user_id = ? AND post_id = ?", userID, post.ID).
			First(&vote).Error; err == nil {
			post.UserVote = vote.VoteType
		}
	}

	// Load votes for comments
	commentIDs := getCommentIDs(post.Comments)
	if len(commentIDs) > 0 {
		var votes []model.Vote
		s.db.Gorm().Where("comment_id IN ?", commentIDs).Find(&votes)

		voteMap := make(map[uint][]model.Vote)
		for _, v := range votes {
			if v.CommentID != nil {
				voteMap[*v.CommentID] = append(voteMap[*v.CommentID], v)
			}
		}

		for i := range post.Comments {
			cid := post.Comments[i].ID
			for _, v := range voteMap[cid] {
				if v.VoteType == 1 {
					post.Comments[i].Likes = append(post.Comments[i].Likes, v.UserID)
				} else if v.VoteType == -1 {
					post.Comments[i].Dislikes = append(post.Comments[i].Dislikes, v.UserID)
				}
			}
		}
	}

	c.JSON(http.StatusOK, post)
}

// UpdatePostVote handles per-user voting and updates post counts
func (s *Server) UpdatePostVote(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Vote   string `json:"vote"`    // "up", "down", or "remove"
		UserID uint   `json:"user_id"` // required
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var post model.Post
	if err := s.db.Gorm().First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	var vote model.Vote
	db := s.db.Gorm()
	db.Where("user_id = ? AND post_id = ?", req.UserID, post.ID).First(&vote)

	oldVote := vote.VoteType
	var newVote int8

	switch req.Vote {
	case "up":
		newVote = 1
	case "down":
		newVote = -1
	case "remove":
		newVote = 0
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vote type"})
		return
	}

	// Handle vote change or removal
	if oldVote != 0 {
		// Undo old vote
		if oldVote == 1 {
			post.Upvotes--
		} else if oldVote == -1 {
			post.Downvotes--
		}

		// Remove vote if needed
		if newVote == 0 {
			db.Delete(&vote)
		} else {
			vote.VoteType = newVote
			db.Save(&vote)
		}
	} else if newVote != 0 {
		// New vote
		vote = model.Vote{
			UserID:   req.UserID,
			PostID:   &post.ID,
			VoteType: newVote,
		}
		db.Create(&vote)
	}

	// Apply new vote count
	if newVote == 1 {
		post.Upvotes++
	} else if newVote == -1 {
		post.Downvotes++
	}

	db.Save(&post)

	c.JSON(http.StatusOK, gin.H{
		"upvotes":   post.Upvotes,
		"downvotes": post.Downvotes,
		"userVote":  newVote,
	})
}

// CreateComment adds a comment to a post
func (s *Server) CreateComment(c *gin.Context) {
	var comment model.Comment

	// Bind JSON input first
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse and set post ID from URL
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 64)
	if err != nil || postID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID in URL"})
		return
	}
	comment.PostID = uint(postID)

	// Trim and validate comment text
	comment.Text = strings.TrimSpace(comment.Text)
	if comment.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comment text cannot be empty"})
		return
	}

	// Validate PostID
	var post model.Post
	if err := s.db.Gorm().First(&post, comment.PostID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post not found"})
		return
	}

	// Validate optional UserID
	if comment.UserID != nil {
		var user model.User
		if err := s.db.Gorm().First(&user, *comment.UserID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
			return
		}
	}

	// Validate optional ParentID
	if comment.ParentID != nil {
		var parent model.Comment
		if err := s.db.Gorm().First(&parent, *comment.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent_id"})
			return
		}
	}

	// Save comment
	if err := s.db.Gorm().Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, comment)
}

// DeleteComment deletes a comment
func (s *Server) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	if err := s.db.Gorm().Delete(&model.Comment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}
	c.Status(http.StatusNoContent)
}

// VoteComment handles per-user comment voting
func (s *Server) VoteComment(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Type   string `json:"type"`    // "like", "dislike", "remove"
		UserID uint   `json:"user_id"` // required
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var comment model.Comment
	if err := s.db.Gorm().First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	var vote model.Vote
	tx := s.db.Gorm()
	tx.Where("user_id = ? AND comment_id = ?", req.UserID, comment.ID).First(&vote)

	oldVote := vote.VoteType
	newVote := int8(0)
	switch req.Type {
	case "like":
		newVote = 1
	case "dislike":
		newVote = -1
	case "remove":
		newVote = 0
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vote type"})
		return
	}

	if oldVote != 0 {
		if oldVote == 1 {
			comment.Upvotes--
		} else if oldVote == -1 {
			comment.Downvotes--
		}

		if newVote == 0 {
			tx.Delete(&vote)
		} else {
			vote.VoteType = newVote
			tx.Save(&vote)
		}
	} else if newVote != 0 {
		vote = model.Vote{
			UserID:    req.UserID,
			CommentID: &comment.ID,
			VoteType:  newVote,
		}
		tx.Create(&vote)
	}

	if newVote == 1 {
		comment.Upvotes++
	} else if newVote == -1 {
		comment.Downvotes++
	}

	tx.Save(&comment)

	c.JSON(http.StatusOK, gin.H{
		"upvotes":   comment.Upvotes,
		"downvotes": comment.Downvotes,
		"userVote":  newVote,
	})
}
func getCommentIDs(comments []model.Comment) []uint {
	ids := make([]uint, len(comments))
	for i, c := range comments {
		ids[i] = c.ID
	}
	return ids
}

// UpdatePost updates an existing post's title, content, or category.
func (s *Server) UpdatePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var updatedPost model.Post
	if err := c.ShouldBindJSON(&updatedPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if updatedPost.ID != uint(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID mismatch"})
		return
	}

	var existingPost model.Post
	if err := s.db.Gorm().First(&existingPost, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// ✅ Update editable fields
	existingPost.Title = updatedPost.Title
	existingPost.Content = updatedPost.Content
	existingPost.Category = updatedPost.Category
	existingPost.UpdatedAt = time.Now()

	if err := s.db.Gorm().Save(&existingPost).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, existingPost)
}

// TogglePublishStatus toggles the published state of a post.
func (s *Server) TogglePublishStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var body struct {
		IsPublished bool `json:"is_published"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
		return
	}

	//fmt.Printf("Received publish toggle: Post ID %d -> %v\n", id, body.IsPublished)

	var post model.Post
	if err := s.db.Gorm().First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	post.IsPublished = body.IsPublished

	if err := s.db.Gorm().Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	//fmt.Printf("After update: post.IsPublished = %v\n", post.IsPublished)

	c.JSON(http.StatusOK, post)
}

// UpdateUser updates the user's profile info (name, email, etc.).
func (s *Server) UpdateUser(c *gin.Context) {
	var input struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		DOB      string `json:"dob"`
		Bio      string `json:"bio"`
		Avatar   string `json:"avatar"`
		Password string `json:"password"` // plaintext password for verification
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var user model.User
	if err := s.db.Gorm().First(&user, input.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// ✅ Compare hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password"})
		return
	}

	// ✅ Update fields
	user.Name = input.Name
	user.Email = input.Email
	user.Phone = input.Phone
	if strings.TrimSpace(input.DOB) == "" {
		user.DOB = nil
	} else {
		dob := input.DOB
		user.DOB = &dob
	}
	user.Bio = input.Bio
	user.Avatar = input.Avatar

	if err := s.db.Gorm().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// 🚫 Don't send password back
	user.Password = ""

	c.JSON(http.StatusOK, user)
}

// ChangeUserPassword updates the user's password after verifying old one.
func (s *Server) ChangeUserPassword(c *gin.Context) {
	var input struct {
		Password    string `json:"password"`
		NewPassword string `json:"newPassword"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Parse user ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user model.User
	if err := s.db.Gorm().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// ✅ Check current password (hashed)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect current password"})
		return
	}

	// ✅ Hash the new password
	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	// Save the new hashed password
	user.Password = string(hashedNewPassword)

	if err := s.db.Gorm().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// DeleteUser removes a user and all associated posts from the system.
func (s *Server) DeleteUser(c *gin.Context) {
	var input struct {
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Parse user ID from path
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user model.User
	if err := s.db.Gorm().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// ✅ Compare hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password"})
		return
	}

	// ✅ Delete user's posts
	if err := s.db.Gorm().Where("author_id = ?", user.ID).Delete(&model.Post{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user's posts"})
		return
	}

	// ✅ Delete the user
	if err := s.db.Gorm().Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User and their posts deleted"})
}

// DeleteUserPost deletes a specific post created by a user.
func (s *Server) DeleteUserPost(c *gin.Context) {
	id := c.Param("id")

	// Optional: Convert ID to uint
	postID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	// Delete the post by ID
	result := s.db.Gorm().Delete(&model.Post{}, postID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.Status(http.StatusNoContent) // 204 No Content
}

// sant added..........................................
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
func (s *Server) AFetchUsers(c *gin.Context) {
	search := c.Query("search")
	var users []model.User

	err := s.db.Gorm().
		Where("name ILIKE ? OR CAST(id AS TEXT) ILIKE ?", "%"+search+"%", "%"+search+"%").
		Find(&users).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (s *Server) AFetchPosts(c *gin.Context) {
	search := c.Query("search")
	var posts []model.Post

	err := s.db.Gorm().Where("title ILIKE ?", "%"+search+"%").Find(&posts).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func (s *Server) ADeleteUser(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	result := s.db.Gorm().Delete(&model.User{}, userID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (s *Server) ADeletePost(c *gin.Context) {
	idStr := c.Param("id")
	postID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	result := s.db.Gorm().Delete(&model.Post{}, postID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

//report

// SubmitReport handles submission of a new report.
// It enforces a unique constraint on (type, reportedId).
func (s *Server) SubmitReport(c *gin.Context) {
	var req struct {
		ReporterID uint   `json:"reporterId"`
		ReportedID uint   `json:"reportedId"`
		Type       string `json:"type"`
		Details    string `json:"details"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	report := model.Report{
		ContentID: req.ReportedID,
		// or req.ReportedID — match your JSON field
		ReporterID: req.ReporterID,
		Type:       req.Type,
	}

	if err := s.db.Gorm().Create(&report).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Report already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Report submitted"})
}
func (s *Server) AFetchreports(c *gin.Context) {
	var reports []model.Report

	if err := s.db.Gorm().Order("created_at desc").Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reports"})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// DELETE /api/admin/reports/:type/:contentID
func (s *Server) IgnoreReport(c *gin.Context) {
	reportID := c.Param("id") // the primary key ID of the report

	// Debug: Check what we're trying to delete
	fmt.Printf("Attempting to delete report with ID: %s\n", reportID)

	// First, check if the record exists
	var count int64
	s.db.Gorm().Model(&model.Report{}).Where("id = ?", reportID).Count(&count)
	fmt.Printf("Found %d records matching the criteria\n", count)

	result := s.db.Gorm().Where("id = ?", reportID).Delete(&model.Report{})

	if result.Error != nil {
		fmt.Printf("Error deleting: %v\n", result.Error)
		c.JSON(500, gin.H{"error": "Failed to ignore report"})
		return
	}

	fmt.Printf("Rows affected: %d\n", result.RowsAffected)

	if result.RowsAffected == 0 {
		c.JSON(404, gin.H{"error": "Report not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Report ignored successfully"})
}

// server/report_handler.go
// DELETE /api/admin/reports/:id/delete-content
// DELETE /api/reports/content/:type/:id
func (s *Server) DeleteContent(c *gin.Context) {
	contentType := c.Param("type") // should be "post" or "comment"
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	switch contentType {
	case "post":
		var post model.Post
		if err := s.db.Gorm().Preload("Comments").First(&post, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}

		// Delete votes on the post
		s.db.Gorm().Where("post_id = ?", post.ID).Delete(&model.Vote{})

		// Delete votes and replies on comments under the post
		for _, comment := range post.Comments {
			s.db.Gorm().Where("comment_id = ?", comment.ID).Delete(&model.Vote{})

			var replies []model.Comment
			s.db.Gorm().Where("parent_id = ?", comment.ID).Find(&replies)
			for _, reply := range replies {
				s.db.Gorm().Where("comment_id = ?", reply.ID).Delete(&model.Vote{})
			}
			s.db.Gorm().Where("parent_id = ?", comment.ID).Delete(&model.Comment{})
		}

		// Delete comments under the post
		s.db.Gorm().Where("post_id = ?", post.ID).Delete(&model.Comment{})

		// Delete the post
		if err := s.db.Gorm().Delete(&post).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
			return
		}

	case "comment":
		var comment model.Comment
		if err := s.db.Gorm().First(&comment, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
			return
		}

		// Delete votes on the comment
		s.db.Gorm().Where("comment_id = ?", comment.ID).Delete(&model.Vote{})

		// Delete votes and replies on this comment
		var replies []model.Comment
		s.db.Gorm().Where("parent_id = ?", comment.ID).Find(&replies)
		for _, reply := range replies {
			s.db.Gorm().Where("comment_id = ?", reply.ID).Delete(&model.Vote{})
		}
		s.db.Gorm().Where("parent_id = ?", comment.ID).Delete(&model.Comment{})

		// Delete the comment
		if err := s.db.Gorm().Delete(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
			return
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type, must be 'post' or 'comment'"})
		return
	}

	c.Status(http.StatusNoContent) // 204
}

func (s *Server) GetCommentByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var comment model.Comment
	if err := s.db.Gorm().First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	c.JSON(http.StatusOK, comment)
}

func (s *Server) GetuserByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user model.User
	if err := s.db.Gorm().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":   user.ID,
		"name": user.Name,
	})
}
