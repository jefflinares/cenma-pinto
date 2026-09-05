import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries/user';

export default async function RootPage() {
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
}
