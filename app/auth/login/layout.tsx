export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </a>
        </p>
      </div>
      {children}
    </div>
  );
} 