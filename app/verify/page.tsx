export default function Verify() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm p-10 max-w-md w-full text-center">
        <a href="/" className="text-2xl font-extrabold text-green-500 block mb-8">Pico</a>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-500 font-semibold mb-6">
          We sent a verification link to your email. Click it to activate your account and start learning.
        </p>
        <a href="/login" className="text-green-500 font-extrabold hover:underline text-sm">
          Back to login
        </a>
      </div>
    </main>
  );
}