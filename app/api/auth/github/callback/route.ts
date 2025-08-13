import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { signIn } from 'aws-amplify/auth';
import outputs from '@/amplify_outputs.json';

// Configure Amplify on the server side
Amplify.configure(outputs, { ssr: true });

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get access token');
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      email = primaryEmail?.email;
    }

    if (!email) {
      throw new Error('Could not retrieve email from GitHub');
    }

    // Create a unique username for Cognito from GitHub ID
    const cognitoUsername = `github_${githubUser.id}`;
    
    // For now, we'll just store the user info and handle Cognito creation later
    // The user can still use the app with GitHub auth cookies

    const response = NextResponse.redirect(new URL('/dashboard?auth=success', request.url));
    
    // Store GitHub info in cookies temporarily
    response.cookies.set('github_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set('github_user', JSON.stringify({
      id: githubUser.id,
      login: githubUser.login,
      email: email,
      name: githubUser.name,
      avatar_url: githubUser.avatar_url,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('GitHub auth error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}