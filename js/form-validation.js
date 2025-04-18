/**
 * StartupEssentials - Form Validation
 * Handles form validation and submission for contact forms
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the contact form
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        // Add form validation logic
        setupFormValidation(contactForm);
    }
});

/**
 * Setup Form Validation
 * Configures validation for the specified form
 * @param {HTMLFormElement} form - The form to validate
 */
function setupFormValidation(form) {
    // Get all input fields
    const inputFields = form.querySelectorAll('input, textarea, select');
    
    // Setup validation for each field
    inputFields.forEach(field => {
        // Add blur event listener to validate when user leaves field
        field.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Add input event listener to clear error when user starts typing
        field.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                
                // Find and remove error message
                const errorElement = this.parentElement.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        });
    });
    
    // Add submit event listener
    form.addEventListener('submit', function(e) {
        // Prevent default form submission
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        
        inputFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        // If all fields are valid, submit the form
        if (isValid) {
            submitForm(form);
        }
    });
}

/**
 * Validate Field
 * Validates a single form field based on its type and attributes
 * @param {HTMLElement} field - The field to validate
 * @returns {boolean} - Whether the field is valid
 */
function validateField(field) {
    // Get field value
    const value = field.value.trim();
    
    // Check if field is required
    const isRequired = field.hasAttribute('required');
    
    // Clear previous error
    const errorElement = field.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
    
    field.classList.remove('error');
    
    // If field is required and empty
    if (isRequired && value === '') {
        showError(field, 'This field is required');
        return false;
    }
    
    // If field is not empty, validate based on type
    if (value !== '') {
        // Email validation
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Phone validation (if field has a phone pattern)
        if (field.id === 'phone' || field.name === 'phone') {
            const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;
            if (!phoneRegex.test(value)) {
                showError(field, 'Please enter a valid phone number');
                return false;
            }
        }
        
        // Name validation (only letters and spaces)
        if (field.id === 'name' || field.name === 'name') {
            const nameRegex = /^[A-Za-z\s]{2,}$/;
            if (!nameRegex.test(value)) {
                showError(field, 'Please enter a valid name (letters only)');
                return false;
            }
        }
        
        // Message minimum length
        if (field.id === 'message' || field.name === 'message') {
            if (value.length < 10) {
                showError(field, 'Message must be at least 10 characters');
                return false;
            }
        }
        
        // Select field validation
        if (field.tagName === 'SELECT' && field.value === '') {
            showError(field, 'Please select an option');
            return false;
        }
    }
    
    // Field is valid
    return true;
}

/**
 * Show Error
 * Displays an error message for a form field
 * @param {HTMLElement} field - The field with the error
 * @param {string} message - The error message to display
 */
function showError(field, message) {
    // Add error class to field
    field.classList.add('error');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Add error message after the field
    field.parentElement.appendChild(errorElement);
}

/**
 * Submit Form
 * Handles the form submission process
 * @param {HTMLFormElement} form - The form to submit
 */
function submitForm(form) {
    // Get the submit button
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable button and show loading state
    submitButton.disabled = true;
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    
    // Create form data object
    const formData = new FormData(form);
    const formDataObject = {};
    formData.forEach((value, key) => {
        formDataObject[key] = value;
    });
    
    // Simulate API request
    setTimeout(() => {
        // Normally, you would send the form data to a server using fetch or XHR
        // fetch('/api/contact', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(formDataObject),
        // })
        
        // Show success message
        showFormSuccess(form);
        
        // Reset form
        form.reset();
        
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }, 1500); // Simulate network delay
}

/**
 * Show Form Success
 * Displays a success message after form submission
 * @param {HTMLFormElement} form - The form that was submitted
 */
function showFormSuccess(form) {
    // Check if a success message already exists
    const existingMessage = form.parentElement.querySelector('.form-success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create success message element
    const successElement = document.createElement('div');
    successElement.className = 'form-success-message';
    successElement.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="success-text">
            <h4>Thank you for reaching out!</h4>
            <p>Your message has been sent successfully. We'll get back to you soon.</p>
        </div>
    `;
    
    // Insert success message before the form
    form.parentElement.insertBefore(successElement, form);
    
    // Scroll to success message
    successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove success message after a delay
    setTimeout(() => {
        successElement.classList.add('fade-out');
        setTimeout(() => {
            successElement.remove();
        }, 500);
    }, 5000);
}

// Add CSS styles for form validation
const formStyles = document.createElement('style');
formStyles.textContent = `
    .form-group {
        position: relative;
        margin-bottom: 1.5rem;
    }
    
    .error {
        border-color: var(--danger-color) !important;
    }
    
    .error-message {
        color: var(--danger-color);
        font-size: 0.825rem;
        margin-top: 0.25rem;
        animation: slideIn 0.3s ease-in-out;
    }
    
    .form-success-message {
        display: flex;
        align-items: center;
        background-color: var(--secondary-light);
        border-radius: var(--radius-md);
        padding: 1rem;
        margin-bottom: 1.5rem;
        animation: fadeIn 0.5s ease-in-out;
    }
    
    .form-success-message.fade-out {
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
    
    .success-icon {
        font-size: 2rem;
        color: var(--secondary-color);
        margin-right: 1rem;
    }
    
    .success-text h4 {
        margin-bottom: 0.25rem;
        color: var(--dark-color);
    }
    
    .success-text p {
        margin-bottom: 0;
        color: var(--dark-medium);
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

document.head.appendChild(formStyles);
