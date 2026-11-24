import { apiOk } from "@/lib/api";
import { clearAdminSession } from "@/lib/session";

export async function POST() {
  await clearAdminSession();
  return apiOk({ loggedOut: true });
}
