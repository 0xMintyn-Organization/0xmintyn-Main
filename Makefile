# 0xMintyn DeFi Platform Makefile

.PHONY: help setup dev build test deploy clean docker-up docker-down install-deps

# Default target
help:
	@echo "0xMintyn DeFi Platform - Available Commands:"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  setup          - Complete project setup (install deps, build contracts)"
	@echo "  install-deps   - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  dev            - Start all development servers"
	@echo "  dev-backend    - Start backend development server only"
	@echo "  dev-frontend   - Start frontend development server only"
	@echo "  dev-validator  - Start local Solana validator"
	@echo ""
	@echo "Building:"
	@echo "  build          - Build all components"
	@echo "  build-backend  - Build backend only"
	@echo "  build-frontend - Build frontend only"
	@echo "  build-contracts- Build all Solana programs"
	@echo ""
	@echo "Testing:"
	@echo "  test           - Run all tests"
	@echo "  test-backend   - Run backend tests"
	@echo "  test-frontend  - Run frontend tests"
	@echo "  test-contracts - Run contract tests"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy         - Deploy all contracts and build"
	@echo "  deploy-devnet  - Deploy to Solana devnet"
	@echo "  deploy-mainnet - Deploy to Solana mainnet"
	@echo ""
	@echo "Docker:"
	@echo "  docker-up      - Start all services with Docker"
	@echo "  docker-down    - Stop all Docker services"
	@echo "  docker-logs    - View Docker logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean          - Clean build artifacts and node_modules"
	@echo "  lint           - Run linting on all components"
	@echo "  format         - Format code with prettier"

# Setup and Installation
setup: install-deps build-contracts
	@echo "✅ Project setup complete!"

install-deps:
	@echo "📦 Installing root dependencies..."
	npm install
	@echo "📦 Installing backend dependencies..."
	cd Backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd Frontend && npm install
	@echo "📦 Installing contract dependencies..."
	@for dir in contracts/*/; do \
		if [ -f "$$dir/package.json" ]; then \
			echo "📦 Installing dependencies in $$dir"; \
			cd "$$dir" && npm install && cd ../..; \
		fi \
	done

# Development
dev:
	@echo "🚀 Starting all development servers..."
	npm run dev

dev-backend:
	@echo "🚀 Starting backend development server..."
	cd Backend && npm run dev

dev-frontend:
	@echo "🚀 Starting frontend development server..."
	cd Frontend && npm run dev

dev-validator:
	@echo "🚀 Starting local Solana validator..."
	solana-test-validator --reset --quiet

# Building
build: build-contracts build-backend build-frontend
	@echo "✅ All components built successfully!"

build-backend:
	@echo "🔨 Building backend..."
	cd Backend && npm run build

build-frontend:
	@echo "🔨 Building frontend..."
	cd Frontend && npm run build

build-contracts:
	@echo "🔨 Building all Solana programs..."
	@for dir in contracts/*/anchor; do \
		if [ -f "$$dir/Anchor.toml" ]; then \
			echo "🔨 Building contract in $$dir"; \
			cd "$$dir" && anchor build && cd ../../..; \
		fi \
	done

# Testing
test: test-backend test-contracts
	@echo "✅ All tests completed!"

test-backend:
	@echo "🧪 Running backend tests..."
	cd Backend && npm test

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd Frontend && npm test

test-contracts:
	@echo "🧪 Running contract tests..."
	@for dir in contracts/*/anchor; do \
		if [ -f "$$dir/Anchor.toml" ]; then \
			echo "🧪 Testing contract in $$dir"; \
			cd "$$dir" && anchor test && cd ../../..; \
		fi \
	done

# Deployment
deploy: build deploy-contracts
	@echo "🚀 Deployment completed!"

deploy-devnet:
	@echo "🚀 Deploying to Solana devnet..."
	@for dir in contracts/*/anchor; do \
		if [ -f "$$dir/Anchor.toml" ]; then \
			echo "🚀 Deploying contract in $$dir to devnet"; \
			cd "$$dir" && anchor deploy --provider.cluster devnet && cd ../../..; \
		fi \
	done

deploy-mainnet:
	@echo "🚀 Deploying to Solana mainnet..."
	@echo "⚠️  WARNING: This will deploy to mainnet! Are you sure? (Press Ctrl+C to cancel)"
	@sleep 5
	@for dir in contracts/*/anchor; do \
		if [ -f "$$dir/Anchor.toml" ]; then \
			echo "🚀 Deploying contract in $$dir to mainnet"; \
			cd "$$dir" && anchor deploy --provider.cluster mainnet && cd ../../..; \
		fi \
	done

deploy-contracts:
	@echo "🚀 Deploying all contracts..."
	npm run deploy:contracts

# Docker Operations
docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

# Maintenance
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf Backend/build Backend/node_modules
	rm -rf Frontend/.next Frontend/node_modules
	@for dir in contracts/*/; do \
		if [ -d "$$dir/anchor/target" ]; then \
			echo "🧹 Cleaning $$dir/anchor/target"; \
			rm -rf "$$dir/anchor/target"; \
		fi \
		if [ -d "$$dir/node_modules" ]; then \
			echo "🧹 Cleaning $$dir/node_modules"; \
			rm -rf "$$dir/node_modules"; \
		fi \
	done
	rm -rf node_modules
	@echo "✅ Cleanup complete!"

lint:
	@echo "🔍 Running linting..."
	cd Backend && npm run lint || true
	cd Frontend && npm run lint || true

format:
	@echo "💄 Formatting code..."
	npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"

# Solana specific commands
solana-config:
	@echo "⚙️  Configuring Solana CLI..."
	solana config set --url devnet
	solana config set --keypair ~/.config/solana/id.json

solana-airdrop:
	@echo "💰 Requesting SOL airdrop..."
	solana airdrop 2

solana-balance:
	@echo "💰 Checking SOL balance..."
	solana balance

# Program specific builds
build-ubi:
	@echo "🔨 Building UBI program..."
	cd contracts/mintyn-ubi-distribution/anchor && anchor build

build-governance:
	@echo "🔨 Building Governance program..."
	cd contracts/mintyn-governance/anchor && anchor build

build-marketplace:
	@echo "🔨 Building Marketplace program..."
	cd contracts/mintyn-digital-marketplace/anchor && anchor build

build-bridge:
	@echo "🔨 Building Cross-chain Bridge program..."
	cd contracts/mintyn-cross-chain-bridge/anchor && anchor build

build-escrow:
	@echo "🔨 Building P2P Escrow program..."
	cd contracts/mintyn-p2p-escrow/anchor && anchor build

build-token:
	@echo "🔨 Building SPL Token program..."
	cd contracts/mintyn-spl-token/anchor && anchor build

# Program specific tests
test-ubi:
	@echo "🧪 Testing UBI program..."
	cd contracts/mintyn-ubi-distribution/anchor && anchor test

test-governance:
	@echo "🧪 Testing Governance program..."
	cd contracts/mintyn-governance/anchor && anchor test

test-marketplace:
	@echo "🧪 Testing Marketplace program..."
	cd contracts/mintyn-digital-marketplace/anchor && anchor test

test-bridge:
	@echo "🧪 Testing Cross-chain Bridge program..."
	cd contracts/mintyn-cross-chain-bridge/anchor && anchor test

test-escrow:
	@echo "🧪 Testing P2P Escrow program..."
	cd contracts/mintyn-p2p-escrow/anchor && anchor test

test-token:
	@echo "🧪 Testing SPL Token program..."
	cd contracts/mintyn-spl-token/anchor && anchor test

# Program specific deployments
deploy-ubi:
	@echo "🚀 Deploying UBI program..."
	cd contracts/mintyn-ubi-distribution/anchor && anchor deploy

deploy-governance:
	@echo "🚀 Deploying Governance program..."
	cd contracts/mintyn-governance/anchor && anchor deploy

deploy-marketplace:
	@echo "🚀 Deploying Marketplace program..."
	cd contracts/mintyn-digital-marketplace/anchor && anchor deploy

deploy-bridge:
	@echo "🚀 Deploying Cross-chain Bridge program..."
	cd contracts/mintyn-cross-chain-bridge/anchor && anchor deploy

deploy-escrow:
	@echo "🚀 Deploying P2P Escrow program..."
	cd contracts/mintyn-p2p-escrow/anchor && anchor deploy

deploy-token:
	@echo "🚀 Deploying SPL Token program..."
	cd contracts/mintyn-spl-token/anchor && anchor deploy
