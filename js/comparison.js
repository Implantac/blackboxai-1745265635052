// Pricing Calculator
class PricingCalculator {
    constructor() {
        this.basePrice = 199;
        this.userMultiplier = 50;
        this.moduleMultiplier = 100;
        this.setupListeners();
    }

    setupListeners() {
        const userSlider = document.getElementById('user-count');
        const moduleCheckboxes = document.querySelectorAll('.module-checkbox');
        
        if (userSlider) {
            userSlider.addEventListener('input', () => this.updatePrice());
        }
        
        moduleCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePrice());
        });
    }

    calculatePrice() {
        const userCount = parseInt(document.getElementById('user-count')?.value || 1);
        const selectedModules = document.querySelectorAll('.module-checkbox:checked').length;
        
        const userCost = Math.floor(userCount / 5) * this.userMultiplier;
        const moduleCost = selectedModules * this.moduleMultiplier;
        
        return this.basePrice + userCost + moduleCost;
    }

    updatePrice() {
        const priceDisplay = document.getElementById('calculated-price');
        const userCountDisplay = document.getElementById('user-count-display');
        
        if (priceDisplay) {
            const price = this.calculatePrice();
            priceDisplay.textContent = price.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }
        
        if (userCountDisplay) {
            userCountDisplay.textContent = document.getElementById('user-count').value;
        }
    }
}

// Feature Comparison
class FeatureComparison {
    constructor() {
        this.setupComparison();
    }

    setupComparison() {
        const comparisonTable = document.querySelector('.comparison-table');
        if (!comparisonTable) return;

        // Add hover effect to rows
        const rows = comparisonTable.querySelectorAll('tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });

        // Add feature tooltips
        const features = comparisonTable.querySelectorAll('.feature-info');
        features.forEach(feature => {
            feature.addEventListener('mouseenter', (e) => this.showTooltip(e));
            feature.addEventListener('mouseleave', () => this.hideTooltip());
        });
    }

    showTooltip(event) {
        const tooltip = document.createElement('div');
        tooltip.className = 'feature-tooltip';
        tooltip.textContent = event.target.dataset.tooltip;
        
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.feature-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

// Success Stories
class SuccessStories {
    constructor() {
        this.stories = document.querySelectorAll('.success-story');
        this.setupStories();
    }

    setupStories() {
        this.stories.forEach(story => {
            // Animate metrics on scroll
            const metrics = story.querySelectorAll('.metric-value');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateMetric(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            metrics.forEach(metric => observer.observe(metric));
        });
    }

    animateMetric(element) {
        const value = parseInt(element.dataset.value);
        const suffix = element.dataset.suffix || '';
        let current = 0;
        const increment = value / 30; // Animate over 30 steps
        const interval = setInterval(() => {
            current += increment;
            if (current >= value) {
                current = value;
                clearInterval(interval);
            }
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 50);
    }
}

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PricingCalculator();
    new FeatureComparison();
    new SuccessStories();
});
