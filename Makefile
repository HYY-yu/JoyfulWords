# Docker Makefile for JoyfulWords

.PHONY: help build dev prod push clean test

# Default target
help:
	@echo "Available commands:"
	@echo "  make build    - Build production image"
	@echo "  make dev      - Run development environment"
	@echo "  make prod     - Run production container"
	@echo "  make push     - Push image to registry"
	@echo "  make clean    - Remove containers and images"
	@echo "  make test     - Run container tests"

# Build production image
build:
	docker build \
		--target production \
		--tag joyful-words:latest \
		--tag joyful-words:$$(date +%Y%m%d) \
		.

# Build multi-architecture image
build-multi:
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--target production \
		--tag joyful-words:latest \
		.

# Development environment
dev:
	docker-compose up app

# Development environment with rebuild
dev-build:
	docker-compose up --build app

# Production container
prod:
	docker run -d \
		--name joyful-words \
		-p 3000:3000 \
		--env-file .env.production \
		--restart always \
		joyful-words:latest

# Push to registry (set REGISTRY variable)
push:
	docker tag joyful-words:latest $(REGISTRY)/joyful-words:latest
	docker push $(REGISTRY)/joyful-words:latest

# Clean up
clean:
	docker-compose down -v
	docker rm -f joyful-words 2>/dev/null || true
	docker rmi joyful-words:latest 2>/dev/null || true

# Test container
test:
	docker run --rm \
		-p 3000:3000 \
		--env-file .env.test \
		joyful-words:latest \
		sh -c "pnpm build && pnpm start"
