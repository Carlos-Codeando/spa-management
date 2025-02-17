import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import sessionsService from '../../../services/sessionsService';
import PromotionComponents from '../PromotionComponents/PromotionComponents';


const SessionDetails = ({ session, onClose, onOpenForm }) => {
  const [sessionsList, setSessionsList] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionDetails = async () => {
      try {
        setLoading(true);
        const { data } = await sessionsService.getSessionDetails(session.id);
        setSessionsList(data?.sesiones_realizadas || []);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
        setLoadingSessions(false);
      }
    };
 
    if (session) loadSessionDetails();
  }, [session]);

  const getPaymentStatusBadge = (estadoPago) => {
    const statusMap = {
      'PAGADO': 'bg-green-200 text-green-800',
      'Pendiente': 'bg-yellow-200 text-yellow-800'
    };
    
    const badgeClass = statusMap[estadoPago] || 'bg-gray-200 text-gray-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badgeClass}`}>
        {estadoPago}
      </span>
    );
  };

  const getSessionStatus = (realizada) => {
    return realizada 
      ? <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">Realizada</span>
      : <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">Pendiente</span>;
  };

  if (!session) return null;
  
  const progreso = `${session.sesiones_asignadas - session.sesiones_restantes}/${session.sesiones_asignadas}`;


  const renderSessionContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      );
    }

    if (session.tratamiento?.es_promocion) {
      return (
        <PromotionComponents 
          session={{
            ...session,
            componentes: session.componentes || [],
            paciente: session.paciente,
            tratamiento_asignado_id: session.id
          }} 
        />
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Sesiones Registradas</h3>
        {loadingSessions ? (
          <div className="w-full h-2 bg-blue-200 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Sesión</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Esteticista</th>
                  <th className="px-4 py-2 text-left">Monto</th>
                  <th className="px-4 py-2 text-left">Estado Pago</th>
                  <th className="px-4 py-2 text-left">Estado Sesión</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessionsList.map((sesion) => (
                  <tr key={sesion.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">Sesión {sesion.numero_sesion}</td>
                    <td className="px-4 py-2">
                      {new Date(sesion.fecha_sesion).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{sesion.asistente?.nombre || 'No asignado'}</td>
                    <td className="px-4 py-2">${(sesion.monto_abonado || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">{getPaymentStatusBadge(sesion.estado_pago)}</td>
                    <td className="px-4 py-2">{getSessionStatus(sesion.realizada)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onOpenForm(sesion)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => {
              if (session.sesiones_restantes <= 0) {
                alert('El tratamiento ya está completado, no se puede agregar una nueva sesión.');
                return;
              }
              onOpenForm();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
          >
            ➕ Nueva Sesión
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalle de Sesiones</h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {/* Header información general */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Información del Paciente</h3>
              <p><strong>Paciente:</strong> {session.paciente?.nombre}</p>
              <p><strong>Tratamiento:</strong> {session.tratamiento?.nombre}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Información Financiera</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-sm text-gray-600">Total:</p>
                  <p className="font-bold">${session.costo_total?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pagado:</p>
                  <p className="font-bold text-green-600">${session.total_pagado?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo:</p>
                  <p className="font-bold text-red-600">${session.saldo_pendiente?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Progreso del tratamiento</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-48 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${((session.sesiones_asignadas - session.sesiones_restantes)/session.sesiones_asignadas)*100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{progreso} sesiones</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">Sesiones restantes: 
                <span className="font-bold ml-1">{session.sesiones_restantes}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contenido dinámico basado en el tipo de tratamiento */}
        {renderSessionContent()}
      </div>
    </div>
  );
};

SessionDetails.propTypes = {
  session: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenForm: PropTypes.func.isRequired,
};

export default SessionDetails;