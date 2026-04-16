# Form System Integration Guide

## Overview
This guide shows how to integrate the dynamic form system into other parts of your website.

## Quick Integration

### 1. Basic Form Usage
```jsx
import FormBuilder from './Jay_2/FormBuilder';
import formSubmissionService from './Jay_2/services/formSubmissionService';

// Simple form integration
function ContactPage() {
  const handleSubmit = async (formData) => {
    try {
      const result = await formSubmissionService.submitForm(formData, formSchema, {
        formName: 'Contact Form',
        formType: 'builder',
        source: 'contact-page'
      });
      console.log('Form submitted:', result);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <div>
      <h1>Contact Us</h1>
      <FormBuilder
        schema={contactFormSchema}
        formTheme="modern"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

### 2. Using Pre-built Forms
```jsx
import fileFormManager from './Jay_2/services/fileFormManager';
import FormBuilder from './Jay_2/FormBuilder';

function EngineeringProjectPage() {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const loadForm = async () => {
      const form = await fileFormManager.getFormByCustomId('engineering_project_example');
      setFormData(form);
    };
    loadForm();
  }, []);

  if (!formData) return <div>Loading...</div>;

  return (
    <FormBuilder
      schema={formData.schema.sections}
      formTheme={formData.formTheme}
      onSubmit={handleSubmit}
    />
  );
}
```

### 3. Step-by-Step Forms (Wizard)
```jsx
import FormWizard from './Jay_2/components/FormWizard';

function RegistrationPage() {
  return (
    <FormWizard
      schema={registrationSchema}
      formTheme="modern"
      onSubmit={handleSubmit}
    />
  );
}
```

## Available Pre-built Forms

### Engineering Project Form
- **ID**: `engineering_project_example`
- **Type**: Complex form with dynamic dependencies
- **Features**: 
  - Industry selection with dynamic categories
  - Conditional sections
  - Multi-select fields
  - Project stage management

### Contact Forms
- **ID**: `contact_form` - Basic contact form
- **ID**: `contact_form_enhanced` - Advanced contact form with file upload

### Vendor Registration
- **ID**: `vendor_onboarding` - Simple vendor registration
- **ID**: `professional_vendor_registration` - Professional vendor form
- **ID**: `corporate_vendor_registration` - Corporate vendor registration

### Business Forms
- **ID**: `product_listing` - Product listing form
- **ID**: `job_application` - Job application form
- **ID**: `event_registration` - Event registration form

## Form Schema Structure

```javascript
const formSchema = {
  formType: "multi-section",
  formTheme: "modern",
  sections: [
    {
      title: "Section Title",
      fields: [
        {
          name: "fieldName",
          label: "Field Label",
          type: "text|email|select|multiselect|file|etc",
          required: true,
          placeholder: "Enter value",
          options: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" }
          ]
        }
      ]
    }
  ]
};
```

## Field Types Available

### Basic Fields
- `text` - Text input
- `email` - Email input
- `password` - Password input
- `number` - Number input
- `textarea` - Multi-line text
- `select` - Dropdown selection
- `multiselect` - Multiple selection
- `checkbox` - Checkbox
- `radio` - Radio buttons
- `toggle` - Toggle switch

### Advanced Fields
- `file` - File upload
- `date` - Date picker
- `time` - Time picker
- `signature` - Digital signature
- `rating` - Rating input
- `color` - Color picker
- `currency` - Currency input
- `percentage` - Percentage input
- `phone` - Phone number
- `address` - Address input
- `url` - URL input
- `calculated` - Calculated field
- `repeater` - Repeatable fields
- `range` - Range slider

## Conditional Logic

```javascript
{
  name: "subcategories",
  label: "Subcategories",
  type: "multiselect",
  condition: {
    field: "categories",
    operator: "isNotEmpty"
  },
  getOptions: `
    const categories = formData.categories || [];
    if (categories.length === 0) return [];
    // Return dynamic options based on selected categories
    return getSubcategoriesForCategories(categories);
  `
}
```

## API Integration

### Form Submission Service
```javascript
import formSubmissionService from './Jay_2/services/formSubmissionService';

const result = await formSubmissionService.submitForm(
  formData,           // Form data object
  formSchema,         // Form schema
  {
    formName: 'My Form',
    formType: 'builder',
    source: 'my-page'
  }
);
```

### File Upload Service
```javascript
import fileFormManager from './Jay_2/services/fileFormManager';

// Get all available forms
const forms = await fileFormManager.getAllForms();

// Get specific form by ID
const form = await fileFormManager.getFormByCustomId('form_id');
```

## Styling and Themes

### Available Themes
- `modern` - Clean, modern design
- `classic` - Traditional form design
- `minimal` - Minimalist design

### Custom Styling
```css
/* Override form styles */
.form-builder {
  --primary-color: #3b82f6;
  --border-radius: 8px;
  --font-family: 'Inter', sans-serif;
}
```

## Error Handling

```javascript
import ErrorBoundary from './Jay_2/components/ErrorBoundary';

function MyPage() {
  return (
    <ErrorBoundary>
      <FormBuilder
        schema={formSchema}
        onSubmit={handleSubmit}
      />
    </ErrorBoundary>
  );
}
```

## Best Practices

1. **Always wrap forms in ErrorBoundary** for better error handling
2. **Use descriptive field names** for better data management
3. **Implement proper validation** using the built-in validation system
4. **Handle loading states** when fetching form data
5. **Provide user feedback** for form submissions
6. **Test forms thoroughly** before deployment

## Examples

### Contact Form Integration
```jsx
// pages/contact.jsx
import FormBuilder from '../Jay_2/FormBuilder';
import fileFormManager from '../Jay_2/services/fileFormManager';

export default function ContactPage() {
  const [contactForm, setContactForm] = useState(null);

  useEffect(() => {
    const loadContactForm = async () => {
      const form = await fileFormManager.getFormByCustomId('contact_form_enhanced');
      setContactForm(form);
    };
    loadContactForm();
  }, []);

  const handleSubmit = async (data) => {
    // Handle form submission
    console.log('Contact form submitted:', data);
  };

  if (!contactForm) return <div>Loading contact form...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
      <FormBuilder
        schema={contactForm.schema.sections}
        formTheme="modern"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

### Vendor Registration Integration
```jsx
// pages/vendor-registration.jsx
import FormWizard from '../Jay_2/components/FormWizard';
import fileFormManager from '../Jay_2/services/fileFormManager';

export default function VendorRegistrationPage() {
  const [vendorForm, setVendorForm] = useState(null);

  useEffect(() => {
    const loadVendorForm = async () => {
      const form = await fileFormManager.getFormByCustomId('professional_vendor_registration');
      setVendorForm(form);
    };
    loadVendorForm();
  }, []);

  const handleSubmit = async (data) => {
    // Handle vendor registration
    console.log('Vendor registration:', data);
  };

  if (!vendorForm) return <div>Loading registration form...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Vendor Registration</h1>
      <FormWizard
        schema={vendorForm.schema.sections}
        formTheme="modern"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Form not loading**: Check if the form ID exists in the data directory
2. **Submission errors**: Verify API endpoints are configured correctly
3. **Styling issues**: Ensure CSS files are properly imported
4. **Validation errors**: Check field validation rules in the schema

### Debug Mode
Enable debug mode to see detailed error messages:
```javascript
// Add to your component
const DEBUG = process.env.NODE_ENV === 'development';
```

This integration guide provides everything you need to use the form system throughout your website. The system is designed to be flexible and reusable across different pages and use cases.
