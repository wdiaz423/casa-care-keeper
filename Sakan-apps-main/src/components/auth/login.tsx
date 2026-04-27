import { api } from "@/api/client";

export const SocialLogin = () => {
  
  const handleGoogleLogin = async () => {
    try {
    
      console.log("Iniciando sesión con Google...");
      
      // Ejemplo: Redirigir a tu backend para iniciar el flujo
      window.location.href = "http://localhost:4000/api/auth/google";
      
    } catch (error) {
      alert("Error al conectar con Google");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <button 
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2 border p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <img src="https://authjs.dev/img/providers/google.svg" width="20" alt="Google" />
        <span>Continuar con Google</span>
      </button>

      <button 
        className="flex items-center justify-center gap-2 border p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <img src="https://authjs.dev/img/providers/apple.svg" width="20" alt="Apple" />
        <span>Continuar con Apple</span>
      </button>
    </div>
  );
};