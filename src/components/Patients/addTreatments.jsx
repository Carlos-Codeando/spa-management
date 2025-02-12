import { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreatmentService } from '../../services/addTreatmentService';
import PromotionComponents from './PromotionComponents';

const AddTreatments = ({ patientId, onClose }) => {
  const treatmentService = useMemo(() => new TreatmentService(), []);
  const [treatments, setTreatments] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPromotion, setIsPromotion] = useState(false);
  const [promotionComponents, setPromotionComponents] = useState([]);
  const [totals, setTotals] = useState({
    total: 0,
    paid: 0,
    balance: 0,
    sellerCommission: 0,
    assistantCommission: 0
  });

  const [formData, setFormData] = useState({
    treatmentId: '',
    assistantId: '',
    sellerId: '',
    assistantPercentage: 30, // valor por defecto
    sellerPercentage: 0,
    assignedSessions: 1,
    paidSessions: 0,
    totalCost: 0,
    totalPaid: 0,
    firstSessionDate: new Date().toISOString().split('T')[0],
    isPromotion: false,
    hasSeller: false,
    paidInAdvance: false
  });


  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [treatmentsData, assistantsData] = await Promise.all([
          treatmentService.fetchTreatments(),
          treatmentService.fetchAssistants()
        ]);
        
        console.log('Treatments loaded:', treatmentsData);
        console.log('Assistants loaded:', assistantsData);
        
        setTreatments(treatmentsData);
        setAssistants(assistantsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError("Error loading data. Please try again.");
      }
    };
  
    loadInitialData();
  }, [treatmentService]);

  const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;
  const newValue = type === 'checkbox' ? checked : value;

  setFormData(prev => {
    const updatedFormData = {
      ...prev,
      [name]: newValue
    };

    // Si el campo cambiado es treatmentId, actualizar el costo total
    if (name === 'treatmentId') {
      const selectedTreatment = treatments.find(t => t.id === parseInt(value));
      if (selectedTreatment) {
        updatedFormData.totalCost = selectedTreatment.costo * updatedFormData.assignedSessions;
      }
    }

    return updatedFormData;
  });
};

useEffect(() => {
  const calculateTotals = () => {
    if (!formData.treatmentId) return;

    if (isPromotion) {
      const total = promotionComponents.reduce((sum, comp) => 
        sum + (comp.price * comp.sessions), 0);
      const totalPaid = formData.paidInAdvance ? total : 0;
      const balance = total - totalPaid;
      const sellerCommission = formData.hasSeller ? 
        (total * formData.sellerPercentage) / 100 : 0;
      
      const assistantCommission = promotionComponents.reduce((sum, comp) => 
        sum + ((comp.price * comp.sessions * comp.percentage) / 100), 0);

      setTotals({
        total,
        paid: totalPaid,
        balance,
        sellerCommission,
        assistantCommission
      });
    } else {

        // Los cálculos originales para tratamientos normales permanecen igual
        const selectedTreatment = treatments.find(t => t.id === parseInt(formData.treatmentId));
        if (!selectedTreatment) return;

    const costPerSession = selectedTreatment.costo;
    const totalSessions = parseInt(formData.assignedSessions) || 0;
    const paidSessions = parseInt(formData.paidSessions) || 0;
    const assistantPercentage = parseFloat(formData.assistantPercentage) || 0;
    const sellerPercentage = formData.hasSeller ? (parseFloat(formData.sellerPercentage) || 0) : 0;

    const total = costPerSession * totalSessions;
    const totalPaid = costPerSession * paidSessions;
    const balance = total - totalPaid;
    const assistantCommission = (totalPaid * assistantPercentage) / 100;
    const sellerCommission = formData.hasSeller ? (total * sellerPercentage) / 100 : 0;

    setTotals({
      total,
      paid: totalPaid,
      balance,
      sellerCommission,
      assistantCommission
    });
  }
  };

  calculateTotals();
}, [
  formData.treatmentId,
  formData.assignedSessions,
  formData.paidSessions,
  formData.assistantPercentage,
  formData.sellerPercentage,
  formData.hasSeller,
  formData.paidInAdvance, // Agregar esta dependencia
  isPromotion,
  promotionComponents,
  treatments
]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const treatmentToSave = {
        patientId,
        treatmentId: parseInt(formData.treatmentId),
        assistantId: isPromotion ? null : formData.assistantId, // null para promociones
        sellerId: formData.hasSeller ? formData.sellerId : null,
        assistantPercentage: isPromotion ? 
          promotionComponents.reduce((sum, comp) => sum + comp.percentage, 0) / promotionComponents.length : 
          parseFloat(formData.assistantPercentage),
        sellerPercentage: formData.hasSeller ? parseFloat(formData.sellerPercentage) : 0,
        sessionsAssigned: isPromotion ? 
          promotionComponents.reduce((sum, comp) => sum + comp.sessions, 0) : 
          parseInt(formData.assignedSessions),
        sessionsPaid: isPromotion ? 
          (formData.paidInAdvance ? promotionComponents.reduce((sum, comp) => sum + comp.sessions, 0) : 0) : 
          parseInt(formData.paidSessions),
        totalCost: totals.total,
        totalPaid: totals.paid,
        firstSessionDate: formData.firstSessionDate,
        isPromotion,
        components: isPromotion ? promotionComponents.map(comp => ({
          componentId: comp.id,
          name: comp.name,
          sessions: comp.sessions,
          price: comp.price,
          assistantId: comp.assistantId,
          percentage: comp.percentage
        })) : []
      };

      await treatmentService.assignTreatment(treatmentToSave);
      onClose();
    } catch (err) {
      console.error('Error saving treatment:', err);
      setError("Error saving treatment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <CardTitle className="text-lg">Asignar Tratamiento</CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-y-auto">
         <CardContent className="p-6">
          {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Treatment Type Selection */}
                <div className="flex gap-4 border-b pb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="isPromotion"
                      checked={!isPromotion}
                      onChange={() => setIsPromotion(false)}
                      className="form-radio h-4 w-4"
                    />
                    <span className="text-sm">Tratamiento Individual</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="isPromotion"
                      checked={isPromotion}
                      onChange={() => setIsPromotion(true)}
                      className="form-radio h-4 w-4"
                    />
                    <span className="text-sm">Paquete Promocional</span>
                  </label>
                </div>

                {/* Treatment Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      {isPromotion ? 'Seleccionar Promoción' : 'Seleccionar Tratamiento'}
                    </label>
                    <select
                      name="treatmentId"
                      value={formData.treatmentId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {treatments
                        .filter(treatment => treatment.es_promocion === isPromotion)
                        .map(treatment => (
                          <option key={treatment.id} value={treatment.id}>
                            {treatment.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {isPromotion && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700">Componentes de la Promoción</h3>
                    <PromotionComponents
                      treatmentId={formData.treatmentId}
                      treatments={treatments}
                      assistants={assistants}
                      onComponentsChange={setPromotionComponents}
                    />
                  </div>
                )}

                {/* Assistant Section */}
                {!isPromotion && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Esteticista</label>
                      <select
                        name="assistantId"
                        value={formData.assistantId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecciona al Asistente</option>
                        {assistants?.map(assistant => (
                          <option key={assistant.id} value={assistant.id}>
                            {assistant.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">% Comisión</label>
                      <input
                        type="number"
                        name="assistantPercentage"
                        value={formData.assistantPercentage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Seller Section */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="hasSeller"
                      checked={formData.hasSeller}
                      onChange={handleInputChange}
                      className="form-checkbox h-4 w-4 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Incluir vendedor</span>
                  </label>

                  {formData.hasSeller && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Vendedor</label>
                        <select
                          name="sellerId"
                          value={formData.sellerId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Seleccionar Vendedor</option>
                          {assistants?.map(seller => (
                            <option key={seller.id} value={seller.id}>
                              {seller.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">% Comisión</label>
                        <input
                          type="number"
                          name="sellerPercentage"
                          value={formData.sellerPercentage}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sessions Section */}
                {!isPromotion ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Sesiones Totales</label>
                      <input
                        type="number"
                        name="assignedSessions"
                        value={formData.assignedSessions}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Sesiones Pagadas</label>
                      <input
                        type="number"
                        name="paidSessions"
                        value={formData.paidSessions}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={formData.assignedSessions}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Fecha Inicio</label>
                      <input
                        type="date"
                        name="firstSessionDate"
                        value={formData.firstSessionDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Fecha Inicio</label>
                      <input
                        type="date"
                        name="firstSessionDate"
                        value={formData.firstSessionDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="paidInAdvance"
                          checked={formData.paidInAdvance}
                          onChange={handleInputChange}
                          className="form-checkbox h-4 w-4 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Pago Adelantado</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Totals Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">Resumen Financiero</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-600">Total:</p>
                      <p className="font-medium">${totals.total.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Pagado:</p>
                      <p className="font-medium">${totals.paid.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Saldo:</p>
                      <p className="font-medium">${totals.balance.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Com. Vendedor:</p>
                      <p className="font-medium">${totals.sellerCommission.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Com. Esteticista:</p>
                      <p className="font-medium">${totals.assistantCommission.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t p-4 bg-white shrink-0">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar Tratamiento'}
                  </button>
                </div>
              </div>
            </form>
            {/* Form Actions */}
            
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

AddTreatments.propTypes = {
  patientId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AddTreatments;