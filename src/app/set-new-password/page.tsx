"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Salasanan tulee olla vähintään 8 merkkiä pitkä")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Salasanan tulee sisältää vähintään yksi pieni kirjain, yksi iso kirjain ja yksi numero"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Salasanat eivät täsmää",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function SetNewPasswordContent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tarkista token query-parametrista tai hash-osasta
  let token = searchParams.get('token');
  let type = searchParams.get('type');
  
  // Jos tokenia ei löydy query-parametrista, tarkista hash-osa
  if (!token && typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // Poista # merkki
      token = params.get('access_token');
      type = params.get('type') || 'recovery';
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Tarkista token kun sivu ladataan
  useEffect(() => {
    const validateToken = async () => {
      if (!token || type !== 'recovery') {
        setIsValidToken(false);
        setMessage({
          type: "error",
          text: "Virheellinen tai puuttuva palautuslinkki.",
        });
        return;
      }

      try {
        // Tässä vaiheessa emme tee mitään erikoista token-validaatiota
        // Supabase hoitaa sen automaattisesti resetPassword-kutsussa
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
        setMessage({
          type: "error",
          text: "Virheellinen palautuslinkki.",
        });
      }
    };

    validateToken();
  }, [token, type]);

  const handleToggleVisibility = () => setIsVisible(!isVisible);
  const handleToggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!token) {
      setMessage({
        type: "error",
        text: "Virheellinen palautuslinkki.",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Käytetään API endpointia salasanan vaihtoon
      const response = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token,
          password: data.password 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.error || "Salasanan vaihto epäonnistui. Yritä uudelleen.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Salasanasi on vaihdettu onnistuneesti! Ohjataan kirjautumissivulle...",
      });
      
      reset();
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: "error",
        text: "Virhe salasanan vaihdossa. Yritä uudelleen.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Tarkistetaan linkkiä...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Virheellinen linkki
              </h1>
              <p className="text-gray-600 mb-6">
                Palautuslinkki on virheellinen tai vanhentunut.
              </p>
            </div>
            
            <div className="text-center">
              <Link 
                href="/reset-password" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Pyydä uusi palautuslinkki
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aseta uusi salasana
            </h1>
            <p className="text-gray-600">
              Syötä uusi salasanasi alle
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Uusi salasana
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("password")}
                  id="password"
                  type={isVisible ? "text" : "password"}
                  placeholder="Syötä uusi salasanasi"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  aria-label="Uusi salasana"
                />
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
                  aria-label={isVisible ? "Piilota salasana" : "Näytä salasana"}
                >
                  {isVisible ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700"
              >
                Vahvista uusi salasana
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type={isConfirmVisible ? "text" : "password"}
                  placeholder="Syötä uusi salasanasi uudelleen"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  aria-label="Vahvista uusi salasana"
                />
                <button
                  type="button"
                  onClick={handleToggleConfirmVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
                  aria-label={isConfirmVisible ? "Piilota salasana" : "Näytä salasana"}
                >
                  {isConfirmVisible ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
                role="alert"
                aria-live="polite"
              >
                {message.text}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Aseta uusi salasana"
            >
              {isLoading ? "Asetetaan salasana..." : "Aseta uusi salasana"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center">
            <Link 
              href="/login" 
              className="text-sm text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
              aria-label="Palaa kirjautumissivulle"
            >
              ← Takaisin kirjautumiseen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AsetaUusiSalasanaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan...</p>
        </div>
      </div>
    }>
      <SetNewPasswordContent />
    </Suspense>
  );
} 