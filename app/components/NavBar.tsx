'use client';
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="p-4">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Your App
        </Link>
        
        <div>
          <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
} 