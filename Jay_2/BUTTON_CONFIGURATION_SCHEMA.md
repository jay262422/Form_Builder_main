# Button Configuration Schema

## Overview
Button configuration allows forms to customize their submit, reset, and cancel buttons. This configuration is stored in the form's `settings.buttons` object.

## Schema Structure

```javascript
{
  "id": "form_123",
  "name": "Contact Form",
  "description": "Simple contact form",
  "schema": {
    "sections": [
      // ... form sections
    ]
  },
  "settings": {
    // Button Configuration
    "buttons": {
      "submit": {
        "text": "Send Message",
        "show": true,
        "customApiEndpoint": "https://api.example.com/contact",
        "customApiMethod": "POST"
      },
      "reset": {
        "text": "Clear Form",
        "show": true
      },
      "cancel": {
        "text": "Cancel",
        "show": true
      }
    },
    // Other settings...
    "allowMultipleSubmissions": false,
    "requireAuthentication": false,
    "postSubmission": {
      // ... post submission settings
    }
  }
}
```

## Button Configuration Properties

### Submit Button
- **text** (string): Button text to display
- **show** (boolean): Whether to show the submit button (default: true)
- **customApiEndpoint** (string|null): Custom API endpoint URL (null = use default)
- **customApiMethod** (string): HTTP method for custom endpoint (default: "POST")

### Reset Button
- **text** (string): Button text to display
- **show** (boolean): Whether to show the reset button (default: true)

### Cancel Button
- **text** (string): Button text to display
- **show** (boolean): Whether to show the cancel button (default: true)

## Default Values

When no button configuration is provided, the system uses these defaults:

```javascript
const defaultButtonConfig = {
  submit: {
    text: 'Submit',
    show: true,
    customApiEndpoint: null,
    customApiMethod: 'POST'
  },
  reset: {
    text: 'Reset',
    show: true
  },
  cancel: {
    text: 'Cancel',
    show: true
  }
};
```

## Usage Examples

### Contact Form
```javascript
{
  "settings": {
    "buttons": {
      "submit": {
        "text": "Send Message",
        "customApiEndpoint": "https://api.example.com/contact"
      },
      "reset": {
        "text": "Clear Form",
        "show": true
      },
      "cancel": {
        "show": false  // Hide cancel button for contact forms
      }
    }
  }
}
```

### Login Form
```javascript
{
  "settings": {
    "buttons": {
      "submit": {
        "text": "Sign In",
        "customApiEndpoint": "https://api.example.com/auth/login"
      },
      "reset": {
        "show": false  // Hide reset button for login forms
      },
      "cancel": {
        "text": "Back",
        "show": true
      }
    }
  }
}
```

### Multi-step Form
```javascript
{
  "settings": {
    "buttons": {
      "submit": {
        "text": "Complete Registration",
        "show": true
      },
      "reset": {
        "text": "Start Over",
        "show": true
      },
      "cancel": {
        "text": "Exit",
        "show": true
      }
    }
  }
}
```

## Implementation Notes

1. **Backward Compatibility**: Forms without button configuration will use default values
2. **Validation**: Button text should not be empty if button is shown
3. **Custom API**: When customApiEndpoint is provided, form submission bypasses default endpoint
4. **Error Handling**: Custom API errors are handled gracefully with fallback messages
5. **UI Updates**: Button visibility and text changes are reflected immediately in the form

## Migration from Legacy Forms

For existing forms without button configuration:

```javascript
// Before
{
  "settings": {
    "submitText": "Submit",
    "cancelText": "Cancel"
  }
}

// After (automatically migrated)
{
  "settings": {
    "buttons": {
      "submit": {
        "text": "Submit",
        "show": true
      },
      "cancel": {
        "text": "Cancel", 
        "show": true
      }
    }
  }
}
```

## API Integration

When a custom API endpoint is configured:

1. Form data is sent to the custom endpoint
2. Custom endpoint should return a JSON response
3. Error responses are handled and displayed to user
4. Success responses trigger normal post-submission flow

Example custom API response:
```javascript
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "submissionId": "sub_123",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```
