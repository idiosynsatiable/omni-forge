export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth/unified-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const result = await login(email, password);
    if (!result.authenticated) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    const response = NextResponse.json({
      user: result.user,
      token: result.token,
    });
    response.cookies.set('omni_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
