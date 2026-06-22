#!/usr/bin/env bash
# Usage: ./scripts/finish-feature.sh <feature-name>
# Merges the feature branch into dev and removes the worktree.
set -e

NAME="$1"

if [ -z "$NAME" ]; then
  echo "Usage: $0 <name>"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
PARENT_DIR="$(dirname "$REPO_ROOT")"
WORKTREE_PATH="${PARENT_DIR}/matchday-wt-${NAME}"

# Detect branch type from existing worktree
BRANCH="$(git -C "$WORKTREE_PATH" rev-parse --abbrev-ref HEAD 2>/dev/null)"

if [ -z "$BRANCH" ]; then
  echo "Worktree not found at $WORKTREE_PATH"
  exit 1
fi

echo "Branch: $BRANCH"
echo "Merging into dev..."

# Switch to dev in main worktree and merge
git checkout dev
git merge --no-ff "$BRANCH" -m "feat: merge ${BRANCH} into dev"

echo "Removing worktree..."
git worktree remove "$WORKTREE_PATH"

echo "Deleting local branch..."
git branch -d "$BRANCH"

echo ""
echo "Done! ${BRANCH} merged into dev and worktree removed."
echo "Push dev when ready: git push origin dev"
