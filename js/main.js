/**
 * StartupEssentials - Main JavaScript File
 * Handles core functionality like navigation, scroll effects, and mobile menu
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initScrollEffects();
    initContactForm();
});

/**
 * Mobile Menu Functionality
 * Toggles the mobile menu on small screens
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            body.classList.toggle('mobile-menu-active');
            
            // Change the icon based on menu state
            const icon = this.querySelector('i');
            if (body.classList.contains('mobile-menu-active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                body.classList.remove('mobile-menu-active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
}

/**
 * Scroll Effects
 * Handles header style changes on scroll and smooth scrolling
 */
function initScrollEffects() {
    const header = document.querySelector('header');
    
    // Change header style on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = targetPosition - headerHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Testimonial Slider
 * Allows users to navigate through testimonials
 */
function initTestimonialSlider() {
    const slider = document.querySelector('.testimonial-slider');
    const testimonials = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    const prevButton = document.querySelector('.prev-testimonial');
    const nextButton = document.querySelector('.next-testimonial');
    
    if (!slider || testimonials.length === 0) return;
    
    let currentIndex = 0;
    
    // Set up testimonial width and initial position
    function setupSlider() {
        const sliderWidth = slider.offsetWidth;
        testimonials.forEach(testimonial => {
            testimonial.style.minWidth = `${sliderWidth}px`;
        });
        
        // Initialize position
        updateSliderPosition();
    }
    
    // Update the slider position based on current index
    function updateSliderPosition() {
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Initialize slider setup
    setupSlider();
    
    // Handle window resize
    window.addEventListener('resize', setupSlider);
    
    // Next button click
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % testimonials.length;
            updateSliderPosition();
        });
    }
    
    // Previous button click
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
            updateSliderPosition();
        });
    }
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateSliderPosition();
        });
    });
}

/**
 * Contact Form Handling
 * Initializes form validation and submission
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            if (!name || !email || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Simulate form submission
            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            
            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = 'Sending...';
            
            // Simulate API call
            setTimeout(() => {
                // Reset form
                contactForm.reset();
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = 'Send Message';
                
                // Show success message
                alert('Thank you for your message! We will get back to you soon.');
            }, 1500);
        });
    }
}

// Initialize testimonial slider when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initTestimonialSlider();
});
