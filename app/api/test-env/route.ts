import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    adminEmail: process.env.ADMIN_EMAIL,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  })
}