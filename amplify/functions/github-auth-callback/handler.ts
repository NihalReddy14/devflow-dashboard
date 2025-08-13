export const handler = async (event: any) => {
  const { code, state } = event.queryStringParameters || {};

  if (!code) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Missing authorization code' }),
    };
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
        redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback',
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

    // Return success with user data
    const redirectUrl = new URL(process.env.APP_URL || 'http://localhost:3000');
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('username', `github_${githubUser.id}`);
    redirectUrl.searchParams.set('email', email);

    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: '',
    };
  } catch (error) {
    console.error('GitHub auth error:', error);
    
    const errorUrl = new URL(process.env.APP_URL || 'http://localhost:3000');
    errorUrl.pathname = '/';
    errorUrl.searchParams.set('error', 'auth_failed');

    return {
      statusCode: 302,
      headers: {
        'Location': errorUrl.toString(),
      },
      body: '',
    };
  }
};