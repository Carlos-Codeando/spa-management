import React, { useState, useEffect } from 'react';
import treatmentsService from '../../services/treatmentsService';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/outline';

const Treatments = () => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    costo: '',
    es_promocion: false
  });
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isPromotion, setIsPromotion] = useState(false);
  const [promotionComponents, setPromotionComponents] = useState([]);
  const [expandedPromotions, setExpandedPromotions] = useState({});
  const [promotionDetails, setPromotionDetails] = useState({});

  const togglePromotionDetails = async (promotionId) => {
    // Si ya está expandida, solo la cerramos
    if (expandedPromotions[promotionId]) {
      setExpandedPromotions(prev => ({
        ...prev,
        [promotionId]: false
      }));
      return;
    }

    // Si no está expandida, obtenemos los detalles y la expandimos
    try {
      const { data, error } = await treatmentsService.getPromotionDetails(promotionId);
      if (error) throw error;

      setPromotionDetails(prev => ({
        ...prev,
        [promotionId]: data
      }));

      setExpandedPromotions(prev => ({
        ...prev,
        [promotionId]: true
      }));
    } catch (error) {
      console.error('Error fetching promotion details:', error);
    }
  };

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const { data, error } = await treatmentsService.fetchTreatments();
      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTreatments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isPromotion) {
        const promotionData = {
          nombre: formData.nombre,
          componentes: promotionComponents,
          total: treatmentsService.calculatePromotionTotal(promotionComponents)
        };
        const { error } = await treatmentsService.addPromotion(promotionData);
        if (error) throw error;
      } else {
        if (selectedTreatment) {
          const { error } = await treatmentsService.updateTreatment(selectedTreatment.id, formData);
          if (error) throw error;
        } else {
          const { error } = await treatmentsService.addTreatment(formData);
          if (error) throw error;
        }
      }
      
      fetchTreatments();
      resetForm();
    } catch (error) {
      console.error('Error saving treatment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTreatment = (treatment) => {
    setSelectedTreatment(treatment);
    setFormData({
      nombre: treatment.nombre,
      costo: treatment.costo.toString(),
      es_promocion: treatment.es_promocion,
    });
    setIsPromotion(treatment.es_promocion);
  };

  const handleDeleteTreatment = async (id) => {
  if (!window.confirm('¿Está seguro de eliminar este tratamiento?')) return;
  
  setLoading(true);
  try {
    const { error } = await treatmentsService.deleteTreatment(id);
    if (error) throw error;
    fetchTreatments();
  } catch (error) {
    console.error('Error deleting treatment:', error);
  } finally {
    setLoading(false);
  }
};


  const handleAddComponent = () => {
    setPromotionComponents([
      ...promotionComponents,
      { nombre: '', precio: '', sesiones: '' }
    ]);
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = promotionComponents.map((comp, i) => {
      if (i === index) {
        return { ...comp, [field]: value };
      }
      return comp;
    });
    setPromotionComponents(updatedComponents);
  };

  const handleRemoveComponent = (index) => {
    setPromotionComponents(promotionComponents.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      costo: '',
      es_promocion: false,
    });
    setSelectedTreatment(null);
    setIsPromotion(false);
    setPromotionComponents([]);
  };
  

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Gestión de Tratamientos
      </h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del Tratamiento
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
              placeholder="Ingrese nombre del tratamiento"
            />
          </div>
          {!isPromotion && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Costo
              </label>
              <input
                type="number"
                name="costo"
                value={formData.costo}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
                placeholder="Ingrese costo"
                min="0"
                step="0.01"
              />
            </div>
          )}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="es_promocion"
              checked={isPromotion}
              onChange={(e) => setIsPromotion(e.target.checked)}
              className="mr-2 rounded text-[#9e8d59] focus:ring-[#9e8d59]"
            />
            <label className="text-sm font-medium text-gray-700">
              Es una Promoción
            </label>
          </div>
        </div>
  
        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-[#9e8d59] text-white rounded-md hover:bg-[#8a7b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9e8d59]"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {selectedTreatment ? 'Modificar' : 'Agregar'}
          </button>
          {selectedTreatment && (
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancelar
            </button>
          )}
        </div>
        {isPromotion && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Componentes de la Promoción</h3>
              <button
                type="button"
                onClick={handleAddComponent}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#9e8d59] hover:bg-[#8a7b4d]"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Agregar Componente
              </button>
            </div>
  
            {promotionComponents.map((component, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  value={component.nombre}
                  onChange={(e) => handleComponentChange(index, 'nombre', e.target.value)}
                  placeholder="Nombre del componente"
                  className="rounded-md border-gray-300"
                />
                <input
                  type="number"
                  value={component.precio}
                  onChange={(e) => handleComponentChange(index, 'precio', e.target.value)}
                  placeholder="Precio por sesión"
                  className="rounded-md border-gray-300"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={component.sesiones}
                    onChange={(e) => handleComponentChange(index, 'sesiones', e.target.value)}
                    placeholder="Número de sesiones"
                    className="rounded-md border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
  
            {promotionComponents.length > 0 && (
              <div className="text-right text-lg font-medium">
                Total: ${treatmentsService.calculatePromotionTotal(promotionComponents).toFixed(2)}
              </div>
            )}
          </div>
        )}
      </form>
      {loading && (
        <div className="text-center py-4">
          <div className="spinner">Cargando...</div>
        </div>
      )}
  
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10"></th>{['ID', 'Nombre', 'Costo', 'Tipo'].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {treatments.map((treatment) => (
              <React.Fragment key={treatment.id}>
                <tr className="hover:bg-gray-50">
                  <td className="pl-4">
                    {treatment.es_promocion && (
                      <button
                        onClick={() => togglePromotionDetails(treatment.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedPromotions[treatment.id] ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </td><td className="px-6 py-4 whitespace-nowrap">{treatment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{treatment.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${treatment.costo.toFixed(2)}
                  </td><td className="px-6 py-4 whitespace-nowrap">
                    {treatment.es_promocion ? 'Promoción' : 'Tratamiento'}
                  </td><td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {treatment.es_promocion ? (
                      <button
                        onClick={() => togglePromotionDetails(treatment.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {expandedPromotions[treatment.id] ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <PlusIcon className="h-5 w-5" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditTreatment(treatment)}
                        disabled={loading}
                        className="text-[#9e8d59] hover:text-[#8a7b4d] mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTreatment(treatment.id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
                {expandedPromotions[treatment.id] && promotionDetails[treatment.id] && (
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="px-8 py-4">
                      <div className="border-l-4 border-[#9e8d59] pl-4">
                        <h4 className="font-medium text-lg mb-2">Detalles de la Promoción</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {promotionDetails[treatment.id].map((detail) => (
                            <div
                              key={detail.id}
                              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                            >
                              <h5 className="font-medium text-[#9e8d59]">
                                {detail.nombre_componente}
                              </h5>
                              <div className="text-sm text-gray-600 mt-1">
                                <p>Sesiones: {detail.cantidad_sesiones}</p>
                                <p>Precio por sesión: ${detail.precio_componente.toFixed(2)}</p>
                                <p className="font-medium mt-1">
                                  Subtotal: ${(detail.cantidad_sesiones * detail.precio_componente).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Treatments;