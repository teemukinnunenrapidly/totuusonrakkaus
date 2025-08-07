"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Zod schema validointiin
const loginSchema = z.object({
  email: z.string().min(1, "Sähköposti on pakollinen").email("Syötä kelvollinen sähköpostiosoite"),
  password: z.string().min(1, "Salasana on pakollinen"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function KirjauduPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  // React Hook Form konfiguraatio
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleToggleVisibility = () => setIsVisible(!isVisible);

  // Google OAuth kirjautuminen
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/my-courses`
        }
      });

      if (error) {
        setMessage({
          type: "error",
          text: "Google-kirjautuminen epäonnistui. Yritä uudelleen.",
        });
        setIsGoogleLoading(false);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Google-kirjautumisessa tapahtui virhe. Yritä uudelleen.",
      });
      setIsGoogleLoading(false);
    }
  };

  // Pääasiallinen kirjautumisfunktio
  const handleSubmitForm = async (data: LoginFormData) => {
    console.log("=== FUNKTIO ALKAA ===");
    setIsLoading(true);
    setMessage(null);

    try {
      console.log("=== KIRJAUTUMISEN ALKAA ===");
      console.log("Email:", data.email);
      console.log("Password length:", data.password.length);
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "LÖYTYI" : "PUUTTUU");
      
      console.log("Yritetään kirjautua sisään...");
      
      // Supabase auth kutsu timeoutilla
      const authPromise = supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      
      console.log("Odotetaan Supabase-vastausta...");
      const { data: authData, error } = await Promise.race([authPromise, timeoutPromise]) as any;

      console.log("Supabase vastaus:", { authData, error });

      if (error) {
        console.error("Kirjautumisvirhe:", error);
        console.error("Virhe koodi:", error.code);
        console.error("Virhe viesti:", error.message);
        
        // Error handling eri virhetyypeille
        let errorMessage = "Kirjautumisvirhe. Yritä uudelleen.";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Väärä sähköposti tai salasana. Tarkista tiedot ja yritä uudelleen.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Sähköpostiosoite ei ole vahvistettu. Tarkista sähköpostisi.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Liian monta kirjautumisyritystä. Odota hetki ja yritä uudelleen.";
        } else {
          errorMessage = `Kirjautumisvirhe: ${error.message}`;
        }
        
        setMessage({
          type: "error",
          text: errorMessage,
        });
        setIsLoading(false);
        return;
      }

      console.log("Kirjautuminen onnistui:", authData);
      console.log("Käyttäjä ID:", authData.user?.id);
      console.log("Käyttäjä email:", authData.user?.email);
      
      // Pysäytä loading heti
      setIsLoading(false);
      
      setMessage({
        type: "success",
        text: "Kirjautuminen onnistui! Ohjataan kurssisivulle...",
      });
      
      // Ohjaa kurssisivulle välittömästi
      console.log("Ohjataan /my-courses sivulle...");
      router.push("/my-courses");
      
    } catch (error) {
      console.error("Kirjautumisessa tapahtui virhe:", error);
      
      // Exception handling
      let errorMessage = "Kirjautumisessa tapahtui virhe. Yritä uudelleen.";
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Kirjautuminen kesti liian kauan. Tarkista internet-yhteys ja yritä uudelleen.";
        } else {
          errorMessage = `Virhe: ${error.message}`;
        }
      }
      
      setMessage({
        type: "error",
        text: errorMessage,
      });
      setIsLoading(false);
    }
  };

  return (
    <div data-page="login" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Kirjaudu sisään
            </h1>
            <p className="text-gray-600">
              Kirjaudu sisään jatkaaksesi oppimista
            </p>
          </div>

          {/* Google Login Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Kirjaudu sisään Google-tilillä"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isGoogleLoading ? "Kirjaudutaan..." : "Jatka Googlella"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">tai</span>
            </div>
          </div>

          {/* Form - React Hook Form kytketty onSubmit-tapahtumaan */}
          <form 
            onSubmit={(e) => {
              console.log("=== FORM SUBMIT TAPAHTUI ===");
              handleSubmit(handleSubmitForm)(e);
            }} 
            className="space-y-6"
          >
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

            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Salasana
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("password")}
                  id="password"
                  type={isVisible ? "text" : "password"}
                  placeholder="Syötä salasanasi"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  aria-label="Salasana"
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

            {/* Message - Error/Success viestit */}
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
              aria-label="Kirjaudu sisään"
            >
              {isLoading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center">
            <Link 
              href="/reset-password" 
              className="text-sm text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
              aria-label="Unohditko salasanasi? Siirry salasanan palautussivulle"
            >
              Unohditko salasanasi?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 