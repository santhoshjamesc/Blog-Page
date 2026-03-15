// Package database provides DB connection, migration, and seeding utilities.
package database

import (
	"log"
	"skryfon_blog/internal/model"

	"gorm.io/gorm"
)

// SeedDummyData inserts sample users and posts into the database for testing.
func SeedDummyData(db *gorm.DB) {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		log.Println("⚠️ Dummy data already exists, skipping seeding.")
		return
	}

	log.Println("🌱 Seeding dummy data...")

	// Users (DO NOT set ID or CreatedAt manually)
	users := []model.User{
		{
			Name:     "Alice Johnson",
			Email:    "alice@example.com",
			Phone:    "9876543210",
			Password: "password1",
			Bio:      "Loves blogging!",
			Avatar:   "https://api.dicebear.com/7.x/thumbs/svg?seed=alice",
		},
		{
			Name:     "Bob Smith",
			Email:    "bob@example.com",
			Phone:    "1234567890",
			Password: "password2",
			Bio:      "Tech enthusiast.",
			Avatar:   "https://api.dicebear.com/7.x/thumbs/svg?seed=bob",
		},
		{
			Name:     "Charlie Day",
			Email:    "charlie@example.com",
			Phone:    "1111111111",
			Password: "password3",
			Bio:      "Comment master.",
			Avatar:   "https://api.dicebear.com/7.x/thumbs/svg?seed=charlie",
		},
		{
			Name:     "Diana Prince",
			Email:    "diana@example.com",
			Phone:    "2222222222",
			Password: "password4",
			Bio:      "Wonder blogger.",
			Avatar:   "https://api.dicebear.com/7.x/thumbs/svg?seed=diana",
		},
	}
	db.Create(&users)

	// Posts
	posts := []model.Post{
		{
			AuthorID:    users[0].ID,
			Title:       "First Post by Alice",
			Category:    "Tech",
			Description: "Intro to Alice's blog",
			Content:     "Alice's thoughts on tech...",
			IsPublished: true,
		},
		{
			AuthorID:    users[1].ID,
			Title:       "Bob's Go Tutorial",
			Category:    "Programming",
			Description: "How to start with Go",
			Content:     "Go is a powerful language...",
			IsPublished: true,
		},
		{
			AuthorID:    users[3].ID,
			Title:       "Diana's Health Blog",
			Category:    "Wellness",
			Description: "Mental and physical health tips",
			Content:     "Stay healthy with these tips...",
			IsPublished: true,
		},
	}
	db.Create(&posts)

	// Comments
	comments := []model.Comment{
		{
			PostID: posts[0].ID,
			UserID: &users[1].ID,
			Text:   "Nice post, Alice!",
		},
		{
			PostID: posts[0].ID,
			UserID: &users[2].ID,
			Text:   "Loved the way you explained tech.",
		},
		{
			PostID: posts[1].ID,
			UserID: &users[0].ID,
			Text:   "Thanks Bob, very helpful tutorial!",
		},
		{
			PostID: posts[2].ID,
			UserID: &users[2].ID,
			Text:   "Great tips Diana, keep posting!",
		},
	}

	db.Create(&comments)

	log.Println("✅ Dummy data seeded.")
}
