# Fix Git Secrets Issue

## Problem
GitHub blocked your push because API keys were exposed in SETUP_INSTRUCTIONS.md

## Solution

### Step 1: Commit the fixed file
```bash
git add SETUP_INSTRUCTIONS.md
git commit -m "security: Remove exposed API keys from documentation"
```

### Step 2: Push the fix
```bash
git push -u origin main
```

## If GitHub still blocks (commit history contains secrets):

### Option A: Amend the last commit (if it's the most recent)
```bash
git add SETUP_INSTRUCTIONS.md
git commit --amend --no-edit
git push -f origin main
```

### Option B: Rewrite history (if secrets are in older commits)
```bash
# Install BFG Repo Cleaner (easier than git filter-branch)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Or use git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch SETUP_INSTRUCTIONS.md" \
  --prune-empty --tag-name-filter cat -- --all

# Then force push
git push -f origin main
```

### Option C: Simplest - Allow the secret on GitHub (NOT RECOMMENDED for production)
1. Go to the GitHub URL provided in the error message
2. Click "Allow secret" for each blocked key
3. Push again

## After fixing:

### Revoke the exposed API keys:
1. **Groq**: Go to console.groq.com → API Keys → Delete old key → Create new
2. **LangChain**: Go to smith.langchain.com → Settings → Revoke key → Create new
3. **HuggingFace**: Go to huggingface.co/settings/tokens → Revoke → Create new

### Update your local .env file with new keys

## Prevention:
- ✅ `.env` is already in `.gitignore`
- ✅ Never commit API keys to documentation
- ✅ Use placeholders like `your-api-key-here`
