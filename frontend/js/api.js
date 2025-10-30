// frontend/js/api.js

/**
 * Configuración de la API
 */
const API_URL = 'http://localhost:3000/api';

/**
 * Clase para manejar todas las peticiones HTTP a la API
 */
class API {
    /**
     * Petición GET
     */
    static async get(endpoint, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
            
            console.log('🔵 GET:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('❌ Error en GET:', error);
            throw error;
        }
    }
    
    /**
     * Petición POST
     */
    static async post(endpoint, data = {}) {
        try {
            const url = `${API_URL}${endpoint}`;
            
            console.log('🔵 POST:', url, data);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('❌ Error en POST:', error);
            throw error;
        }
    }
    
    /**
     * Petición PUT
     */
    static async put(endpoint, data = {}) {
        try {
            const url = `${API_URL}${endpoint}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('❌ Error en PUT:', error);
            throw error;
        }
    }
    
    /**
     * Petición DELETE
     */
    static async delete(endpoint) {
        try {
            const url = `${API_URL}${endpoint}`;
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('❌ Error en DELETE:', error);
            throw error;
        }
    }
    
    /**
     * Obtener headers con autenticación
     */
    static getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    /**
     * Manejar respuesta de la API
     */
    static async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición');
        }
        
        return data;
    }
}

// Hacer API disponible globalmente
window.API = API;