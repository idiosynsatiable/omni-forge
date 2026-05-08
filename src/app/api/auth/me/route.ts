export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/unified-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  return NextResponse.json({ user: auth.user });
}
