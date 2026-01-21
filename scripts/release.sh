#!/bin/bash
set -e

# Release script for @mentalmodel/cli
# Usage: ./scripts/release.sh [patch|minor|major]

VERSION_TYPE=${1:-patch}

echo "Releasing @mentalmodel/cli ($VERSION_TYPE)..."

# Ensure we're in the repo root
cd "$(dirname "$0")/.."

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Uncommitted changes detected. Please commit or stash them first."
  exit 1
fi

# Build web app with relative base path for npm distribution
echo "Building web app..."
cd packages/web
VITE_BASE_PATH="./" bun run build
cd ../..

# Build CLI with bundled web assets
echo "Building CLI..."
cd packages/cli
bun run build

# Bump version
echo "Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")

cd ../..

# Commit and tag
echo "Committing release..."
git add packages/cli/package.json packages/web/dist
git commit -m "Release @mentalmodel/cli v$NEW_VERSION"
git tag "v$NEW_VERSION"

# Publish to npm
echo "Publishing to npm..."
cd packages/cli
npm publish --access public

cd ../..

# Push to git
echo "Pushing to git..."
git push && git push --tags

echo ""
echo "Successfully released @mentalmodel/cli v$NEW_VERSION"
