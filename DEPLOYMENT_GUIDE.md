# Vercel Deployment Guide

## Quick Setup Steps

### 1. Environment Variables Setup

Add these environment variables to your Vercel project:

#### AWS Configuration
- `AWS_REGION`: `us-west-2`
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

#### Cognito Configuration
- `COGNITO_USER_POOL_ID`: Your Cognito User Pool ID
- `COGNITO_CLIENT_ID`: `q7s3g7snt1fquvl3tgt98tb34`
- `COGNITO_DOMAIN`: `https://edgar-json-auth.auth.us-west-2.amazoncognito.com`

#### Public Cognito Configuration (for client-side)
- `NEXT_PUBLIC_COGNITO_DOMAIN`: `https://edgar-json-auth.auth.us-west-2.amazoncognito.com`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`: `q7s3g7snt1fquvl3tgt98tb34`

#### Database Configuration
- `SUPABASE_DATABASE_URL`: Your Supabase PostgreSQL connection string
- OR `DATABASE_URL`: Your PostgreSQL connection string

#### Application URLs
- `NEXT_PUBLIC_VERCEL_URL`: Will be automatically set by Vercel
- `NODE_ENV`: `production`
- `VERCEL`: `1` (automatically set by Vercel)

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create or edit your OAuth 2.0 Client ID
4. Add these authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for development)

### 3. Cognito Setup

1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to App integration > App client settings
4. Add these callback URLs:
   - `https://your-app.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for development)

### 4. Testing Your Deployment

After deployment, test these endpoints:

1. **Configuration Check**: `https://your-app.vercel.app/api/config-check`
   - Verifies all environment variables are set correctly

2. **Database Test**: `https://your-app.vercel.app/api/test-db`
   - Tests database connectivity

3. **Google Login**: Click the "Sign in with Google" button
   - Should redirect to Google OAuth and back to your app

### 5. Troubleshooting

#### Common Issues:

1. **"Invalid redirect URI" error**:
   - Make sure the callback URL in Google OAuth and Cognito matches your Vercel URL exactly
   - Check that `NEXT_PUBLIC_VERCEL_URL` is set correctly

2. **Database connection errors**:
   - Verify your `SUPABASE_DATABASE_URL` or `DATABASE_URL` is correct
   - Make sure your database allows connections from Vercel's IP ranges

3. **AWS credential errors**:
   - Verify your AWS credentials have the necessary permissions
   - Check that `AWS_REGION` matches your DynamoDB tables region

4. **Cognito token exchange errors**:
   - Make sure `COGNITO_CLIENT_ID` matches your Cognito app client
   - Verify the redirect URI in Cognito matches your Vercel URL

### 6. Development vs Production

The app automatically detects the environment:
- **Development**: Uses `localhost:3000` for callbacks
- **Production**: Uses your Vercel URL for callbacks

### 7. Security Notes

- Never commit environment variables to your repository
- Use Vercel's environment variable system for sensitive data
- The app uses secure HTTP-only cookies for authentication tokens
- All API routes are protected and require authentication

## Next Steps

1. Deploy to Vercel
2. Set all environment variables
3. Update Google OAuth and Cognito callback URLs
4. Test the configuration endpoints
5. Test Google login functionality
6. Verify API key generation works
7. Test SEC filing parsing functionality
