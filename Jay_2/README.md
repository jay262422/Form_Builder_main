# Dynamic Form Builder

A powerful, flexible, and reusable form builder system for React applications. Create complex forms with validation, conditional fields, dynamic options, and more using a simple schema-based approach.

## Features

- ✅ **Visual Form Builder** - Drag-and-drop interface for non-technical users
- ✅ **Form Management System** - Complete form lifecycle management
- ✅ **Schema-driven forms** - Define forms using JSON-like schemas
- ✅ **Real-time validation** - Built-in and custom validation rules
- ✅ **Conditional fields** - Show/hide fields based on other field values
- ✅ **Dynamic options** - Options that change based on form data
- ✅ **Multiple field types** - Text, select, checkbox, file upload, and more
- ✅ **File uploads** - Drag-and-drop file uploads with validation
- ✅ **Form Wizard** - Step-by-step form experience with progress tracking
- ✅ **Form Cards** - Modern card-based layouts for better UX
- ✅ **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- ✅ **Customizable styling** - Tailwind CSS classes for easy customization
- ✅ **TypeScript ready** - Full TypeScript support
- ✅ **Extensible** - Easy to add new field types and validation rules

## Current Application (June 2026)

The live app is orchestrated by `FormManagerDemo` and the home page (`app/page.jsx`):

| Area | Component / route | Notes |
|------|-------------------|-------|
| Form list & settings | `FormManager.jsx` | Create, edit, duplicate, versions |
| **Form Builder** (primary) | `VisualFormBuilder.jsx` | Default Create/Edit — Build \| Preview, Structure panel |
| **Builder Lab** (temporary) | `VisualFormBuilderNext.jsx` | Alternate UI until platform themes merge |
| List preview | `FormManagerDemo` → `preview` view | Full-page preview of **saved** form |
| Submissions | `SubmissionManager.jsx` | List, export, basic analytics charts |
| Field Options (dev) | `FieldOptionsTester.jsx` | Tests `/api/field-options` API |
| Theme Editor (dev) | `ThemeEditorDemo.jsx` | Per-form look & layout |

Static layout exploration HTML lives in `design-reference/` (removed from app routes).

## Quick Start

### 1. Using Visual Form Builder (Recommended)

The **Form Builder** (`VisualFormBuilder`) is the primary drag-and-drop editor in Form Manager. **Builder Lab** (`VisualFormBuilderNext`) is a temporary alternate UI.

```jsx
import VisualFormBuilder from './components/VisualFormBuilder';

function MyFormBuilder() {
  const [schema, setSchema] = useState([]);

  return (
    <VisualFormBuilder
      initialSchema={schema}
      onSchemaChange={setSchema}
      isStandalone={true}
    />
  );
}
```

### 2. Using Form Manager (Complete Solution)

For a complete form management system with editing, templates, and preview:

```jsx
import FormManagerDemo from './FormManagerDemo';

function FormManagementPage() {
  return <FormManagerDemo />;
}
```

### 3. Programmatic Form Creation

You can also create forms programmatically using schemas:

```jsx
import FormBuilder from './components/FormBuilder';

const formSchema = [
  {
    title: "Personal Information",
    fields: [
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        required: true,
        validation: {
          minLength: 2,
          maxLength: 50
        }
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true
      }
    ]
  }
];

function MyForm() {
  const handleSubmit = (formData) => {
    console.log('Form submitted:', formData);
  };

  return (
    <FormBuilder
      schema={formSchema}
      onSubmit={handleSubmit}
    />
  );
}
```

### 2. Form with Conditional Fields

```jsx
const conditionalSchema = [
  {
    title: "Basic Info",
    fields: [
      {
        name: "userType",
        label: "User Type",
        type: "select",
        required: true,
        options: [
          { label: "Individual", value: "individual" },
          { label: "Business", value: "business" }
        ]
      }
    ]
  },
  {
    title: "Business Details",
    condition: {
      field: "userType",
      operator: "equals",
      value: "business"
    },
    fields: [
      {
        name: "companyName",
        label: "Company Name",
        type: "text",
        required: true
      }
    ]
  }
];
```

### 3. Form with Dynamic Options

```jsx
const dynamicSchema = [
  {
    title: "Product Selection",
    fields: [
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          { label: "Electronics", value: "electronics" },
          { label: "Clothing", value: "clothing" }
        ]
      },
      {
        name: "product",
        label: "Product",
        type: "select",
        getOptions: (formData) => {
          const products = {
            electronics: [
              { label: "Laptop", value: "laptop" },
              { label: "Phone", value: "phone" }
            ],
            clothing: [
              { label: "Shirt", value: "shirt" },
              { label: "Pants", value: "pants" }
            ]
          };
          return products[formData.category] || [];
        }
      }
    ]
  }
];
```

## Field Types

### Basic Input Types

- `text` - Text input
- `email` - Email input with validation
- `password` - Password input with show/hide toggle
- `phone` - Phone number input
- `number` - Numeric input
- `textarea` - Multi-line text input
- `date` - Date picker

### Selection Types

- `select` - Dropdown selection (single)
- `multiselect` - Dropdown selection (multiple)
- `checkbox` - Single checkbox
- `radio` - Radio button group
- `toggle` - Toggle switch

### Special Types

- `file` - File upload with drag-and-drop

## Validation

### Built-in Validation Rules

```jsx
{
  name: "email",
  type: "email",
  validation: {
    required: true,
    email: true,
    minLength: 5,
    maxLength: 100,
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  }
}
```

### Custom Validation

```jsx
const customValidation = {
  customRule: (value, ruleValue, formData) => {
    if (value && value.length < ruleValue) {
      return `Must be at least ${ruleValue} characters`;
    }
    return null;
  }
};

<FormBuilder
  schema={schema}
  validationRules={customValidation}
  onSubmit={handleSubmit}
/>
```

## Conditional Fields

### Simple Conditions

```jsx
{
  condition: {
    field: "hasCompany",
    operator: "equals",
    value: true
  }
}
```

### Complex Conditions

```jsx
{
  condition: (formData) => {
    return formData.age >= 18 && formData.country === "US";
  }
}
```

### Available Operators

- `equals` - Field equals value
- `notEquals` - Field does not equal value
- `contains` - Field contains value
- `notContains` - Field does not contain value
- `greaterThan` - Field is greater than value
- `lessThan` - Field is less than value
- `isEmpty` - Field is empty
- `isNotEmpty` - Field is not empty
- `in` - Field value is in array
- `notIn` - Field value is not in array

## API Reference

### FormBuilder Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `schema` | Array | - | Form schema definition |
| `initialData` | Object | {} | Initial form data |
| `onSubmit` | Function | - | Called when form is submitted |
| `onCancel` | Function | - | Called when form is cancelled |
| `validationRules` | Object | {} | Custom validation rules |
| `className` | String | "" | Additional CSS classes |
| `submitText` | String | "Submit" | Submit button text |
| `cancelText` | String | "Cancel" | Cancel button text |
| `showCancel` | Boolean | true | Show cancel button |
| `loading` | Boolean | false | Show loading state |
| `disabled` | Boolean | false | Disable entire form |

### FormWizard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `schema` | Array | - | Form schema array (each section becomes a step) |
| `title` | String | "Service Provider Registration" | Wizard title |
| `description` | String | "Complete your profile to start offering services" | Wizard description |
| `initialData` | Object | {} | Initial form data |
| `onSubmit` | Function | - | Called when form is submitted |
| `onCancel` | Function | - | Called when form is cancelled |
| `validationRules` | Object | {} | Custom validation rules |
| `submitText` | String | "Complete Registration" | Final submit button text |
| `cancelText` | String | "Cancel" | Cancel button text |
| `loading` | Boolean | false | Show loading state |
| `disabled` | Boolean | false | Disable entire form |

### FormCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `schema` | Array | - | Form schema definition |
| `title` | String | - | Card title |
| `description` | String | - | Card description |
| `icon` | Component | - | Icon component |
| `variant` | String | "default" | Color variant (default, success, warning, error) |
| `initialData` | Object | {} | Initial form data |
| `onSubmit` | Function | - | Called when form is submitted |
| `onCancel` | Function | - | Called when form is cancelled |
| `validationRules` | Object | {} | Custom validation rules |
| `submitText` | String | "Submit" | Submit button text |
| `cancelText` | String | "Cancel" | Cancel button text |
| `showCancel` | Boolean | true | Show cancel button |
| `loading` | Boolean | false | Show loading state |
| `disabled` | Boolean | false | Disable entire form |

### Field Schema Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Unique field identifier |
| `label` | String | Field label |
| `type` | String | Field type |
| `required` | Boolean | Is field required |
| `placeholder` | String | Input placeholder |
| `options` | Array | Options for select fields |
| `validation` | Object | Validation rules |
| `condition` | Object/Function | Conditional visibility |
| `dependsOn` | String | Field dependency |
| `getOptions` | Function | Dynamic options function |
| `className` | String | Additional CSS classes |
| `description` | String | Field description |

## Examples

See the `examples/` directory for complete examples:

- `ContactForm.js` - Complete contact form with all features
- `ProductForm.js` - Product management form
- `DynamicForm.js` - Form with conditional fields
- `EngineeringForm.js` - Complex form with dynamic dependencies
- `VendorOnboardingForm.js` - Step-by-step vendor registration

### Using FormWizard

```jsx
import FormWizard from './components/FormWizard';
import { vendorOnboardingSchema } from './examples/VendorOnboardingForm';

function VendorRegistration() {
  const handleSubmit = (formData) => {
    console.log('Registration completed:', formData);
  };

  return (
    <FormWizard
      schema={vendorOnboardingSchema}
      onSubmit={handleSubmit}
      title="Service Provider Registration"
      description="Complete your profile to start offering services"
    />
  );
}
```

### Using FormCard

```jsx
import FormCard from './components/FormCard';
import { contactFormSchema } from './examples/ContactForm';

function ContactPage() {
  const handleSubmit = (formData) => {
    console.log('Contact form submitted:', formData);
  };

  return (
    <FormCard
      schema={contactFormSchema}
      onSubmit={handleSubmit}
      title="Contact Us"
      description="Get in touch with our team"
      variant="success"
    />
  );
}
```

## Form Management & Editing

The form builder includes a comprehensive management system that allows you to create, edit, save, and manage forms through both code and a visual interface.

### Visual Form Builder

The `VisualFormBuilder` component provides a drag-and-drop interface for non-technical users to create and edit forms. It can operate in two modes:

#### Standalone Mode (Self-contained)
When `isStandalone={true}`, the component handles its own form saving:

```jsx
import VisualFormBuilder from './components/VisualFormBuilder';

function FormBuilderPage() {
  const [schema, setSchema] = useState([]);

  return (
    <VisualFormBuilder
      initialSchema={schema}
      onSchemaChange={setSchema}
      isStandalone={true} // Has built-in save functionality
    />
  );
}
```

#### Integrated Mode (Parent-controlled)
When `isStandalone={false}`, the parent component handles saving:

```jsx
import VisualFormBuilder from './components/VisualFormBuilder';

function FormEditor({ selectedForm, onSave }) {
  const [schema, setSchema] = useState(selectedForm.schema);

  return (
    <VisualFormBuilder
      initialSchema={selectedForm.schema}
      onSchemaChange={setSchema}
      isStandalone={false} // Save handled by parent
    />
  );
}
```

**Architecture Benefits:**
- **No Duplication**: Eliminates redundant save buttons and modals
- **Clear Separation**: Standalone for independent use, integrated for management systems
- **Flexible**: Can be used in both simple and complex workflows

### Form Manager

The `FormManager` component provides a complete interface for managing forms:

```jsx
import FormManager from './components/FormManager';

function AdminPanel() {
  const handleEditForm = (form) => {
    // Open form in builder for editing
    console.log('Editing form:', form);
  };

  const handleViewForm = (form) => {
    // Preview form
    console.log('Viewing form:', form);
  };

  return (
    <FormManager
      onEditForm={handleEditForm}
      onViewForm={handleViewForm}
    />
  );
}
```

### Editing Existing Forms

To edit an existing form, you can use the `FormManagerDemo` component which provides a complete workflow:

```jsx
import FormManagerDemo from './FormManagerDemo';

function FormManagementPage() {
  return <FormManagerDemo />;
}
```

#### How Form Editing Works

1. **Load Form**: Select a form from the manager
2. **Edit in Builder**: The form opens in the `VisualFormBuilder` with all existing fields
3. **Make Changes**: Add, remove, or modify fields using the visual interface
4. **Save Changes**: Click "Save Changes" to persist modifications
5. **Return to Manager**: Navigate back to see updated form in the list

#### Form Persistence

## Form Storage (API-first)

Forms are persisted via **`fileFormManager.js`**, which talks to the backend API (`Form_Management_Service` on port 3004). localStorage is used only as a fallback when the API is unavailable.

```javascript
import fileFormManager from './services/fileFormManager';

// Load all forms
const forms = await fileFormManager.getAllForms();

// Get one form
const form = await fileFormManager.getFormByCustomId('form_id');

// Save / update
await fileFormManager.saveForm(formData);
await fileFormManager.updateForm(formId, updates);

// Delete / duplicate
await fileFormManager.deleteForm(formId);
await fileFormManager.duplicateForm(formId);
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3004` if needed (default in `simpleApiConfig.js`).

See also: [Form_Management_Service/README.md](../Form_Management_Service/README.md)

## Customization

### Adding New Field Types

1. Create your field component:

```jsx
// fieldTypes/CustomField.jsx
export default function CustomField({ label, value, onChange, ...props }) {
  return (
    <div>
      <label>{label}</label>
      {/* Your custom field implementation */}
    </div>
  );
}
```

2. Register it in the FieldRegistry:

```jsx
// fieldTypes/FieldRegistry.js
import CustomField from './CustomField';

const FieldRegistry = {
  // ... existing fields
  custom: CustomField,
};
```

### Custom Styling

The form builder uses Tailwind CSS classes. You can customize the appearance by:

1. Overriding CSS classes in your components
2. Using the `className` prop on fields and sections
3. Modifying the base components

### Custom Validation

Create custom validation rules:

```jsx
const customRules = {
  customPhone: (value) => {
    if (!value) return null;
    const cleanPhone = value.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return 'Phone number must have at least 10 digits';
    }
    return null;
  }
};
```

## Best Practices

1. **Use descriptive field names** - Make them meaningful and consistent
2. **Group related fields** - Use sections to organize your form
3. **Provide helpful validation messages** - Be specific about what's wrong
4. **Use conditional fields sparingly** - Too many conditions can confuse users
5. **Test your forms thoroughly** - Ensure all validation and conditions work
6. **Consider accessibility** - Use proper labels and ARIA attributes

## Migration from Old System

If you're migrating from the old form system:

1. Replace `FormCreatorDemo` with `FormBuilder`
2. Update your schema format to match the new structure
3. Update field type names (e.g., `checkbox-list` → `multiselect`)
4. Test your forms to ensure everything works correctly

## Contributing

To add new features or fix bugs:

1. Create your feature branch
2. Add tests for new functionality
3. Update documentation
4. Submit a pull request

## License

MIT 