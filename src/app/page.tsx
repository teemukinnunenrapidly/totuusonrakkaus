"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("Etusivu latautuu...");
    
    // Väliaikaisesti ohjaa suoraan login-sivulle
    setTimeout(() => {
      console.log("Ohjataan login-sivulle...");
      router.push('/login');
    }, 1000);
    
  }, [router]);

  // Näytä loading-tila
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan sivustoa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Totuusonrakkaus</h1>
        <p className="text-gray-600">Ladataan...</p>
      </div>
    </div>
  );
}
