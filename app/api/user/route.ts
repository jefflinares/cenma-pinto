import { getUser } from '@/lib/db/queries/user';

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
