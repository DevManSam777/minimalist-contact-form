class ContactForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.googleFontLoaded = false;
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
    // Render the initial structure immediately
    this.render(); // This applies initial styles with current fontFamily (might be fallback)

    // Load Google Font and then update styles
    this.loadGoogleFont().then(() => {
      // After Google Font is loaded and googleFontLoaded is true,
      // call updateStyles to re-render CSS with the new font.
      this.updateStyles();
    });

    this.loadCleavejs().then(() => {
      this.initializePhoneFormatting();
    });
    this.setupEventListeners();
    this.updateTheme();
    this.setupThemeWatchers();
  }

  disconnectedCallback() {
    if (this.themeMediaQuery) {
      this.themeMediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "theme") {
      this.updateTheme();
    } else if (name === "google-font") {
      // When google-font changes, reset the loaded flag and re-load/update
      this.googleFontLoaded = false; // Important: Reset the flag
      this.loadGoogleFont().then(() => {
        this.updateStyles(); // Re-apply styles after the new font loads
      });
    } else {
      // Re-render styles for other attribute changes
      this.updateStyles();
    }
  }

  loadGoogleFont() {
    return new Promise((resolve) => {
      const googleFont = this.getAttribute('google-font');

      if (!googleFont) {
        this.googleFontLoaded = false;
        resolve();
        return;
      }

      const existingLink = document.head.querySelector(`link[href*="fonts.googleapis.com"][href*="${googleFont.replace(/\s+/g, '+')}"]`);
      if (existingLink) {
        this.googleFontLoaded = true;
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${googleFont.replace(/\s+/g, '+')}:wght@400;500;600&display=swap`;

      link.onload = () => {
        this.googleFontLoaded = true;
        resolve();
      };

      link.onerror = () => {
        console.warn(`Failed to load Google Font: ${googleFont}`);
        this.googleFontLoaded = false;
        resolve();
      };

      document.head.appendChild(link);
    });
  }

  setupThemeWatchers() {
    this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.handleSystemThemeChange = () => {
      if (!this.getAttribute('theme')) {
        this.updateTheme();
      }
    };
    this.themeMediaQuery.addEventListener('change', this.handleSystemThemeChange);

    this.themeObserver = new MutationObserver(() => {
      if (!this.getAttribute('theme')) {
        this.updateTheme();
      }
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
  }

  updateTheme() {
    const container = this.shadowRoot.querySelector(".contact-form");
    if (!container) return;

    const explicitTheme = this.getAttribute("theme");

    let isDark = false;

    if (explicitTheme) {
      isDark = explicitTheme === "dark";
    } else {
      isDark = this.detectDarkMode();
    }

    if (isDark) {
      container.classList.add("dark-mode");
    } else {
      container.classList.remove("dark-mode");
    }
  }

  detectDarkMode() {
    const html = document.documentElement;
    const body = document.body;

    const dataTheme = html.getAttribute('data-theme') || body.getAttribute('data-theme');
    if (dataTheme === 'dark') return true;
    if (dataTheme === 'light') return false;

    if (html.classList.contains('dark') || body.classList.contains('dark')) return true;
    if (html.classList.contains('dark-mode') || body.classList.contains('dark-mode')) return true;
    if (html.classList.contains('theme-dark') || body.classList.contains('theme-dark')) return true;

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  getFontFamily() {
    const googleFont = this.getAttribute('google-font');
    const customFontFamily = this.getAttribute('font-family');

    if (googleFont && this.googleFontLoaded) {
      return `"${googleFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    } else if (customFontFamily) {
      return customFontFamily;
    } else {
      return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  }

  get styles() {
    const primaryColor = this.getAttribute('primary-color') || '#3b82f6';
    const backgroundColor = this.getAttribute('background-color') || '#ffffff';
    const textColor = this.getAttribute('text-color') || '#374151';
    const borderColor = this.getAttribute('border-color') || '#d1d5db';
    const borderRadius = this.getAttribute('border-radius') || '6px';
    const fontFamily = this.getFontFamily();
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
        /* Updated: Softer box shadow values */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: ${fontFamily};
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: ${textColor};
        font-family: ${fontFamily};
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
        font-family: ${fontFamily};
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
        font-family: ${fontFamily};
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
        font-family: ${fontFamily};
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

      .dark-mode .success {
        background: rgba(34, 197, 94, 0.1);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }

      .dark-mode .error {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
    `;
  }

  updateStyles() {
    const styleTag = this.shadowRoot.querySelector('style');
    if (styleTag) {
      styleTag.textContent = this.styles;
    }
  }

  render() {
    if (!this.shadowRoot.querySelector('style')) {
      const styleTag = document.createElement('style');
      this.shadowRoot.appendChild(styleTag);
    }

    this.shadowRoot.innerHTML = `
      ${this.shadowRoot.querySelector('style').outerHTML}
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
          <input type="tel" id="phone" name="phone"> </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit" class="submit-btn">Send Message</button>
      </form>
    `;
    this.updateStyles();
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');

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
    // Only select required inputs for initial validation
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

    // Check required fields (phone is no longer required here)
    if (field.required && !value) {
      this.showError(field, 'This field is required');
      return false;
    }

    if ((field.name === 'firstName' || field.name === 'lastName') && value && value.length < 1) {
      this.showError(field, 'Name must be at least 1 character');
      return false;
    }

    if (field.name === 'message' && value && value.length < 1) {
      this.showError(field, 'Message must be at least 1 character');
      return false;
    }

    if (field.type === 'email' && value) {
      if (!this.isValidEmail(value)) {
        this.showError(field, 'Please enter a valid email address');
        return false;
      }
    }

    // Phone validation only if a value is provided
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
    // This regex will now only apply if a phone number IS entered and needs validation
    return /^\d{3}-\d{3}-\d{4}$/.test(phone);
  }

  validateForm() {
    const form = this.shadowRoot.querySelector('form');
    // Select only explicitly required inputs for form-wide validation
    const inputsToValidate = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputsToValidate.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    // Manually validate phone if a value is present, even though it's not required
    const phoneInput = form.querySelector('#phone');
    if (phoneInput && phoneInput.value.trim() !== '') {
        if (!this.validateField(phoneInput)) {
            isValid = false;
        }
    }

    return isValid;
  }

  async handleSubmit() {
    const endpoint = this.getAttribute('endpoint');
    if (!endpoint) {
      this.showMessage('No endpoint specified', 'error');
      return;
    }

    if (!this.validateForm()) {
      this.showMessage('Please fix the errors above', 'error');
      return;
    }

    const form = this.shadowRoot.querySelector('form');
    const formData = new FormData(form);
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      // Set phone to '000-000-0000' if it's empty
      phone: formData.get('phone') || '000-000-0000',
      message: formData.get('message'),
      businessName: `${formData.get('firstName')} ${formData.get('lastName')}`,
      businessPhone: '',
      businessPhoneExt: '',
      businessEmail: '',
      businessServices: '',
      phoneExt: '',
      textNumber: '',
      preferredContact: 'email',
      serviceDesired: 'Web Development',
      hasWebsite: 'no',
      websiteAddress: '',
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
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.classList.remove('valid', 'invalid');
          this.removeError(input); // Also remove any error messages
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
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
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