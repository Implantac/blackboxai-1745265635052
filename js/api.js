// API Helper Functions
const api = {
    // Get base URL from site config
    getBaseUrl() {
        return window.siteConfig?.api?.baseUrl || '/api';
    },

    // Get full endpoint URL
    getEndpointUrl(endpoint) {
        const baseUrl = this.getBaseUrl();
        const endpoints = window.siteConfig?.api?.endpoints || {};
        return `${baseUrl}${endpoints[endpoint] || endpoint}`;
    },

    // Generic API call function with error handling
    async call(endpoint, options = {}) {
        try {
            const url = this.getEndpointUrl(endpoint);
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    },

    // Test connection to backend
    async testConnection() {
        try {
            const result = await this.call('/');
            console.log('Backend connection test:', result);
            return result;
        } catch (error) {
            console.error('Backend connection test failed:', error);
            throw error;
        }
    }
};

    // Test connection when page loads
    document.addEventListener('DOMContentLoaded', () => {
        const statusElement = document.getElementById('connection-status');
        const errorElement = document.getElementById('connection-error');

        function showStatus(isSuccess) {
            if (isSuccess) {
                statusElement.classList.remove('hidden');
                errorElement.classList.add('hidden');
                // Hide success message after 3 seconds
                setTimeout(() => {
                    statusElement.classList.add('hidden');
                }, 3000);
            } else {
                errorElement.classList.remove('hidden');
                statusElement.classList.add('hidden');
                // Hide error message after 5 seconds
                setTimeout(() => {
                    errorElement.classList.add('hidden');
                }, 5000);
            }
        }

        // Test connection
        api.testConnection()
            .then(result => {
                console.log('✅ Backend connection successful:', result);
                showStatus(true);
            })
            .catch(error => {
                console.error('❌ Backend connection failed:', error);
                showStatus(false);
            });
    });

// Export for use in other scripts
window.api = api;
