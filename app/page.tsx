export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100">
        <span className="text-2xl font-extrabold text-green-500">Pico</span>
        <div className="flex gap-4">
          <a href="/login" className="text-gray-500 font-bold hover:text-gray-800 px-4 py-2">
            Log in
          </a>
          <a
            href="/signup"
            className="bg-green-500 text-white font-bold px-6 py-2 rounded-2xl hover:bg-green-600 transition"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-6xl font-extrabold text-gray-900 mb-6 max-w-2xl leading-tight">
          Learn to code.<br />One lesson at a time.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-lg">
          Pico teaches you Python through short, interactive lessons. No experience needed. No fluff.
        </p>
        <a
          href="/learn"
          className="bg-green-500 text-white text-xl font-extrabold px-10 py-4 rounded-2xl hover:bg-green-600 transition shadow-lg"
        >
          Start Learning
        </a>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-8 py-20">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
            <div className="text-4xl mb-4 font-extrabold text-green-500">01</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Bite-sized lessons</h3>
            <p className="text-gray-500">Each lesson takes 2-3 minutes. Perfect for learning on the go.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
            <div className="text-4xl mb-4 font-extrabold text-green-500">02</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Never the same twice</h3>
            <p className="text-gray-500">Every question is fresh and unique. You will always be challenged.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
            <div className="text-4xl mb-4 font-extrabold text-green-500">03</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Track progress</h3>
            <p className="text-gray-500">Earn XP, maintain streaks, and unlock new units as you improve.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm font-semibold">
        Pico — Learn to code, one lesson at a time.
      </footer>
    </main>
  );
}
