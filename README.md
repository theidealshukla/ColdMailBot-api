# Backend Deployment Guide

## 🚀 Manual Deployment Options

### 1. **Render.com** (Recommended - Free Tier)

1. **Create Account**: Go to [render.com](https://render.com) and sign up
2. **Connect GitHub**: Connect your GitHub account
3. **Create Web Service**: 
   - Choose "Web Service"
   - Connect your repository
   - Set **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. **Deploy**: Click "Create Web Service"
5. **Get URL**: Copy your deployed URL (e.g., `https://your-app-name.onrender.com`)

### 2. **Railway** (Free Tier Available)

1. **Create Account**: Go to [railway.app](https://railway.app)
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose your repo
4. **Configure**:
   - Railway will auto-detect Python
   - Set **Root Directory**: `backend`
   - **Start Command**: `gunicorn app:app`
5. **Deploy**: Railway will automatically deploy
6. **Get URL**: Copy your railway URL

## 🔧 Environment Variables

Set these in your deployment platform:

| Variable | Value | Required |
|----------|-------|----------|
| `FLASK_ENV` | `production` | ✅ |
| `PORT` | `5000` | Auto-set by most platforms |
| `ALLOWED_ORIGINS` | Your frontend URLs | Optional |

## 🌐 Update Frontend

After deployment, update your frontend's API configuration:

### In `src/js/api-config.js`:

```javascript
const APIConfig = {
    // Replace with your deployed backend URL
    BASE_URL: 'https://your-backend-url.onrender.com',
    
    // Rest of the configuration...
};
```

### URLs to use:
- **Render**: `https://your-app-name.onrender.com`
- **Railway**: `https://your-app-name.up.railway.app`
- **Vercel**: `https://your-app-name.vercel.app`

## ✅ Test Deployment

1. Visit `https://your-backend-url/health`
2. Should return: `{"status": "healthy", "service": "Internship Email Automation API"}`
3. Update frontend and test the complete flow

## 🔒 Security Notes

- Never commit `.env` files with real credentials
- Use environment variables for sensitive data
- The backend accepts CORS from GitHub Pages and major hosting platforms
- Gmail App Passwords are processed but not stored

## 💡 Tips

- **Render**: Takes ~2 minutes to deploy, auto-sleeps after 15min inactivity (free tier)
- **Railway**: Faster deployment, $5/month after free credits
- Both platforms support automatic deployments from GitHub