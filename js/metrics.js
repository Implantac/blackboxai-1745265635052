// Animated Metrics
class MetricsAnimator {
    constructor() {
        this.metrics = document.querySelectorAll('.metric-value');
        this.setupObserver();
        this.setupHoverEffects();
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateValue(entry.target);
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.5 });

        this.metrics.forEach(metric => observer.observe(metric));
    }

    setupHoverEffects() {
        this.metrics.forEach(metric => {
            const container = metric.closest('.metric');
            if (container) {
                container.addEventListener('mouseenter', () => {
                    this.pulseAnimation(metric);
                });
            }
        });
    }

    animateValue(element) {
        const value = parseInt(element.dataset.value);
        const suffix = element.dataset.suffix || '';
        const duration = 2000; // 2 seconds
        const steps = 60;
        const stepValue = value / steps;
        let current = 0;
        let step = 0;

        const animate = () => {
            step++;
            current = stepValue * step;
            
            if (step <= steps) {
                element.textContent = `${Math.round(current)}${suffix}`;
                requestAnimationFrame(animate);
            } else {
                element.textContent = `${value}${suffix}`;
            }
        };

        requestAnimationFrame(animate);
    }

    pulseAnimation(element) {
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }
}

// Enhanced Price Calculator
class EnhancedPriceCalculator {
    constructor() {
        this.basePrice = 199;
        this.userMultiplier = 50;
        this.moduleMultiplier = 100;
        this.setupElements();
        this.setupEventListeners();
        this.updateUI();
    }

    setupElements() {
        this.userSlider = document.getElementById('user-count');
        this.userDisplay = document.getElementById('user-count-display');
        this.priceDisplay = document.getElementById('calculated-price');
        this.moduleCheckboxes = document.querySelectorAll('.module-checkbox');
        this.recommendationDisplay = document.getElementById('plan-recommendation');
    }

    setupEventListeners() {
        if (this.userSlider) {
            this.userSlider.addEventListener('input', () => this.updateUI());
            this.userSlider.addEventListener('change', () => this.showRecommendation());
        }

        this.moduleCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateUI();
                this.showRecommendation();
            });
        });
    }

    calculatePrice() {
        const userCount = parseInt(this.userSlider?.value || 1);
        const selectedModules = document.querySelectorAll('.module-checkbox:checked').length;
        
        const userCost = Math.floor(userCount / 5) * this.userMultiplier;
        const moduleCost = selectedModules * this.moduleMultiplier;
        
        return this.basePrice + userCost + moduleCost;
    }

    updateUI() {
        const price = this.calculatePrice();
        
        if (this.priceDisplay) {
            // Animate price change
            const currentPrice = parseInt(this.priceDisplay.textContent.replace(/[^0-9]/g, ''));
            this.animatePrice(currentPrice, price);
        }
        
        if (this.userDisplay) {
            this.userDisplay.textContent = this.userSlider.value;
        }

        // Update progress bar
        const progress = (this.userSlider.value - this.userSlider.min) / 
                        (this.userSlider.max - this.userSlider.min) * 100;
        this.userSlider.style.background = `linear-gradient(to right, #ff9800 ${progress}%, #e0e0e0 ${progress}%)`;
    }

    animatePrice(start, end) {
        const duration = 500; // milliseconds
        const steps = 20;
        const increment = (end - start) / steps;
        let current = start;
        let step = 0;

        const animate = () => {
            step++;
            current += increment;
            
            if (step <= steps) {
                this.priceDisplay.textContent = current.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
                requestAnimationFrame(animate);
            } else {
                this.priceDisplay.textContent = end.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
            }
        };

        requestAnimationFrame(animate);
    }

    showRecommendation() {
        const userCount = parseInt(this.userSlider.value);
        const moduleCount = document.querySelectorAll('.module-checkbox:checked').length;
        let plan = 'Básico';
        
        if (userCount > 50 || moduleCount > 2) {
            plan = 'Enterprise';
        } else if (userCount > 20 || moduleCount > 1) {
            plan = 'Profissional';
        }

        if (this.recommendationDisplay) {
            this.recommendationDisplay.textContent = `Recomendamos o plano ${plan} para seu perfil de uso.`;
            this.recommendationDisplay.style.display = 'block';
        }
    }
}

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MetricsAnimator();
    new EnhancedPriceCalculator();
});
