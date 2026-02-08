import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CC</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Career Compass</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Start Your Journey</h1>
          <p className="text-gray-600">Create an account to discover your career path</p>
        </div>
        <SignUp
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          redirectUrl="/dashboard"
        />
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <a href="/sign-in" className="text-blue-600 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
