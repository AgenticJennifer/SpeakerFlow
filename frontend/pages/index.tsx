import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Sessionboard</title>
        <meta name="description" content="Session and speaker management dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sessionboard</h1>
          <p className="mt-3 text-slate-600">Submit and manage conference talk proposals.</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Submit a talk
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Admin
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
