// Function to render logo in a specific container
function renderLogoInContainer(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    if (config.type === 'image') {
        // Create image element
        const img = document.createElement('img');
        img.src = config.image.src;
        img.alt = config.image.alt;
        img.width = config.image.width;
        img.height = config.image.height;
        img.className = 'mr-2';
        container.appendChild(img);
    } else {
        // Use Font Awesome icon
        const icon = document.createElement('i');
        icon.className = `${config.icon.className} text-3xl mr-2 ${config.icon.color}`;
        container.appendChild(icon);
    }
}

// Function to render all logos
function renderLogos() {
    if (!window.siteConfig) return;
    // Render main navigation logo
    renderLogoInContainer('logo-container', window.siteConfig.logo);
    // Render footer logo
    renderLogoInContainer('footer-logo-container', window.siteConfig.logo);
}

// Function to update company information
function updateCompanyInfo() {
    if (!window.siteConfig) return;
    // Update company name in all locations
    document.querySelectorAll('.company-name').forEach(element => {
        element.textContent = window.siteConfig.company.name;
    });

    // Update CNPJ
    const cnpjElement = document.getElementById('company-cnpj');
    if (cnpjElement) {
        cnpjElement.textContent = `CNPJ: ${window.siteConfig.company.cnpj}`;
    }

    // Update slogan
    const sloganElement = document.getElementById('company-slogan');
    if (sloganElement) {
        sloganElement.textContent = window.siteConfig.company.slogan;
    }
}

// Function to change logo type
window.changeLogo = function(type) {
    if (!window.siteConfig) return;
    window.siteConfig.logo.type = type;
    renderLogos();
    // Save preference to localStorage
    localStorage.setItem('logoType', type);
}

// Function to toggle admin controls
function toggleAdminControls(show) {
    document.body.classList.toggle('admin-mode', show);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved logo preference
    const savedLogoType = localStorage.getItem('logoType');
    if (savedLogoType && window.siteConfig) {
        window.siteConfig.logo.type = savedLogoType;
    }

    // Set up keyboard shortcut for admin controls
    document.addEventListener('keydown', function(e) {
        // Alt + A to toggle admin mode
        if (e.altKey && e.key.toLowerCase() === 'a') {
            toggleAdminControls(!document.body.classList.contains('admin-mode'));
        }
    });

    // Initialize if config is already loaded
    if (window.siteConfig) {
        renderLogos();
        updateCompanyInfo();
    }
});
