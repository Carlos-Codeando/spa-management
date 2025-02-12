// treatmentsService.js
import { supabase } from '../config/supabaseClient';

class TreatmentsService {
  async fetchTreatments() {
    try {
      const { data, error } = await supabase
        .from('tratamientos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching treatments:', error);
      return { data: null, error };
    }
  }

  async addTreatment(treatmentData) {
    try {
      const { data, error } = await supabase
        .from('tratamientos')
        .insert({
          nombre: treatmentData.nombre,
          costo: treatmentData.es_promocion ? 0 : parseFloat(treatmentData.costo),
          es_promocion: treatmentData.es_promocion
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error adding treatment:', error);
      return { data: null, error };
    }
  }

  async updateTreatment(id, treatmentData) {
    try {
      const { data, error } = await supabase
        .from('tratamientos')
        .update({
          nombre: treatmentData.nombre,
          costo: parseFloat(treatmentData.costo),
          es_promocion: treatmentData.es_promocion
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating treatment:', error);
      return { data: null, error };
    }
  }

  async deleteTreatment(id) {
    try {
      const { error } = await supabase
        .from('tratamientos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting treatment:', error);
      return { error };
    }
  }

  async addPromotion(promotionData) {
    try {
      // Start a transaction by adding the main promotion
      const { data: promotion, error: promotionError } = await supabase
        .from('tratamientos')
        .insert({
          nombre: promotionData.nombre,
          costo: promotionData.total,
          es_promocion: true
        })
        .select()
        .single();

      if (promotionError) throw promotionError;

      // Add promotion components
      const componentsPromises = promotionData.componentes.map(componente => 
        supabase
          .from('promocion_detalles')
          .insert({
            promocion_id: promotion.id,
            nombre_componente: componente.nombre,
            cantidad_sesiones: parseInt(componente.sesiones),
            precio_componente: parseFloat(componente.precio)
          })
      );

      await Promise.all(componentsPromises);

      return { data: promotion, error: null };
    } catch (error) {
      console.error('Error adding promotion:', error);
      return { data: null, error };
    }
  }

  async getPromotionDetails(promotionId) {
    try {
      const { data, error } = await supabase
        .from('promocion_detalles')
        .select('*')
        .eq('promocion_id', promotionId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching promotion details:', error);
      return { data: null, error };
    }
  }

  calculatePromotionTotal(components) {
    return components.reduce((total, comp) => {
      const precio = parseFloat(comp.precio) || 0;
      const sesiones = parseInt(comp.sesiones) || 0;
      return total + (precio * sesiones);
    }, 0);
  }
}

export default new TreatmentsService();