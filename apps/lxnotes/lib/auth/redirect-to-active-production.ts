import { redirect } from 'next/navigation'
import { getCurrentUser, getUserProductions } from './index'

/**
 * Server-side guard for productionless dashboard routes (e.g. /cue-notes).
 *
 * Without a production_id in the URL, the dashboard pages fall through to mock
 * data. That made fake notes appear under a real user's persisted production
 * header (bug reported 2026-05-03). This guard sends the user to the right
 * scoped URL or back to the picker.
 */
export async function redirectToActiveProduction(subPath: string): Promise<never> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const productions = await getUserProductions(user.id)
  if (productions.length === 1) {
    redirect(`/production/${productions[0].id}/${subPath}`)
  }

  redirect('/')
}
