import axios from 'axios';

const API_BASE_URL = '/api/patients'; // Adjust based on your backend setup

export const patientService = {
  getAllPatients: async (searchTerm = '') => {
    try {
      const response = await axios.get(`${API_BASE_URL}?search=${searchTerm}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },

  addPatient: async (patientData) => {
    try {
      const response = await axios.post(API_BASE_URL, patientData);
      return response.data;
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  },

  updatePatient: async (patientId, patientData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },

  deletePatient: async (patientId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }
};