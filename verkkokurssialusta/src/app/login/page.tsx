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
      const { data: authData, error } = await Promise.race([authPromise, timeoutPromise]) as { data: { user: { id: string; email?: string } }; error: { message: string; code?: string } | null };

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