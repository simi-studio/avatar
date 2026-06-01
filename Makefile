# Simi Avatar — project task runner
#
# Thin wrapper over the npm scripts so common workflows have a single, stable
# entry point. Run `make help` to list available targets.

# Use bash with strict flags for any recipe that needs a shell.
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

NPM ?= npm

.PHONY: help install dev build start lint typecheck test test-watch coverage \
	guard check qa preview deploy deploy-prod clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	$(NPM) install

dev: ## Start the local dev server
	$(NPM) run dev

build: ## Production build
	$(NPM) run build

start: ## Start the production server (after build)
	$(NPM) run start

lint: ## Run ESLint
	$(NPM) run lint

typecheck: ## Run the TypeScript type checker
	$(NPM) run typecheck

test: ## Run unit tests once
	$(NPM) run test

test-watch: ## Run unit tests in watch mode
	$(NPM) run test:watch

coverage: ## Run unit tests with coverage
	$(NPM) run test:coverage

guard: ## Guard against secret logging
	$(NPM) run guard:secrets

# Full local gate, mirroring CI ordering.
check: guard lint typecheck test build ## Run the full local quality gate

qa: check ## Alias for the full local quality gate

preview: ## Build and preview the Cloudflare Workers bundle locally
	$(NPM) run preview

deploy: ## Build and deploy to Cloudflare Workers (requires wrangler auth)
	$(NPM) run deploy

deploy-prod: ## Build and deploy to the production domain (uses wrangler.prod.jsonc)
	$(NPM) run deploy:prod

clean: ## Remove build artifacts and caches
	rm -rf .next .open-next .wrangler coverage tsconfig.tsbuildinfo
