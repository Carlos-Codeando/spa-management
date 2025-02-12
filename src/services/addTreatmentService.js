// services/addTreatmentService.js
import { supabase } from '../config/supabaseClient';

export class TreatmentService {
  async assignTreatment(treatmentData) {
    const {
      patientId,
      treatmentId,
      assistantId,
      sellerId,
      assistantPercentage,
      sellerPercentage,
      sessionsAssigned,
      sessionsPaid,
      totalCost,
      totalPaid,
      firstSessionDate,
      isPromotion,
      components = [] // Para promociones
    } = treatmentData;

    try {
      // Calcular saldos y comisiones
      const pendingBalance = totalCost - totalPaid;
      const sellerCommission = sellerId ? (totalCost * sellerPercentage) / 100 : 0;
      const assistantCommission = (totalPaid * assistantPercentage) / 100;

      // Insertar el tratamiento asignado
      const { data: assignedTreatment, error: assignmentError } = await supabase
        .from('tratamientos_asignados')
        .insert([{
          paciente_id: patientId,
          tratamiento_id: treatmentId,
          asistente_id: assistantId,
          vendedor_id: sellerId,
          porcentaje_asistente: assistantPercentage,
          porcentaje_vendedor: sellerPercentage,
          sesiones_asignadas: sessionsAssigned,
          sesiones_pagadas: sessionsPaid,
          sesiones_restantes: sessionsAssigned,
          costo_total: totalCost,
          total_pagado: totalPaid,
          saldo_pendiente: pendingBalance,
          comision_vendedor: sellerCommission,
          comision_asistente: assistantCommission,
          fecha_asignacion: new Date().toISOString(),
          fecha_primera_sesion: firstSessionDate,
          estado: 'ACTIVO',
          es_promocion: isPromotion
        }])
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Crear la primera sesión para tratamiento normal
      if (!isPromotion) {
        const { error: sessionError } = await supabase
          .from('sesiones_realizadas')
          .insert([{
            tratamiento_asignado_id: assignedTreatment.id,
            fecha_sesion: firstSessionDate,
            numero_sesion: 1,
            asistente_id: assistantId,
            estado_sesion: 'PENDIENTE',
            estado_pago: sessionsPaid > 0 ? 'PAGADO' : 'PENDIENTE',
            porcentaje_asistente: assistantPercentage,
            proxima_cita: firstSessionDate,
            monto_abonado: totalPaid
          }]);

        if (sessionError) throw sessionError;
      }

      // Si es una promoción, manejar los componentes
      if (isPromotion && components.length > 0) {
        // Insertar los componentes de la promoción
        const promotionComponentsData = components.map(comp => ({
          tratamiento_asignado_id: assignedTreatment.id,
          tratamiento_id: comp.tratamiento_id, // Usar el tratamiento_id correcto del componente
          sesiones_asignadas: comp.sessions,
          sesiones_restantes: comp.sessions
        }));

        const { error: componentsError } = await supabase
          .from('promocion_componentes')
          .insert(promotionComponentsData);

        if (componentsError) throw componentsError;

        // Crear primera sesión para cada componente
        const componentSessions = components.map(comp => ({
          tratamiento_asignado_id: assignedTreatment.id,
          fecha_sesion: firstSessionDate,
          numero_sesion: 1,
          asistente_id: comp.assistantId,
          estado_sesion: 'PENDIENTE',
          estado_pago: totalPaid > 0 ? 'PAGADO' : 'PENDIENTE',
          porcentaje_asistente: comp.percentage,
          nombre_componente: comp.name,
          comision_sumada: 0,
          monto_abonado: totalPaid > 0 ? (comp.price * comp.sessions) : 0
        }));

        const { error: componentSessionsError } = await supabase
          .from('sesiones_realizadas')
          .insert(componentSessions);

        if (componentSessionsError) throw componentSessionsError;
      }

      return assignedTreatment;
    } catch (error) {
      console.error('Error in assignTreatment:', error);
      throw error;
    }
  }

  calculateTotals(data) {
    const {
      cost = 0,
      sessions = 0,
      paidSessions = 0,
      assistantPercentage = 0,
      sellerPercentage = 0,
      components = [],
      isPromotion = false,
      isPaidInAdvance = false
    } = data;

    let total = 0;
    let totalPaid = 0;
    let pendingBalance = 0;
    let sellerCommission = 0;
    let assistantCommission = 0;

    if (isPromotion) {
      // Cálculos para promociones
      total = components.reduce((sum, comp) => sum + (comp.price * comp.sessions), 0);
      totalPaid = isPaidInAdvance ? total : 0;
      pendingBalance = total - totalPaid;

      // Calcular comisiones de componentes
      assistantCommission = components.reduce((sum, comp) => {
        return sum + ((comp.price * comp.sessions * comp.percentage) / 100);
      }, 0);

      if (sellerPercentage > 0) {
        sellerCommission = (total * sellerPercentage) / 100;
      }
    } else {
      // Cálculos para tratamientos normales
      total = cost * sessions;
      totalPaid = cost * paidSessions;
      pendingBalance = total - totalPaid;
      
      if (sellerPercentage > 0) {
        sellerCommission = (total * sellerPercentage) / 100;
      }
      
      assistantCommission = (totalPaid * assistantPercentage) / 100;
    }

    return {
      total,
      totalPaid,
      pendingBalance,
      sellerCommission,
      assistantCommission
    };
  }

  async fetchTreatments() {
    const { data, error } = await supabase
      .from('tratamientos')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data;
  }

  async fetchAssistants() {
    const { data, error } = await supabase
      .from('asistentes')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data;
  }

  async getTreatmentDetails(treatmentId) {
    const { data, error } = await supabase
      .from('tratamientos')
      .select(`
        *,
        promocion_detalles(
          id,
          tratamiento_id,
          nombre_componente,
          cantidad_sesiones,
          precio_componente
        )
      `)
      .eq('id', treatmentId)
      .single();
    
    if (error) throw error;
    return data;
  }
}