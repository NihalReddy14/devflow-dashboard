import { NextResponse } from 'next/server';

export async function GET() {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/github/callback`;
  
  if (!githubClientId) {
    return NextResponse.json({ error: 'GitHub client ID not configured' }, { status: 500 });
  }

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', githubClientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email repo read:org');
  githubAuthUrl.searchParams.set('state', Math.random().toString(36).substring(7));

  return NextResponse.redirect(githubAuthUrl.toString());
}