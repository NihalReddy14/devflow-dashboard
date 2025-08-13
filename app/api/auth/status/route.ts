import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('github_user');
  const tokenCookie = cookieStore.get('github_token');

  if (userCookie && tokenCookie) {
    try {
      const user = JSON.parse(userCookie.value);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          username: user.login,
          email: user.email,
          avatar_url: user.avatar_url,
        }
      });
    } catch (error) {
      console.error('Error parsing user cookie:', error);
    }
  }

  return NextResponse.json({
    authenticated: false,
    user: null
  });
}