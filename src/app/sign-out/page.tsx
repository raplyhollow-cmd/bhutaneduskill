import { SignedOut } from "@clerk/nextjs";

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SignedOut />
    </div>
  );
}
