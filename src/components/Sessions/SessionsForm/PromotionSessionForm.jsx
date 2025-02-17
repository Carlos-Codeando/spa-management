import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SessionForm from './SessionForm';
import sessionsService from '../../../services/sessionsService';
import { toast } from 'react-hot-toast';

const PromotionSessionForm = ({ 
  isOpen, 
  onClose, 
  treatmentId, 
  componentName,
  onUpdate 
}) => {
  const [componentInfo, setComponentInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadComponentInfo = async () => {
      try {
        setLoading(true);
        const { data: sessionData, error } = await sessionsService.getSessionDetails(treatmentId);
        
        if (error) throw error;

        const component = sessionData.componentes.find(
          comp => comp.nombre_componente === componentName
        );

        if (!component) throw new Error('Componente no encontrado');

        setComponentInfo({
          ...component,
          nombre_paciente: sessionData.paciente?.nombre,
          nombre_promocion: sessionData.tratamiento?.nombre,
        });

        const { data: sessionsData, error: sessionsError } = 
          await sessionsService.getComponentSessions(treatmentId, componentName);

        if (sessionsError) throw sessionsError;

        setSessions(sessionsData || []);
      } catch (error) {
        console.error('Error loading component info:', error);
        toast.error('Error al cargar la información del componente');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && treatmentId && componentName) {
      loadComponentInfo();
    }
  }, [isOpen, treatmentId, componentName, refreshKey]);

  const handleSessionFormSubmit = async (formData) => {
    try {
      let result;
      
      // Get component price
      const { data: componentPrice } = await sessionsService.getComponentPrice(
        treatmentId,
        componentName
      );

      const sessionData = {
        ...formData,
        tratamiento_asignado_id: treatmentId,
        nombre_componente: componentName,
        monto_abonado: formData.estado_pago === 'PAGADO' ? componentPrice : 0
      };

      if (selectedSession) {
        // Update existing session
        result = await sessionsService.updatePromotionSession(
          selectedSession.id,
          sessionData,
          treatmentId,
          componentName
        );
      } else {
        // Create new session
        result = await sessionsService.createPromotionSession(sessionData);
      }

      if (result.error) {
        throw result.error;
      }

      setShowSessionForm(false);
      setRefreshKey(prev => prev + 1);
      if (onUpdate) onUpdate();
      toast.success(
        selectedSession 
          ? 'Sesión actualizada exitosamente'
          : 'Sesión creada exitosamente'
      );
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error al guardar la sesión');
    }
  };


  const handleNewSession = () => {
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleSessionFormClose = (success) => {
    setShowSessionForm(false);
    if (success) {
      setRefreshKey(prev => prev + 1);
      if (onUpdate) onUpdate();
      toast.success('Sesión actualizada exitosamente');
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-[900px] w-full mx-4">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-[900px] w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Header Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {componentInfo?.nombre_paciente}
                </h2>
                <span className="text-gray-600">
                  {componentName}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sesiones Realizadas</p>
                  <p className="text-lg font-bold">
                    {componentInfo?.sesiones_realizadas}/{componentInfo?.sesiones_asignadas}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sesiones Restantes</p>
                  <p className="text-lg font-bold">
                    {componentInfo?.sesiones_restantes}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="text-lg font-bold">
                    {componentInfo?.sesiones_restantes === 0 ? 'Completado' : 'En Progreso'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleNewSession}
              disabled={componentInfo?.sesiones_restantes === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Nueva Sesión
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>

          {/* Sessions Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sesión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Esteticista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Sesión {session.numero_sesion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(session.fecha_sesion).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.asistente?.nombre || 'No asignado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full ${
                        session.realizada 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.realizada ? 'Realizada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full ${
                        session.estado_pago === 'PAGADO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {session.estado_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditSession(session)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No hay sesiones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showSessionForm && (
          <SessionForm
          open={showSessionForm}
          onClose={handleSessionFormClose}
          onSubmit={handleSessionFormSubmit}
          tratamientoAsignadoId={treatmentId}
          componentData={{
            nombre: componentName,
            precio: componentInfo?.precio_componente,
            sesiones_restantes: componentInfo?.sesiones_restantes
          }}
          sessionData={selectedSession}
          isPromotion={true}
        />
        )}
      </div>
    </div>
  );
};

PromotionSessionForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  treatmentId: PropTypes.number.isRequired,
  componentName: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
};

export default PromotionSessionForm;