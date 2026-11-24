import { apiOk } from "@/lib/api";
import { clearUserSession } from "@/lib/session";

export async function POST() {
  await clearUserSession();
  return apiOk({ loggedOut: true });
}
