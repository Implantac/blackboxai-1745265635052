// WhatsApp Integration
class WhatsAppIntegration {
    constructor() {
        this.phoneNumber = '5511999999999'; // Replace with actual number
        this.setupWhatsAppButton();
    }

    setupWhatsAppButton() {
        const button = document.querySelector('.whatsapp-button');
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.openWhatsApp();
            });

            // Show tooltip on hover
            button.setAttribute('title', 'Fale conosco no WhatsApp');
            
            // Add aria-label for accessibility
            button.setAttribute('aria-label', 'Contato via WhatsApp');
        }
    }

    getSelectedModules() {
        const checkboxes = document.querySelectorAll('.module-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    getUserCount() {
        const slider = document.getElementById('user-count');
        return slider ? slider.value : 0;
    }

    formatMessage() {
        const modules = this.getSelectedModules();
        const userCount = this.getUserCount();
        
        let message = 'Olá! Gostaria de saber mais sobre a USE SISTEMAS.';
        
        if (userCount > 0) {
            message += `\nPreciso de uma solução para ${userCount} usuários.`;
        }
        
        if (modules.length > 0) {
            message += '\nTenho interesse nos módulos:';
            modules.forEach(module => {
                message += `\n- ${module}`;
            });
        }
        
        message += '\nPoderia me ajudar?';
        
        return encodeURIComponent(message);
    }

    openWhatsApp() {
        const message = this.formatMessage();
        const url = `https://wa.me/${this.phoneNumber}?text=${message}`;
        window.open(url, '_blank');
    }
}

// Initialize WhatsApp integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WhatsAppIntegration();
});
