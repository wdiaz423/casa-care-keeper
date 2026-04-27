import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Registro del error en consola para debugging
    console.error(
      "404 Error: Ruta no encontrada:", 
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      {/* Fondo decorativo sutil (opcional, para mantener tu estilo) */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
      >
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle size={48} />
        </div>

        <h1 className="mb-2 text-6xl font-bold tracking-tighter text-foreground">
          404
        </h1>
        
        <h2 className="mb-4 text-2xl font-semibold">
          Página no encontrada
        </h2>
        
        <p className="mb-8 max-w-md text-muted-foreground">
          Lo sentimos, no pudimos encontrar la página que buscas. 
          Es posible que la dirección esté mal escrita o que la página haya sido movida.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2 px-8">
            <Link to="/">
              <Home size={18} />
              Volver al Inicio
            </Link>
          </Button>
          
          <Button variant="ghost" onClick={() => window.history.back()}>
            Regresar atrás
          </Button>
        </div>
      </motion.div>

      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        Intentaste acceder a: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{location.pathname}</code>
      </footer>
    </div>
  );
};

export default NotFound;
