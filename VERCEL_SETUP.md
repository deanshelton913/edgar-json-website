# Environment Variables Configuration for Vercel Deployment

## Required Environment Variables

### Google OAuth Configuration
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### JWT Secret (for session encryption)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### Application URLs
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VERCEL_URL=https://your-app.vercel.app
```

### Environment
```
NODE_ENV=production
VERCEL=1
```

## Instructions for Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each of the above variables with your actual values
5. Make sure to set the environment to "Production" for all variables

## Google OAuth Setup

1. Go to Google Cloud Console
2. Create a new OAuth 2.0 Client ID or use existing one
3. Add these authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for development)
4. Copy the Client ID and Client Secret to your environment variables

## Cognito Setup

1. Make sure your Cognito User Pool has Google as an identity provider
2. Update the callback URLs in Cognito to include:
   - `https://your-app.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for development)
