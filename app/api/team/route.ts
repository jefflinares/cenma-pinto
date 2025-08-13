import { getTeamForUser } from '@/lib/db/queries/user';

export async function GET() {
  const team = await getTeamForUser();
  return Response.json(team);
}
