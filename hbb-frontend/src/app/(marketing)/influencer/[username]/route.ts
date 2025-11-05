// app/api/influencer/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    
    // Validate username exists
    if (!username || username.trim() === '') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken'); // Changed from authToken
    
    if (!accessToken) {
      const intendedUrl = `/dashboard/explorer/live?modal=influencer&username=${username}`;
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', intendedUrl);
      
      // Redirect to login page
      return NextResponse.redirect(loginUrl, { status: 302 });
    }
    
    // Create redirect URL with query parameters
    const redirectUrl = new URL('/dashboard/explorer/live', request.url);
    redirectUrl.searchParams.set('modal', 'influencer');
    redirectUrl.searchParams.set('username', username);
    
    console.log('API Route - Redirecting to:', redirectUrl.toString());
    
    // Perform redirect
    return NextResponse.redirect(redirectUrl, { status: 302 });
    
  } catch (error) {
    console.error('Error in influencer redirect:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}