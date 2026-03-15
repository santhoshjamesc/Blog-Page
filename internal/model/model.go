// Package model defines all database models for the application.
package model

import (
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	gorm.Model
	ID    uint   `gorm:"primaryKey" json:"id"`
	Name  string `gorm:"type:varchar(100);not null" json:"name" validate:"required,min=2,max=100"`
	Email string `gorm:"type:varchar(255);uniqueIndex;not null" json:"email" validate:"required,email"`
	Phone string `gorm:"type:varchar(20)" json:"phone,omitempty" validate:"omitempty,min=10,max=20"`
	//Password string  `gorm:"type:varchar(255);not null" json:"-"` // Never serialize password
	Password string  `gorm:"type:varchar(255);not null" json:""`
	Bio      string  `gorm:"type:text" json:"bio,omitempty"`
	Avatar   string  `gorm:"type:varchar(500)" json:"avatar,omitempty"`
	DOB      *string `json:"dob"`
	IsAdmin  bool    `gorm:"default:false" json:"is_admin"`

	//Role     *string `gorm:"type:varchar(50);default:'user'" json:"role,omitempty"`
	// Relationships
	Posts    []Post    `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
	Comments []Comment `gorm:"foreignKey:UserID" json:"comments,omitempty"`
}

// TableName sets the table name for User model
func (User) TableName() string {
	return "users"
}

// Post represents a blog post
type Post struct {
	gorm.Model
	ID          uint   `gorm:"primaryKey" json:"id"`
	AuthorID    uint   `gorm:"not null;index" json:"author_id"`
	Title       string `gorm:"type:varchar(255);not null" json:"title" validate:"required,min=5,max=255"`
	Category    string `gorm:"type:varchar(100);index" json:"category" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	Content     string `gorm:"type:text" json:"content"`
	Upvotes     int    `gorm:"default:0" json:"upvotes"`
	Downvotes   int    `gorm:"default:0" json:"downvotes"`
	ViewCount   int    `gorm:"default:0" json:"view_count"`
	IsPublished bool   `json:"is_published" gorm:"column:is_published;not null"`

	Author   User      `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Comments []Comment `gorm:"foreignKey:PostID" json:"comments,omitempty"`

	UserVote int8 `gorm:"-" json:"userVote"`
}

type Report struct {
	gorm.Model
	ContentID  uint   `gorm:"index:idx_type_contentid,unique" json:"id"`   // Reported post/comment ID
	ReporterID uint   `json:"reporterId"`                                  // Who reported it
	Type       string `gorm:"index:idx_type_contentid,unique" json:"type"` // "post" or "comment"
	View       bool   `gorm:"default:false" json:"view"`                   // Mark if reviewed
}

// TableName sets the table name for Post model
func (Post) TableName() string {
	return "posts"
}

// GetVoteScore returns the net vote score
func (p *Post) GetVoteScore() int {
	return p.Upvotes - p.Downvotes
}

// Comment represents a comment on a post
type Comment struct {
	gorm.Model
	ID        uint   `gorm:"primaryKey" json:"id"`           // Primary Key
	PostID    uint   `gorm:"not null;index" json:"post_id"`  // FK to Post
	UserID    *uint  `gorm:"index" json:"user_id"`           // FK to User (nullable)
	ParentID  *uint  `gorm:"index" json:"parentId"`          // FK to Comment (self-ref, nullable)
	Text      string `gorm:"type:text;not null" json:"text"` // Comment body
	Upvotes   int    `gorm:"default:0" json:"upvotes"`
	Downvotes int    `gorm:"default:0" json:"downvotes"`

	// Relationships
	Post    Post      `gorm:"foreignKey:PostID" json:"post,omitempty"`      // belongsTo Post
	User    *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`      // belongsTo User
	Parent  *Comment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`  // belongsTo parent Comment
	Replies []Comment `gorm:"foreignKey:ParentID" json:"replies,omitempty"` // hasMany Replies

	// Virtual fields (not saved to DB)
	Likes    []uint `gorm:"-" json:"likes"`
	Dislikes []uint `gorm:"-" json:"dislikes"`
}

// TableName sets the table name for Comment model
func (Comment) TableName() string {
	return "comments"
}

// GetVoteScore returns the net vote score
func (c *Comment) GetVoteScore() int {
	return c.Upvotes - c.Downvotes
}

// Vote represents a user's vote on a post or comment
type Vote struct {
	gorm.Model
	ID        uint  `gorm:"primaryKey" json:"id"`
	UserID    uint  `gorm:"not null;index:idx_user_votes" json:"user_id"`
	PostID    *uint `gorm:"index:idx_post_votes" json:"post_id,omitempty"`
	CommentID *uint `gorm:"index:idx_comment_votes" json:"comment_id,omitempty"`
	VoteType  int8  `gorm:"not null" json:"vote_type"` // 1 for upvote, -1 for downvote

	// Relationships
	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Post    *Post    `gorm:"foreignKey:PostID" json:"post,omitempty"`
	Comment *Comment `gorm:"foreignKey:CommentID" json:"comment,omitempty"`
}

// TableName sets the table name for Vote model
func (Vote) TableName() string {
	return "votes"
}

// BeforeCreate ensures vote is either for post or comment, not both
func (v *Vote) BeforeCreate(_ *gorm.DB) error {
	if (v.PostID == nil && v.CommentID == nil) || (v.PostID != nil && v.CommentID != nil) {
		return gorm.ErrInvalidData
	}
	if v.VoteType != 1 && v.VoteType != -1 {
		return gorm.ErrInvalidData
	}
	return nil
}

// // CreateIndexes creates additional database indexes for optimization
// func CreateIndexes(db *gorm.DB) error {
// 	// Composite indexes for better query performance
// 	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC)").Error; err != nil {
// 		return err
// 	}

// 	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_posts_category_published ON posts(category, is_published, created_at DESC)").Error; err != nil {
// 		return err
// 	}

// 	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC)").Error; err != nil {
// 		return err
// 	}

// 	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_votes_user_post ON votes(user_id, post_id)").Error; err != nil {
// 		return err
// 	}

// 	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_votes_user_comment ON votes(user_id, comment_id)").Error; err != nil {
// 		return err
// 	}

// 	return nil
// }
