import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {treatmentsService} from '../../services/treatmentsService';

const PromotionComponents = ({ treatmentId, assistants, onComponentsChange }) => {
  const [components, setComponents] = useState([]);

  useEffect(() => {
    const loadComponents = async () => {
      if (!treatmentId) return;

      try {
        const { data: promotionDetails } = await treatmentsService.getPromotionDetails(treatmentId);

        const componentsData = promotionDetails.map(comp => ({
          id: comp.id,
          tratamiento_id: comp.tratamiento_id, // Añadir esta línea
          name: comp.nombre_componente,
          sessions: comp.cantidad_sesiones,
          price: comp.precio_componente,
          subtotal: comp.precio_componente * comp.cantidad_sesiones,
          assistantId: '',
          percentage: 30
        }));

        setComponents(componentsData);
        onComponentsChange(componentsData);
      } catch (error) {
        console.error('Error loading components:', error);
      }
    };

    loadComponents();
  }, [treatmentId, onComponentsChange]);

  const handleComponentChange = (index, field, value) => {
    const safeValue = value === null ? '' : value; // Convertir null a cadena vacía

    const updatedComponents = components.map((comp, i) => {
      if (i === index) {
        return { ...comp, [field]: safeValue };
      }
      return comp;
    });

    setComponents(updatedComponents);
    onComponentsChange(updatedComponents);
  };
    return (
      <div className="space-y-3">
        {components.map((component, index) => (
          <div key={component.id} className="p-4 bg-white border rounded-lg shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{component.name}</span>
                <span className="text-sm text-gray-600">
                  ${component.price} × {component.sessions} Sesiones = ${component.subtotal}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Esteticista</label>
                  <select
                    value={component.assistantId || ''}
                    onChange={(e) => handleComponentChange(index, 'assistantId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {assistants.map(assistant => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">% Comisión</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={component.percentage}
                      onChange={(e) => handleComponentChange(index, 'percentage', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                      required
                    />
                    <span className="text-gray-400 text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );    
};
PromotionComponents.propTypes = {
  treatmentId: PropTypes.string.isRequired,
  treatments: PropTypes.array.isRequired,
  assistants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired
    })
  ).isRequired,
  onComponentsChange: PropTypes.func.isRequired
};

export default PromotionComponents;

