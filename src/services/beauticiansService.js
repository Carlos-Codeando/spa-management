import { supabase } from '../config/supabaseClient';

const beauticiansService = {
  getPendingCommissions: async (assistantId) => {
    try {
      const { data, error } = await supabase
        .rpc('obtener_comisiones_pendientes', {
          p_asistente_id: assistantId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting pending commissions:', error);
      return null;
    }
  },

  getAllBeauticians: async () => {
    try {
      const { data: beauticians, error } = await supabase
        .from('asistentes')
        .select('*');

      if (error) throw error;

      // Obtener comisiones pendientes para cada esteticista
      const beauticiansWithCommissions = await Promise.all(
        beauticians.map(async (beautician) => {
          const commissions = await beauticiansService.getPendingCommissions(beautician.id);
          return {
            ...beautician,
            comisiones_sesiones: commissions?.comisiones_sesiones || 0,
            comisiones_ventas: commissions?.comisiones_ventas || 0,
            total_comisiones: commissions?.total || 0
          };
        })
      );

      return beauticiansWithCommissions;
    } catch (error) {
      console.error('Error getting beauticians:', error);
      throw error;
    }
  },

  registerPayment: async (paymentData) => {
    const { assistantId, amount, detail } = paymentData;
    
    try {
      // Iniciar una transacción para el pago
      const { data, error } = await supabase
        .from('pagos_asistentes')
        .insert({
          asistente_id: assistantId,
          monto: amount,
          fecha_pago: new Date().toISOString(),
          detalle: detail,
          tipo_comision: 'PAGO'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering payment:', error);
      throw error;
    }
  }
};

export default beauticiansService;