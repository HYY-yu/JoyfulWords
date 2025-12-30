'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOut() {
  const cookieStore = await cookies()

  // Clear refresh token cookie
  cookieStore.delete('refresh_token')

  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
