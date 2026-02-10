import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {children}
    </div>
  );
}
