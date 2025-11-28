import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Medical Portal</h1>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-800 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-slate-700 text-white hover:bg-slate-600 border-slate-600",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              formFieldInput: "bg-slate-700 border-slate-600 text-white",
              formFieldLabel: "text-slate-300",
              footerActionLink: "text-blue-400 hover:text-blue-300",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-blue-400",
              formFieldInputShowPasswordButton: "text-slate-400",
              dividerLine: "bg-slate-600",
              dividerText: "text-slate-400",
              otpCodeFieldInput: "bg-slate-700 border-slate-600 text-white",
              formResendCodeLink: "text-blue-400 hover:text-blue-300",
              alertText: "text-white",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}

