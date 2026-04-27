import { useState, useEffect, useCallback } from 'react';
import api from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Home } from '@/lib/types';
import { toast } from 'sonner';

export function useHomes() {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);


const fetchHomes = useCallback(async () => {
  setLoading(true);
  try {
    const data = await api.get('/api/homes');
    const mapped = (Array.isArray(data) ? data : []).map((h: any) => ({
       id: String(h.id),
       name: h.name,
        address: h.address || undefined,
        color: h.color,
        icon: h.icon,
      }));
      setHomes(mapped);

      setSelectedHomeId(prev => {
      if (prev !== null) return prev; // Ya hay uno, no lo toques
      if (mapped.length > 0) return Number(mapped[0].id);
      return null;
    });

    } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }

}, [user]);

  useEffect(() => { fetchHomes(); }, [fetchHomes]);

  const selectHome = useCallback((id: string | null) => {
    setSelectedHomeId(id ? Number(id) : null);
    if (user && id) localStorage.setItem(`selected-home-${user.id}`, id);
  }, [user]);

  //crea un nuevo hogar y lo selecciona
  const addHome = async (home: Omit<Home, 'id'>) => {
    try {
      const data = await api.post('/api/homes', { name: home.name, address: home.address, color: home.color, icon: home.icon });
      await fetchHomes();
      setSelectedHomeId(Number(data.id));
      if (user) localStorage.setItem(`selected-home-${user.id}`, String(data.id));
    } catch (err) {
      console.error(err);
    }
  };

  //actualiza un hogar
  const updateHome = async (id: string, updates: Partial<Omit<Home, 'id'>>) => {
    try {
      await api.put(`/api/homes/${id}`, { name: updates.name, address: updates.address, color: updates.color, icon: updates.icon });
      fetchHomes();
    } catch (err) {
      console.error(err);
    }
  };

 //elimina un hogar
const deleteHome = async (id: number) => {
  try {
    
    await api.delete(`/api/homes/${id}`);

    
    if (selectedHomeId === id) {
      const remaining = homes.filter(h => Number(h.id) !== id);
      
      setSelectedHomeId(remaining.length > 0 ? Number(remaining[0].id) : null);
    }
    
    fetchHomes();
    toast.success("Hogar eliminado correctamente");
  } catch (err) {
    console.error("Error al eliminar:", err);
    toast.error("No se pudo eliminar el hogar");
  }
};

  return { homes, selectedHomeId, selectHome, addHome, updateHome, deleteHome, loading };
}
