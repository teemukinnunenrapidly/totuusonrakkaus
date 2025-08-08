"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sanitizeEmail, validatePasswordStrength } from "@/lib/sanitization";

// Parannettu Zod-skeema tietoturvaominaisuuksilla
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Sähköposti on pakollinen")
    .email("Syötä kelvollinen sähköpostiosoite")
    .max(255, "Sähköposti on liian pitkä")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "Salasana on pakollinen")
    .max(128, "Salasana on liian pitkä")
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
    console.log("=== FORM SUBMIT TAPAHTUI ===");
    setIsLoading(true);
    setMessage(null);

    try {
      console.log("=== KIRJAUTUMISEN ALKAA ===");
      console.log("Email:", data.email);
      console.log("Password length:", data.password.length);
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "LÖYTYI" : "PUUTTUU");
      
      // Input sanitization
      const sanitizedEmail = sanitizeEmail(data.email);
      if (!sanitizedEmail) {
        setMessage({
          type: "error",
          text: "Virheellinen sähköpostiosoite",
        });
        setIsLoading(false);
        return;
      }

      // Salasanan vahvuuden tarkistus (ei estä kirjautumista, mutta varoittaa)
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        console.warn("Salasanan vahvuus:", passwordValidation.errors);
        // Ei estetä kirjautumista, mutta voidaan näyttää varoitus
      }
      
      console.log("Yritetään kirjautua sisään...");
      
      // Supabase auth kutsu ilman timeoutia
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: data.password,
      });

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
        } else if (error.message.includes("timeout")) {
          errorMessage = "Kirjautuminen kesti liian kauan. Tarkista internet-yhteys ja yritä uudelleen.";
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
      console.error("Odottamaton virhe kirjautumisessa:", error);
      setMessage({
        type: "error",
        text: "Odottamaton virhe tapahtui. Yritä uudelleen.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Kirjaudu sisään
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Kirjaudu sisään jatkaaksesi oppimista
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleSubmitForm)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Sähköposti
              </label>
              <input
                {...register("email")}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Sähköposti"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Salasana
              </label>
              <input
                {...register("password")}
                id="password"
                name="password"
                type={isVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Salasana"
              />
              <button
                type="button"
                onClick={handleToggleVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className={`h-5 w-5 text-gray-400 ${isVisible ? "block" : "hidden"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  className={`h-5 w-5 text-gray-400 ${isVisible ? "hidden" : "block"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Kirjautumassa...
                </div>
              ) : (
                "Kirjaudu sisään"
              )}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/reset-password"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Unohditko salasanasi?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
} 