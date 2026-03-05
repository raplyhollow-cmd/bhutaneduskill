#!/bin/bash
# Script to remove test-gemini.js from git history

echo "⚠️  REMOVING EXPOSED API KEY FROM GIT HISTORY"
echo "==============================================="
echo ""

# Step 1: Install git-filter-repo if not present
echo "Step 1: Checking for git-filter-repo..."
if ! command -v git-filter-repo &> /dev/null; then
    echo "Installing git-filter-repo..."
    pip install git-filter-repo
fi

# Step 2: Remove test-gemini.js from history
echo ""
echo "Step 2: Removing test-gemini.js from git history..."
git filter-repo --path test-gemini.js --invert-paths --force

# Step 3: Force push to rewrite remote history
echo ""
echo "Step 3: Force pushing to GitHub..."
echo "⚠️  WARNING: This will rewrite git history!"
echo "Run manually: git push origin --force --all"
echo ""
echo "✅ File removed from history."
echo ""
echo "NEXT STEPS:"
echo "1. Regenerate your Gemini API key (the old one is compromised)"
echo "2. Run: git push origin --force --all"
echo "3. Make repo private at: https://github.com/raplyhollow-cmd/bhutaneduskill/settings"
