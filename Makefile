# Simple Makefile for a Go project

# Client folder
CLIENT := client
FRONTEND_CMD := npm run dev
FRONTEND_INSTALL := npm install --prefer-offline --no-fund

# Build the application
all: build test

build:
	@echo "Building..."
	@go build -o main cmd/api/main.go

# Run the application with client
run: run-backend run-client

# Run backend only
run-backend:
	@go run cmd/api/main.go &

# Run frontend client
run-client:
	@$(FRONTEND_INSTALL) --prefix ./$(CLIENT)
	@$(FRONTEND_CMD) --prefix ./$(CLIENT) &

# Install dependencies for client
install-client:
	@$(FRONTEND_INSTALL) --prefix ./$(CLIENT)

# Run DB migration
migrate:
	@echo "Running database migration..."
	@go run cmd/main.go

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
	@if command -v air > /dev/null; then \
            air; \
            echo "Watching...";\
        else \
            read -p "Go's 'air' is not installed on your machine. Do you want to install it? [Y/n] " choice; \
            if [ "$$choice" != "n" ] && [ "$$choice" != "N" ]; then \
                go install github.com/air-verse/air@latest; \
                air; \
                echo "Watching...";\
            else \
                echo "You chose not to install air. Exiting..."; \
                exit 1; \
            fi; \
        fi



.PHONY: all build run run-backend run-client install-client test clean watch
