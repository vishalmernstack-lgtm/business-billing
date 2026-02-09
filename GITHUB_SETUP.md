# GitHub Setup Guide

Follow these steps to push your project to GitHub.

## Prerequisites
- Git installed on your computer
- GitHub account created
- Git configured with your name and email

## Step 1: Configure Git (if not already done)

Open your terminal/command prompt and run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Create a New Repository on GitHub

1. Go to https://github.com
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `business-billing-software` (or your preferred name)
   - **Description**: "Full-stack business billing and management system"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 3: Initialize Git and Push to GitHub

Open your terminal/command prompt in your project root directory and run these commands:

### Initialize Git Repository
```bash
git init
```

### Add All Files
```bash
git add .
```

### Create First Commit
```bash
git commit -m "Initial commit: Business Billing Software"
```

### Add Remote Repository
Replace `YOUR_USERNAME` with your GitHub username and `REPO_NAME` with your repository name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

Example:
```bash
git remote add origin https://github.com/johndoe/business-billing-software.git
```

### Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## Step 4: Verify Upload

1. Go to your GitHub repository URL
2. Refresh the page
3. You should see all your files uploaded

## Common Issues and Solutions

### Issue: "fatal: remote origin already exists"
**Solution:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Issue: Authentication Failed
**Solution:**
You need to use a Personal Access Token instead of password:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select scopes (at least `repo`)
4. Copy the token
5. When pushing, use the token as your password

Or use SSH instead:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

### Issue: Large Files
If you have large files (>100MB), you might need to use Git LFS:
```bash
git lfs install
git lfs track "*.large-file-extension"
git add .gitattributes
git commit -m "Add Git LFS"
git push
```

## Step 5: Update README with Your Repository URL

After pushing, update the README.md file:
1. Replace `<your-repo-url>` with your actual repository URL
2. Commit and push the change:
```bash
git add README.md
git commit -m "Update repository URL in README"
git push
```

## Future Updates

When you make changes to your code:

```bash
# Check status
git status

# Add changed files
git add .

# Or add specific files
git add path/to/file

# Commit with a message
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Useful Git Commands

```bash
# View commit history
git log

# View current status
git status

# View remote repositories
git remote -v

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout branch-name

# Merge branches
git merge branch-name

# Pull latest changes
git pull

# Clone repository
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
```

## .gitignore Important Notes

The `.gitignore` file is already configured to:
- ✅ Ignore `node_modules/` (dependencies)
- ✅ Ignore `.env` files (sensitive data)
- ✅ Ignore uploaded files (photos, documents)
- ✅ Keep upload directories with `.gitkeep` files
- ✅ Ignore build outputs and logs

**IMPORTANT**: Never commit your `.env` file with real credentials!

## Branches Strategy (Optional)

For better organization:

```bash
# Create development branch
git checkout -b development

# Create feature branches
git checkout -b feature/new-feature

# After completing feature
git checkout development
git merge feature/new-feature
git push origin development

# When ready for production
git checkout main
git merge development
git push origin main
```

## GitHub Repository Settings

After pushing, configure your repository:

1. **Add Topics**: billing, business-management, react, nodejs, mongodb
2. **Add Description**: Full-stack business billing and management system
3. **Enable Issues**: For bug tracking
4. **Add License**: Choose MIT or your preferred license
5. **Set up GitHub Pages** (optional): For documentation

## Collaboration

To add collaborators:
1. Go to repository Settings
2. Click "Collaborators"
3. Add collaborators by username or email

## Need Help?

- GitHub Docs: https://docs.github.com
- Git Docs: https://git-scm.com/doc
- GitHub Support: https://support.github.com

---

Good luck with your project! 🚀
