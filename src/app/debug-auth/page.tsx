import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DebugPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div style={{ padding: "40px", fontFamily: "monospace" }}>
      <h1>Auth Debug Info</h1>
      <h2>Clerk User Data:</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h2>Public Metadata:</h2>
      <pre>{JSON.stringify(user.publicMetadata, null, 2)}</pre>

      <h2>Private Metadata:</h2>
      <pre>{JSON.stringify(user.privateMetadata, null, 2)}</pre>

      <h2>Unsafe Metadata:</h2>
      <pre>{JSON.stringify(user.unsafeMetadata, null, 2)}</pre>
    </div>
  );
}
