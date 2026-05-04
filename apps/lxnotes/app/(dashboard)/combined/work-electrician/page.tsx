import { redirectToActiveProduction } from '@/lib/auth/redirect-to-active-production'

export default async function Page() {
  await redirectToActiveProduction('combined/work-electrician')
}
