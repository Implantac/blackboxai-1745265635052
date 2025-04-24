window.addEventListener('DOMContentLoaded', (event) => {
    window.siteConfig = {
        // API Configuration
        api: {
            baseUrl: window.location.hostname === 'localhost' 
                ? 'http://localhost:5000/api'
                : '/api',
            endpoints: {
                auth: '/auth',
                usuarios: '/usuarios',
                clientes: '/clientes',
                estoque: '/estoque',
                vendas: '/vendas',
                financeiro: '/financeiro'
            }
        },
        // Logo configuration
        logo: {
            type: 'image', // 'image' or 'icon'
            // Image logo configuration
            image: {
                src: '/images/logo.svg',
                alt: 'USE SISTEMAS Logo',
                width: '40',
                height: '40'
            },
            // Icon logo configuration (using Font Awesome)
            icon: {
                className: 'fas fa-cube',
                color: 'text-accent'
            }
        },
        // Company information
        company: {
            name: 'USE SISTEMAS',
            cnpj: '42.506.289/0001-65',
            slogan: 'Solução Moderna de Gestão Empresarial'
        }
    };

    // Initialize logo and company info after config is loaded
    if (typeof renderLogos === 'function') {
        renderLogos();
    }
    if (typeof updateCompanyInfo === 'function') {
        updateCompanyInfo();
    }
});
