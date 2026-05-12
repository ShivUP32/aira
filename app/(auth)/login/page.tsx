import { LoginScreen } from "@/components/aira/AuthScreens";
import { allowLocalTestLogin } from "@/lib/aira/env";
import { headers } from "next/headers";

export default async function Page() {
  const headerStore = await headers();
  return <LoginScreen showTestLogin={allowLocalTestLogin(headerStore.get("host"))} />;
}
