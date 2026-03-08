import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { searchCommunities } from "@/lib/data/queries";

export default async function SignUpPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect("/");
  }

  const communities = await searchCommunities("");
  return <AuthForm mode="sign-up" communities={communities} />;
}
