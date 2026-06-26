#!/usr/bin/env bash
# Usage: ./scripts/new-feature.sh <feature-name> [fix|feature|test]
# Creates an isolated git worktree branched from dev.
set -e

NAME="$1"
TYPE="${2:-feature}"

if [ -z "$NAME" ]; then
  echo "Usage: $0 <name> [fix|feature|test]"
  exit 1
fi

BRANCH="${TYPE}/${NAME}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PARENT_DIR="$(dirname "$REPO_ROOT")"
WORKTREE_PATH="${PARENT_DIR}/matchday-wt-${NAME}"

# Create worktree + new branch from local dev (no fetch — push to origin only when ready)
echo "Creating worktree at ${WORKTREE_PATH} on branch ${BRANCH}..."
git worktree add "$WORKTREE_PATH" -b "$BRANCH" dev

# Install dependencies in the new worktree
echo "Installing dependencies..."
(cd "$WORKTREE_PATH" && npm install --silent)

# Copy .env so Supabase works in the worktree
if [ -f "${REPO_ROOT}/.env" ]; then
  cp "${REPO_ROOT}/.env" "${WORKTREE_PATH}/.env"
  echo "Copied .env to worktree."
fi

echo ""
echo "Done! Open a new Claude Code tab at:"
echo "  $WORKTREE_PATH"
echo ""
echo "When finished and tested, run:"
echo "  ./scripts/finish-feature.sh ${NAME}"
echo ""
echo "Then push when ready:"
echo "  git push origin dev"
