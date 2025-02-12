import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import sessionsService from '../../../services/sessionsService';

const SessionForm = ({ open, onClose, sessionData, isPromotion, componentData, tratamientoAsignadoId }) => {
  const [formData, setFormData] = useState({
    fecha_sesion: sessionData?.fecha_sesion ? new Date(sessionData.fecha_sesion) : new Date(),
    asistente_id: sessionData?.asistente_id || '',
    porcentaje_asistente: sessionData?.porcentaje_asistente || 0,
    estado_pago: sessionData?.estado_pago || 'Pendiente',
    realizada: sessionData?.realizada || false,
    proxima_cita: sessionData?.proxima_cita || null,
    comision_sumada: sessionData?.comision_sumada || 0
  });


  const [assistants, setAssistants] = useState([]);

  useEffect(() => {
    const loadAssistants = async () => {
      const { data } = await sessionsService.getAssistants();
      setAssistants(data || []);
    };
    loadAssistants();
  }, []);
  
  useEffect(() => {
    console.log("sessionData:", sessionData);
    if (sessionData && assistants.length > 0) {
      const assistantId = sessionData.asistente ? String(sessionData.asistente.id) : String(sessionData.asistente_id);
      setFormData({
        fecha_sesion: sessionData.fecha_sesion ? new Date(sessionData.fecha_sesion) : new Date(),
        asistente_id: assistantId,
        porcentaje_asistente: sessionData.porcentaje_asistente || 0,
        estado_pago: sessionData.estado_pago || 'Pendiente',
        realizada: sessionData.realizada || false
      });
    } else if (!sessionData) {
      setFormData({
        fecha_sesion: new Date(),
        asistente_id: '',
        porcentaje_asistente: 0,
        estado_pago: 'Pendiente',
        realizada: false
      });
    }
  }, [sessionData, assistants]);
  

  const handleSubmit = async () => {
    try {
      // Verificar si el tratamiento está completado
      if (componentData?.sesiones_restantes <= 0) {
        alert('El tratamiento ya está completado, no se puede agregar una nueva sesión.');
        return;
      }

      if (!formData.asistente_id) {
        alert('Por favor seleccione un esteticista');
        return;
      }
  
      // Verificar que tratamientoAsignadoId tenga un valor
      const tratamientoIdValid = tratamientoAsignadoId || sessionData?.tratamiento_asignado_id;
      if (!tratamientoIdValid) {
        alert('No hay un tratamiento asignado definido');
        return;
      }
  
      // Verificar si estamos editando una sesión existente
      const isEditing = sessionData && sessionData.id;
  
      const sessionPayload = {
        tratamiento_asignado_id: tratamientoIdValid,
        fecha_sesion: formData.fecha_sesion.toISOString(),
        asistente_id: formData.asistente_id,
        porcentaje_asistente: Number(formData.porcentaje_asistente),
        estado_pago: formData.estado_pago,
        realizada: Boolean(formData.realizada),
        // Cambio aquí: usar el estado de pago para determinar el monto
        monto_abonado: formData.estado_pago === 'PAGADO' 
          ? (componentData?.precio || sessionData?.monto || 0) 
          : 0,
        nombre_componente: isPromotion && componentData?.nombre ? componentData.nombre : null
      };
  
      console.log('Sending payload:', sessionPayload);
  
      if (isEditing) {
        console.log('Updating existing session:', sessionData.id);
        // Necesitamos pasar el tratamiento completo para calcular correctamente
        const tratamientoCompleto = {
          id: tratamientoIdValid,
          tratamiento: {
            costo: componentData?.precio || sessionData?.monto || 0
          },
          porcentaje_asistente: formData.porcentaje_asistente
        };
  
        await sessionsService.updateSession(
          sessionData.id, 
          sessionPayload, 
          tratamientoCompleto
        );
      } else {
        console.log('Creating new session');
        const { error } = await sessionsService.createSession(sessionPayload);
        if (error) throw error;
      }
  
      onClose(true);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error al guardar la sesión');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          {sessionData?.id ? 'Modificar Sesión' : 'Nueva Sesión'}
        </h2>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Sesión
            </label>
            <input
              type="date"
              value={formData.fecha_sesion.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ 
                ...formData, 
                fecha_sesion: new Date(e.target.value) 
              })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Esteticista
            </label>
            <select
              name="asistente_id"
              value={String(formData.asistente_id)}
              onChange={e => setFormData({ ...formData, asistente_id: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Seleccionar Esteticista</option>
              {assistants.map((asistente) => (
                <option key={asistente.id} value={String(asistente.id)}>
                  {asistente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje Asistente
            </label>
            <input
              type="number"
              value={formData.porcentaje_asistente}
              onChange={(e) => setFormData({ 
                ...formData, 
                porcentaje_asistente: Number(e.target.value) 
              })}
              className="w-full border rounded-md px-3 py-2"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Próxima cita
            </label>
            <input
              type="date"
              value={formData.proxima_cita?.split('T')[0] || ''}
              onChange={(e) => setFormData({ ...formData, proxima_cita: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comisión asistente
            </label>
            <input
              type="number"
              value={formData.comision_sumada}
              onChange={(e) => setFormData({ ...formData, comision_sumada: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Pago
            </label>
            <select
              value={formData.estado_pago}
              onChange={(e) => setFormData({ ...formData, estado_pago: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="PAGADO">Pagado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="realizada"
              checked={formData.realizada}
              onChange={(e) => setFormData({ ...formData, realizada: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="realizada" className="text-sm font-medium text-gray-700">
              Sesión Realizada
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button 
            onClick={() => onClose(false)}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
          >
          </button>
          
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

SessionForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sessionData: PropTypes.object,
  isPromotion: PropTypes.bool,
  componentData: PropTypes.object,
  tratamientoAsignadoId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,  // <-- Marcada como requerida
};



export default SessionForm;