class ContactForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return [
      'endpoint', 'theme', 'primary-color', 'background-color', 'text-color', 'border-color', 
      'border-radius', 'font-family', 'font-size', 'google-font', 'success-message', 
      'error-message', 'dark-primary-color', 'dark-background-color', 
      'dark-text-color', 'dark-border-color'
    ];
  }

  connectedCallback() {
    this.render();
    this.loadCleavejs().then(() => {
      this.initializePhoneFormatting();
    });
    this.setupEventListeners();
    this.updateTheme();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "theme") {
      this.updateTheme();
    }
  }

  updateTheme() {
    const container = this.shadowRoot.querySelector(".contact-form");
    if (!container) return;

    const explicitTheme = this.getAttribute("theme");
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (explicitTheme === "dark" || (explicitTheme !== "light" && prefersDarkScheme)) {
      container.classList.add("dark-mode");
    } else {
      container.classList.remove("dark-mode");
    }
  }

  get styles() {
    const primaryColor = this.getAttribute('primary-color') || '#3b82f6';
    const backgroundColor = this.getAttribute('background-color') || '#ffffff';
    const textColor = this.getAttribute('text-color') || '#374151';
    const borderColor = this.getAttribute('border-color') || '#d1d5db';
    const borderRadius = this.getAttribute('border-radius') || '6px';
    const fontFamily = this.getAttribute('font-family') || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const fontSize = this.getAttribute('font-size') || '14px';

    const darkPrimaryColor = this.getAttribute('dark-primary-color') || '#60a5fa';
    const darkBackgroundColor = this.getAttribute('dark-background-color') || '#1f2937';
    const darkTextColor = this.getAttribute('dark-text-color') || '#f9fafb';
    const darkBorderColor = this.getAttribute('dark-border-color') || '#4b5563';

    return `
      :host {
        display: block;
        font-family: ${fontFamily};
        font-size: ${fontSize};
      }

      .contact-form {
        background: ${backgroundColor};
        padding: 2rem;
        border-radius: ${borderRadius};
        max-width: 500px;
        margin: 0 auto;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: ${textColor};
      }

      input, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid ${borderColor};
        border-radius: ${borderRadius};
        font-size: ${fontSize};
        font-family: ${fontFamily};
        color: ${textColor};
        background: ${backgroundColor};
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      input:focus, textarea:focus {
        outline: none;
        border-color: ${primaryColor};
      }

      textarea {
        resize: vertical;
        min-height: 120px;
      }

      .name-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .submit-btn {
        background: ${primaryColor};
        color: white;
        border: none;
        padding: 0.875rem 2rem;
        border-radius: ${borderRadius};
        font-size: ${fontSize};
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s ease;
        width: 100%;
      }

      .submit-btn:hover:not(:disabled) {
        opacity: 0.9;
      }

      .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .message {
        padding: 1rem;
        border-radius: ${borderRadius};
        margin-bottom: 1rem;
        text-align: center;
        font-weight: 500;
      }

      .success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      .error {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fca5a5;
      }

      .invalid {
        border-color: #dc2626 !important;
        background-color: rgba(220, 38, 38, 0.05);
      }

      .valid {
        border-color: #16a34a;
        background-color: rgba(22, 163, 74, 0.05);
      }

      .error-message {
        color: #dc2626;
        font-size: 12px;
        margin-top: 4px;
        font-weight: 500;
      }

      /* Dark Mode */
      .contact-form.dark-mode {
        background: ${darkBackgroundColor};
        color: ${darkTextColor};
      }

      .dark-mode label {
        color: ${darkTextColor};
      }

      .dark-mode input,
      .dark-mode textarea {
        background: ${darkBackgroundColor};
        color: ${darkTextColor};
        border-color: ${darkBorderColor};
      }

      .dark-mode input:focus,
      .dark-mode textarea:focus {
        border-color: ${darkPrimaryColor};
      }

      .dark-mode .submit-btn {
        background: ${darkPrimaryColor};
      }
    `;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles}</style>
      <form class="contact-form">
        <div id="message-container"></div>
        <div class="name-row">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input type="text" id="firstName" name="firstName" required>
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" name="lastName" required>
          </div>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="phone">Phone</label>
          <input type="tel" id="phone" name="phone" required>
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit" class="submit-btn">Send Message</button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');
    
    // Initialize validation
    this.initializeValidation();
    
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  loadCleavejs() {
    return new Promise((resolve, reject) => {
      if (window.Cleave) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/cleave.js@1.6.0/dist/cleave.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Cleave.js'));
      document.head.appendChild(script);
    });
  }

  initializePhoneFormatting() {
    const phoneInput = this.shadowRoot.querySelector('#phone');
    
    if (window.Cleave && phoneInput) {
      new window.Cleave(phoneInput, {
        numericOnly: true,
        blocks: [3, 3, 4],
        delimiters: ['-', '-'],
      });
    }
  }

  initializeValidation() {
    const form = this.shadowRoot.querySelector('form');
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) {
          this.validateField(input);
        }
      });
    });
  }

  validateField(field) {
    this.removeError(field);
    
    const value = field.value.trim();
    
    // Check required fields
    if (field.required && !value) {
      this.showError(field, 'This field is required');
      return false;
    }
    
    // Name validation (at least 1 character)
    if ((field.name === 'firstName' || field.name === 'lastName') && value && value.length < 1) {
      this.showError(field, 'Name must be at least 1 character');
      return false;
    }
    
    // Message validation (at least 1 character) 
    if (field.name === 'message' && value && value.length < 1) {
      this.showError(field, 'Message must be at least 1 character');
      return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
      if (!this.isValidEmail(value)) {
        this.showError(field, 'Please enter a valid email address');
        return false;
      }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
      if (!this.isValidPhone(value)) {
        this.showError(field, 'Please enter a valid phone number (xxx-xxx-xxxx)');
        return false;
      }
    }
    
    field.classList.add('valid');
    field.classList.remove('invalid');
    return true;
  }

  showError(input, message) {
    this.removeError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    input.parentElement.appendChild(errorDiv);
    
    input.classList.add('invalid');
    input.classList.remove('valid');
  }

  removeError(input) {
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) {
      errorDiv.remove();
    }
    input.classList.remove('invalid');
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    return /^\d{3}-\d{3}-\d{4}$/.test(phone);
  }

  validateForm() {
    const form = this.shadowRoot.querySelector('form');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  async handleSubmit() {
    const endpoint = this.getAttribute('endpoint');
    if (!endpoint) {
      this.showMessage('No endpoint specified', 'error');
      return;
    }

    // Validate form before submitting
    if (!this.validateForm()) {
      this.showMessage('Please fix the errors above', 'error');
      return;
    }

    const form = this.shadowRoot.querySelector('form');
    const formData = new FormData(form);
    
    // Send data in the format your email system expects
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'), 
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      
      // DevLeads integration fields - auto-generated
      businessName: `${formData.get('firstName')} ${formData.get('lastName')}`,
      businessPhone: '',
      businessPhoneExt: '',
      businessEmail: '',
      businessServices: '',
      phoneExt: '',
      textNumber: '',
      
      // DevLeads integration fields - service details
      preferredContact: 'email',
      serviceDesired: 'Web Development',
      hasWebsite: 'no',
      websiteAddress: '',
      
      // DevLeads integration fields - billing address (required for email template)
      billingStreet: 'N/A',
      billingAptUnit: '',
      billingCity: 'N/A', 
      billingState: 'N/A',
      billingZipCode: '00000',
      billingCountry: 'USA',
      billingAddress: {
        street: 'N/A',
        aptUnit: '',
        city: 'N/A',
        state: 'N/A',
        zipCode: '00000',
        country: 'USA'
      },
      
      // DevLeads integration fields - form submission flag
      isFormSubmission: true
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const successMessage = this.getAttribute('success-message') || 'Message sent successfully!';
        this.showMessage(successMessage, 'success');
        form.reset();
        // Clear validation states after reset
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.classList.remove('valid', 'invalid');
        });
      } else {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Full error:', error);
      const errorMessage = this.getAttribute('error-message') || 'Failed to send message. Please try again.';
      this.showMessage(errorMessage, 'error');
    }
  }

  showMessage(text, type) {
    const container = this.shadowRoot.querySelector('#message-container');
    container.innerHTML = `<div class="message ${type}">${text}</div>`;
    
    if (type === 'success') {
      setTimeout(() => {
        container.innerHTML = '';
      }, 5000);
    }
  }
}

customElements.define('contact-form', ContactForm);