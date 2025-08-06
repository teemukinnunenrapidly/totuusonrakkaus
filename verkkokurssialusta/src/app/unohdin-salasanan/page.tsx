"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const resetSchema = z.object({
  email: z.string().min(1, "Sähköposti on pakollinen").email("Syötä kelvollinen sähköpostiosoite"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function UnohdinSalasananPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const handleResetPassword = async (data: ResetFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.error || "Salasanan palautuslinkin lähetys epäonnistui. Yritä uudelleen.",
        });
        return;
      }

      setIsSuccess(true);
      setMessage({
        type: "success",
        text: result.message || "Salasanan palautuslinkki on lähetetty sähköpostiisi!",
      });
      reset();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Virhe salasanan palautuslinkin lähettämisessä. Yritä uudelleen.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-page="reset-password" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unohditko salasanasi?
            </h1>
            <p className="text-gray-600">
              Syötä sähköpostiosoitteesi ja lähetämme sinulle linkin salasanan palauttamiseen
            </p>
          </div>

          {!isSuccess ? (
            /* Reset Form */
            <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-6">
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Sähköposti
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="syota@sahkoposti.fi"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    aria-label="Sähköpostiosoite"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
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
                aria-label="Lähetä salasanan palautuslinkki"
              >
                {isLoading ? "Lähetetään..." : "Lähetä palautuslinkki"}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Linkki lähetetty!
                </h3>
                <p className="text-gray-600 mb-6">
                  Tarkista sähköpostisi ja klikkaa linkkiä salasanan palauttamiseksi.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Huomioitavaa:</p>
                      <ul className="space-y-1 text-left">
                        <li>• Tarkista myös roskapostikansio</li>
                        <li>• Linkki on voimassa 1 tunti</li>
                        <li>• Jos et saa viestiä, yritä uudelleen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-8 text-center">
            <Link 
              href="/kirjaudu"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
              aria-label="Takaisin kirjautumissivulle"
            >
              <ArrowLeft className="h-4 w-4" />
              Takaisin kirjautumiseen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 