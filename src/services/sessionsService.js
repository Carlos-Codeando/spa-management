import { supabase } from '../config/supabaseClient';


// Ejemplo en sessionsService.js
const getNextSessionNumber = async (tratamientoAsignadoId) => {
  const { data, error } = await supabase
    .from('sesiones_realizadas')
    .select('numero_sesion', { count: 'exact' })  // También podrías ordenar y obtener el último valor
    .eq('tratamiento_asignado_id', tratamientoAsignadoId);

  if (error) {
    console.error('Error al obtener el número de sesión:', error);
    return 1;
  }
  // Si se quiere calcular a partir del total de sesiones:
  return data ? data.length + 1 : 1;
};

const sessionsService = {
  getAllSessions: async () => {
    try {
      const { data, error } = await supabase
        .from('tratamientos_asignados')
        .select(`
          id,
          fecha_asignacion,
          sesiones_asignadas,
          sesiones_restantes,
          costo_total,
          total_pagado,
          saldo_pendiente,
          paciente:paciente_id (
            id,
            nombre
          ),
          tratamiento:tratamiento_id (
            id,
            nombre,
            es_promocion
          )
        `)
        .order('fecha_asignacion', { ascending: false });

      if (error) throw error;

      // Transformar los datos para que coincidan con el formato anterior
      const transformedData = data.map(session => ({
        id: session.id,
        fecha_asignacion: session.fecha_asignacion,
        sesiones_asignadas: session.sesiones_asignadas,
        sesiones_restantes: session.sesiones_restantes,
        costo_total: session.costo_total,
        total_pagado: session.total_pagado,
        saldo_pendiente: session.saldo_pendiente,
        paciente: {
          ...session.paciente,
          nombre: session.paciente?.nombre || "Sin nombre"
        },
        tratamiento: {
          ...session.tratamiento,
          nombre: session.tratamiento?.nombre || "Sin tratamiento",
          es_promocion: session.tratamiento?.es_promocion || false
        }
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error en getAllSessions:', error);
      return { data: null, error };
    }
  },


  getSessionDetails: async (sessionId) => {
    // Primero obtenemos los detalles base de la promoción
    const { data, error } = await supabase
      .from('tratamientos_asignados')
      .select(`
        *,
        paciente: paciente_id (*),
        tratamiento: tratamiento_id (*,
          promocion_detalles: promocion_detalles (
            nombre_componente,
            cantidad_sesiones
          )
        ),
        promocion_componentes!inner (
          id,
          tratamiento_id,
          sesiones_asignadas,
          sesiones_restantes
        ),
        sesiones_realizadas (
          id,
          fecha_sesion,
          numero_sesion,
          monto_abonado,
          estado_pago,
          realizada,
          porcentaje_asistente,
          nombre_componente,
          asistente:asistente_id (id, nombre)
        )
      `)
      .eq('id', sessionId)
      .single();
  
    if (error) {
      console.error('Error fetching session details:', error);
      return { error };
    }
  
    // Transformar los datos combinando promocion_detalles y promocion_componentes
    const transformedData = {
      ...data,
      componentes: data.tratamiento.promocion_detalles.map(detalle => {
        const componente = data.promocion_componentes.find(
          comp => comp.tratamiento_id === detalle.nombre_componente
        );
        
        const sesionesRealizadas = data.sesiones_realizadas.filter(
          sesion => sesion.nombre_componente === detalle.nombre_componente
        ).length;
  
        return {
          id: componente?.id,
          nombre_componente: detalle.nombre_componente,
          sesiones_asignadas: detalle.cantidad_sesiones,
          sesiones_restantes: componente?.sesiones_restantes || detalle.cantidad_sesiones,
          sesiones_realizadas: sesionesRealizadas
        };
      }),
      sesiones_realizadas: data.sesiones_realizadas.map(sesion => ({
        ...sesion,
        asistente: sesion.asistente || { nombre: 'No asignado' },
        monto_abonado: parseFloat(sesion.monto_abonado || 0),
        estado_pago: sesion.estado_pago || 'Pendiente',
        realizada: sesion.realizada || false
      }))
    };
  
    return { data: transformedData };
  },
  
  

  getPromotionComponents: async (promotionId) => {
    const { data, error } = await supabase
      .from('promocion_componentes')
      .select(`
        *,
        sesiones_realizadas (*)
      `)
      .eq('tratamiento_asignado_id', promotionId);

    return { data, error };
  },

  createSessionRecord: async (sessionData) => {
    const { data, error } = await supabase
      .from('sesiones_realizadas')
      .insert([sessionData])
      .select();

    return { data, error };
  },

  updateSessionStatus: async (sessionId, updates) => {
    const { data, error } = await supabase
      .from('tratamientos_asignados')
      .update(updates)
      .eq('id', sessionId)
      .select();

    return { data, error };
  },

  getAssistants: async () => {
    const { data, error } = await supabase
      .from('asistentes')
      .select('id, nombre')
      .order('nombre', { ascending: true });
      
    return { data, error };
  },

  updateSession: async (sessionId, updates, tratamientoAsignado) => {
    // Verificar si el tratamiento se pasó correctamente
    if (!tratamientoAsignado || !tratamientoAsignado.tratamiento) {
      console.error('Tratamiento no proporcionado');
      return { error: 'Tratamiento no proporcionado' };
    }

    const costoSesion = tratamientoAsignado.tratamiento.costo;

    try {
      // Usar la función de Supabase para manejar la transacción
      const { data, error } = await supabase.rpc('actualizar_sesion_y_tratamiento', {
        p_sesion_id: sessionId,
        p_realizada: updates.realizada,
        p_estado_pago: updates.estado_pago,
        p_monto_abonado: updates.estado_pago === 'PAGADO' ? costoSesion : 0,
        p_tratamiento_asignado_id: tratamientoAsignado.id,
        p_porcentaje_asistente: tratamientoAsignado.porcentaje_asistente
      });

      return { data, error };
    } catch (error) {
      console.error('Error updating session:', error);
      return { error };
    }
  },

  
  createSession: async (sessionData) => {
    // Primero, obtener el tratamiento para obtener el costo
    const { data: tratamientoData, error: tratamientoError } = await supabase
      .from('tratamientos_asignados')
      .select('tratamiento:tratamiento_id (costo), costo_total')
      .eq('id', sessionData.tratamiento_asignado_id)
      .single();

    if (tratamientoError) {
      console.error('Error obteniendo tratamiento:', tratamientoError);
      throw tratamientoError;
    }

    const costoSesion = tratamientoData.tratamiento.costo;
    const numeroSesion = await getNextSessionNumber(sessionData.tratamiento_asignado_id);

    const sessionPayload = {
      fecha_sesion: sessionData.fecha_sesion,
      asistente_id: sessionData.asistente_id || null,
      porcentaje_asistente: sessionData.porcentaje_asistente || 0,
      estado_pago: sessionData.estado_pago || 'Pendiente',
      realizada: sessionData.realizada || false,
      monto_abonado: sessionData.estado_pago === 'PAGADO' ? costoSesion : 0,
      nombre_componente: sessionData.nombre_componente || null,
      tratamiento_asignado_id: sessionData.tratamiento_asignado_id,
      numero_sesion: numeroSesion
    };

    // Validaciones
    if (!sessionPayload.tratamiento_asignado_id) {
      throw new Error('tratamiento_asignado_id is required');
    }

    if (!sessionPayload.fecha_sesion) {
      throw new Error('fecha_sesion is required');
    }

    try {
      // Usar la función de Supabase para manejar la transacción
      const { data, error } = await supabase.rpc('crear_sesion_con_actualizacion', {
        p_fecha_sesion: sessionPayload.fecha_sesion,
        p_asistente_id: sessionPayload.asistente_id,
        p_porcentaje_asistente: sessionPayload.porcentaje_asistente,
        p_estado_pago: sessionPayload.estado_pago,
        p_realizada: sessionPayload.realizada,
        p_monto_abonado: sessionPayload.monto_abonado,
        p_nombre_componente: sessionPayload.nombre_componente,
        p_tratamiento_asignado_id: sessionPayload.tratamiento_asignado_id,
        p_numero_sesion: sessionPayload.numero_sesion
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in createSession:', error);
      return { data: null, error };
    }
  },



  getComponentSessions: async (treatmentId, componentId) => {
    const { data, error } = await supabase
      .from('sesiones_realizadas')
      .select('*, asistente: asistente_id (nombre)')
      .eq('tratamiento_asignado_id', treatmentId)
      .eq('nombre_componente', componentId);
  
    return { data, error };
  },

  createPromotionSession: async (sessionData) => {
    try {
      const { data, error } = await supabase.rpc('crear_sesion_promocion', {
        p_fecha_sesion: sessionData.fecha_sesion,
        p_asistente_id: sessionData.asistente_id,
        p_porcentaje_asistente: sessionData.porcentaje_asistente,
        p_estado_pago: sessionData.estado_pago,
        p_realizada: sessionData.realizada,
        p_monto_abonado: sessionData.monto_abonado,
        p_nombre_componente: sessionData.nombre_componente,
        p_tratamiento_asignado_id: sessionData.tratamiento_asignado_id,
        p_numero_sesion: sessionData.numero_sesion
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating promotion session:', error);
      return { data: null, error };
    }
  },

  updatePromotionSession: async (sessionId, updates, treatmentId, componentName) => {
    try {
      const { data, error } = await supabase.rpc('actualizar_sesion_promocion', {
        p_sesion_id: sessionId,
        p_realizada: updates.realizada,
        p_estado_pago: updates.estado_pago,
        p_monto_abonado: updates.monto_abonado,
        p_tratamiento_asignado_id: treatmentId,
        p_nombre_componente: componentName,
        p_porcentaje_asistente: updates.porcentaje_asistente
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating promotion session:', error);
      return { data: null, error };
    }
  },



  // Función auxiliar para obtener el precio del componente
  getComponentPrice: async (treatmentId, componentName) => {
    try {
      const { data, error } = await supabase
        .from('promocion_detalles')
        .select('precio_componente')
        .eq('promocion_id', treatmentId)
        .eq('nombre_componente', componentName)
        .single();

      if (error) throw error;
      return { data: data?.precio_componente || 0, error: null };
    } catch (error) {
      console.error('Error getting component price:', error);
      return { data: 0, error };
    }
  }
  
};




export default sessionsService;