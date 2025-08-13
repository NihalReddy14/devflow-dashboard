import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  
  githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
  githubAuthUrl.searchParams.set('redirect_uri', process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback');
  githubAuthUrl.searchParams.set('scope', 'read:user user:email repo read:org');
  githubAuthUrl.searchParams.set('state', Math.random().toString(36).substring(7));

  return {
    statusCode: 302,
    headers: {
      'Location': githubAuthUrl.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    body: '',
  };
};