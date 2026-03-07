import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white text-foreground overflow-hidden font-sans">
      {/* Subtle Doodles / Pattern background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e52f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 sm:p-24">
        {/* Header Section */}
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Welcome to the new platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
            Building the structured <span className="text-primary">Frontend</span> with Style
          </h1>

          <p className="max-w-2xl mx-auto text-lg leading-8 text-gray-600">
            A minimalistic, modular Next.js architecture separated into clean UI components, screens, and services. The foundation is set.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-full bg-primary px-8 text-white font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
            >
              Get Started Phase 2
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full bg-white border border-gray-200 px-8 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Example Grid for structure illustration */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl text-left">
          {['ui', 'components', 'screens'].map((folder) => (
            <div key={folder} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{folder} folder</h3>
              <p className="text-gray-500 text-sm">
                Dedicated modular directory for robust separation of concerns and pure presentation logic.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
