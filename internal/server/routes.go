package server

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (s *Server) RegisterRoutes() http.Handler {
	// === Set up log file ===
	logFile, err := os.OpenFile("bloglog.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("LOG FILE ERROR:", err)
		panic("failed to open bloglog.txt")
	}

	// Enable console colors manually (important)
	gin.ForceConsoleColor()

	// === Gin engine ===
	r := gin.New()

	// Console logger with color
	r.Use(gin.Logger())   // writes to gin.DefaultWriter (os.Stdout with color)
	r.Use(gin.Recovery()) // Recovery middleware

	// Custom file logger (no color)
	r.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start)

		logLine := fmt.Sprintf("[%s] %d | %v | %s | %s %s | UA: %s\n",
			start.Format("2006-01-02 15:04:05"),
			c.Writer.Status(),
			duration,
			c.ClientIP(),
			c.Request.Method,
			c.Request.URL.Path,
			c.Request.UserAgent(),
		)

		logFile.WriteString(logLine)
	})

	// === CORS Setup ===
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// === Routes ===
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "API is working"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	api := r.Group("/api")
	{

		api.GET("/comments/:id", s.GetCommentByID)
		api.GET("/usersid/:id", s.GetuserByID)
		api.GET("/postsid/:id", s.GetPostByID)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", s.CreateUser)
			auth.POST("/signin", s.LoginUser)
		}

		posts := api.Group("/posts")
		{
			posts.GET("", s.GetAllPosts)
			posts.GET("/:id", s.GetPostByID)
			posts.POST("", s.CreatePost)
			posts.POST("/:id/vote", s.UpdatePostVote)
			posts.POST("/:id/comments", s.CreateComment)
			posts.PUT("/:id", s.UpdatePost)
			posts.PATCH("/:id/publish", s.TogglePublishStatus)
		}

		userPosts := api.Group("/userposts")
		{
			userPosts.GET("", s.GetUserPosts)
			userPosts.DELETE("/:id", s.DeleteUserPost)
		}

		comments := api.Group("/comments")
		{
			comments.DELETE("/:id", s.DeleteComment)
			comments.PATCH("/:id/vote", s.VoteComment)
		}

		user := api.Group("/user")
		{
			user.PUT("/:id/update", s.UpdateUser)
			user.DELETE("/:id/delete", s.DeleteUser)
			user.POST("/:id/change-password", s.ChangeUserPassword)
			user.POST("/:id/report", s.SubmitReport)

		}
		admin := api.Group("/admin")
		{
			admin.GET("/check/:userId", s.CheckIfAdmin)
			admin.GET("/users", s.AFetchUsers)
			admin.GET("/posts", s.AFetchPosts)
			admin.GET("/reports", s.AFetchreports)
			admin.DELETE("/users/:id", s.ADeleteUser)
			admin.DELETE("/posts/:id", s.ADeletePost)
			admin.DELETE("/reports/:id", s.IgnoreReport)
			admin.DELETE("/reports/content/:type/:id", s.DeleteContent)

		}
	}

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})

	return r
}
