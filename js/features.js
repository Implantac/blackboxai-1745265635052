// Animated Counters
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const counter = setInterval(() => {
        start += increment;
        element.textContent = Math.floor(start);
        if (start >= target) {
            element.textContent = target;
            clearInterval(counter);
        }
    }, 16);
}

// Intersection Observer for animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.classList.contains('counter-value')) {
                animateCounter(entry.target, parseInt(entry.target.dataset.target));
            }
        }
    });
}, observerOptions);

// ROI Calculator
class ROICalculator {
    constructor() {
        this.form = document.getElementById('roi-calculator');
        this.resultDiv = document.getElementById('roi-result');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateROI();
            });
        }
    }

    calculateROI() {
        const currentCosts = parseFloat(this.form.querySelector('#current-costs').value) || 0;
        const employees = parseInt(this.form.querySelector('#employees').value) || 0;
        const hoursPerWeek = parseInt(this.form.querySelector('#hours-per-week').value) || 0;

        // Simple ROI calculation (customize as needed)
        const hourlyRate = 50; // Average hourly cost
        const weeklyHoursSaved = hoursPerWeek * 0.2; // Assume 20% time savings
        const annualSavings = weeklyHoursSaved * hourlyRate * 52 * employees;
        const implementationCost = 10000; // Example fixed cost
        const roi = ((annualSavings - implementationCost) / implementationCost) * 100;

        this.displayResults(annualSavings, roi);
    }

    displayResults(annualSavings, roi) {
        if (this.resultDiv) {
            this.resultDiv.innerHTML = `
                <h3 class="text-2xl font-bold mb-4">Resultados Estimados</h3>
                <p class="mb-2">Economia Anual Estimada: R$ ${annualSavings.toLocaleString()}</p>
                <p>ROI Estimado: ${roi.toFixed(1)}%</p>
            `;
            this.resultDiv.classList.remove('hidden');
        }
    }
}

// Testimonials Carousel
class TestimonialsCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.testimonial-slide');
        this.setupCarousel();
    }

    setupCarousel() {
        if (this.slides.length > 0) {
            setInterval(() => this.nextSlide(), 5000);
            this.showSlide(0);
        }
    }

    showSlide(index) {
        this.slides.forEach(slide => slide.classList.add('hidden'));
        this.slides[index].classList.remove('hidden');
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(this.currentSlide);
    }
}

// WhatsApp Integration
function setupWhatsAppButton() {
    const button = document.querySelector('.whatsapp-button');
    if (button) {
        button.addEventListener('click', () => {
            const phoneNumber = '5511999999999'; // Replace with actual number
            const message = 'Olá! Gostaria de saber mais sobre a USE SISTEMAS.';
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
}

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Intersection Observer
    document.querySelectorAll('.fade-in, .counter-value').forEach(el => observer.observe(el));

    // Initialize ROI Calculator
    new ROICalculator();

    // Initialize Testimonials Carousel
    new TestimonialsCarousel();

    // Setup WhatsApp Button
    setupWhatsAppButton();

    // Add parallax effect to sections with parallax class
    window.addEventListener('scroll', () => {
        document.querySelectorAll('.parallax').forEach(element => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.3;
            element.style.backgroundPositionY = `${rate}px`;
        });
    });
});
