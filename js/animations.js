/**
 * StartupEssentials - Animations JavaScript
 * Handles animations and visual effects throughout the website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all animations
    initScrollAnimations();
    initCounterAnimations();
    initHoverEffects();
});

/**
 * Scroll Animations
 * Animates elements as they come into view during scrolling
 */
function initScrollAnimations() {
    // Get all elements to animate
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .contact-form, .contact-info, .section-header');
    
    // Create a new Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Add animation class when element is visible
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Once animation is applied, stop observing the element
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // Use viewport as the root
        rootMargin: '0px',
        threshold: 0.15 // When 15% of the element is visible
    });
    
    // Start observing each element
    animatedElements.forEach(element => {
        // Add the pre-animation class
        element.classList.add('animate-on-scroll');
        observer.observe(element);
    });
}

/**
 * Counter Animations
 * Animates number counters in the stats section
 */
function initCounterAnimations() {
    const stats = document.querySelectorAll('.stat h3');
    
    // Create an intersection observer for the stats section
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Get the target value from the text
                const target = parseInt(entry.target.textContent.replace(/,/g, '').replace(/\+/g, ''));
                const prefix = entry.target.textContent.indexOf('$') !== -1 ? '$' : '';
                const suffix = entry.target.textContent.indexOf('+') !== -1 ? '+' : '';
                
                // Animate from 0 to the target value
                animateCounter(entry.target, 0, target, prefix, suffix);
                
                // Stop observing after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    // Start observing each stat element
    stats.forEach(stat => {
        observer.observe(stat);
    });
}

/**
 * Animate Counter
 * Animates a counter from start to end value
 */
function animateCounter(element, start, end, prefix = '', suffix = '') {
    // Store original end value for formatter
    const originalEnd = end;
    
    // Determine if we need to format with commas
    const useCommas = element.textContent.indexOf(',') !== -1;
    
    // Duration and refresh rate
    const duration = 2000; // 2 seconds
    const frameRate = 30; // updates per second
    const totalFrames = duration / (1000 / frameRate);
    const increment = (end - start) / totalFrames;
    
    let currentCount = start;
    let currentFrame = 0;
    
    // Start the animation
    const counter = setInterval(() => {
        currentFrame++;
        currentCount += increment;
        
        // Format the display number
        let displayValue;
        if (useCommas) {
            displayValue = Math.round(currentCount).toLocaleString('en-US');
        } else {
            displayValue = Math.round(currentCount);
        }
        
        // Update the element text
        element.textContent = `${prefix}${displayValue}${suffix}`;
        
        // Stop the animation when we reach the end
        if (currentFrame === totalFrames) {
            clearInterval(counter);
            // Ensure the final number is exactly the target
            if (useCommas) {
                element.textContent = `${prefix}${originalEnd.toLocaleString('en-US')}${suffix}`;
            } else {
                element.textContent = `${prefix}${originalEnd}${suffix}`;
            }
        }
    }, 1000 / frameRate);
}

/**
 * Hover Effects
 * Adds interactive hover effects to elements
 */
function initHoverEffects() {
    // Feature card hover effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon');
            icon.style.transform = 'scale(1.1) translateY(-5px)';
            icon.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon');
            icon.style.transform = 'scale(1) translateY(0)';
        });
    });
    
    // Button hover effects for stronger feedback
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'var(--shadow-md)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
}

// Add CSS for animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }
    
    .animated {
        opacity: 1;
        transform: translateY(0);
    }
    
    .feature-icon {
        transition: transform 0.3s ease;
    }
    
    .btn {
        transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(-30px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
    
    .hero-content h1 {
        animation: fadeIn 1s ease-out;
    }
    
    .hero-content p {
        animation: fadeIn 1s ease-out 0.3s forwards;
        opacity: 0;
        animation-fill-mode: forwards;
    }
    
    .hero-buttons {
        animation: fadeIn 1s ease-out 0.6s forwards;
        opacity: 0;
        animation-fill-mode: forwards;
    }
    
    .hero-stats {
        animation: fadeIn 1s ease-out 0.9s forwards;
        opacity: 0;
        animation-fill-mode: forwards;
    }
    
    .cta {
        position: relative;
        overflow: hidden;
    }
    
    .cta::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, rgba(79, 70, 229, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%);
        opacity: 0;
        transition: opacity 0.5s ease;
        z-index: 0;
    }
    
    .cta:hover::before {
        opacity: 1;
    }
    
    .cta-content {
        position: relative;
        z-index: 1;
    }
    
    .btn-primary {
        position: relative;
        overflow: hidden;
    }
    
    .btn-primary::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: rgba(255, 255, 255, 0.5);
        opacity: 0;
        border-radius: 100%;
        transform: scale(1, 1) translate(-50%, -50%);
        transform-origin: 50% 50%;
    }
    
    .btn-primary:hover::after {
        animation: ripple 1s ease-out;
    }
    
    @keyframes ripple {
        0% {
            transform: scale(0, 0);
            opacity: 0.5;
        }
        100% {
            transform: scale(20, 20);
            opacity: 0;
        }
    }
`;

document.head.appendChild(animationStyles);
