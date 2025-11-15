import Link from 'next/link';
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center space-y-5">
        <p href="/register-login" className="text-6xl font-bold">
          Candy-Chat
        </p>
        <Link
          href="/register-login"
          className="text-2xl font-semibold mb-4 hover:underline"
        >
          Go To Login
        </Link>
        <Link
          href="/home"
          className="text-2xl font-semibold mb-4 hover:underline"
        >
          Go To Home
        </Link>
      </div>
    </div>
  );
}
