# Form Management Service API Documentation

## Overview

This API provides endpoints for managing forms, field options, and dynamic mappings with the new optimized data structure.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required. Add authentication middleware as needed for production.

---

## 📋 Forms API

### Get All Forms
```http
GET /forms
```

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 10) - Number of forms per page
- `category` (string) - Filter by category
- `type` (string) - Filter by form type
- `isActive` (boolean) - Filter by active status
- `isExample` (boolean) - Filter by example status

**Response:**
```json
{
  "forms": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "contact_form_example",
      "name": "Contact Form",
      "description": "Basic contact form with validation",
      "type": "card",
      "schema": {
        "formType": "multi-section",
        "formTheme": "modern",
        "sections": [...]
      },
      "createdAt": "2025-01-06T00:00:00.000Z",
      "updatedAt": "2025-01-06T00:00:00.000Z",
      "isExample": false,
      "metadata": {
        "createdBy": "migration",
        "category": "migrated",
        "isActive": true
      }
    }
  ],
  "totalPages": 1,
  "currentPage": 1,
  "total": 9
}
```

### Get Forms by Type
```http
GET /forms/type/:type
```

### Get Example Forms
```http
GET /forms/examples
```

### Get Form by Custom ID
```http
GET /forms/custom/:id
```

### Get Form by MongoDB ID
```http
GET /forms/:id
```

### Create New Form
```http
POST /forms
```

**Request Body:**
```json
{
  "id": "my_custom_form_id",
  "name": "My Custom Form",
  "description": "A custom form description",
  "type": "multi-section",
  "schema": {
    "formType": "wizard",
    "formTheme": "modern",
    "sections": [
      {
        "title": "Personal Information",
        "description": "Enter your personal details",
        "fields": [
          {
            "name": "firstName",
            "label": "First Name",
            "type": "text",
            "required": true,
            "placeholder": "Enter your first name"
          }
        ]
      }
    ]
  },
  "metadata": {
    "createdBy": "user123",
    "category": "custom"
  }
}
```

### Update Form
```http
PUT /forms/:id
```

### Delete Form
```http
DELETE /forms/:id
```

### Duplicate Form
```http
POST /forms/:id/duplicate
```

**Request Body:**
```json
{
  "newName": "Contact Form Copy",
  "newDescription": "A copy of the contact form",
  "newId": "contact_form_copy"
}
```

### Get Form Statistics
```http
GET /forms/:id/stats
```

### Export Form as JSON
```http
GET /forms/:id/export
```

---

## 🔧 Field Options API

### Get All Field Option Types
```http
GET /field-options
```

**Query Parameters:**
- `isActive` (boolean, default: true) - Filter by active status
- `category` (string) - Filter by category

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "optionType": "industries",
    "options": [
      {
        "label": "Oil & Gas",
        "value": "oil_gas",
        "parentValue": null,
        "sortOrder": 0,
        "metadata": {
          "description": "Oil and gas industry",
          "icon": "industry-icon",
          "color": "#ff6b6b"
        }
      }
    ],
    "isActive": true,
    "metadata": {
      "description": "Options for industries",
      "category": "migrated",
      "displayName": "Industries"
    }
  }
]
```

### Get Option Types Summary
```http
GET /field-options/types
```

### Get Options by Type
```http
GET /field-options/type/:optionType
```

**Query Parameters:**
- `parentValue` (string) - Filter by parent value

**Response:**
```json
{
  "optionType": "industries",
  "options": [
    {
      "label": "Oil & Gas",
      "value": "oil_gas",
      "parentValue": null,
      "sortOrder": 0,
      "metadata": {...}
    }
  ],
  "metadata": {
    "description": "Options for industries",
    "category": "migrated",
    "displayName": "Industries"
  }
}
```

### Create New Field Option Type
```http
POST /field-options
```

**Request Body:**
```json
{
  "optionType": "custom_options",
  "options": [
    {
      "label": "Option 1",
      "value": "option1",
      "sortOrder": 0,
      "metadata": {
        "description": "First option",
        "color": "#ff6b6b"
      }
    }
  ],
  "metadata": {
    "description": "Custom options for forms",
    "category": "custom",
    "displayName": "Custom Options"
  }
}
```

### Update Field Option Type
```http
PUT /field-options/:id
```

### Delete Field Option Type
```http
DELETE /field-options/:id
```

### Add Option to Existing Type
```http
POST /field-options/:id/options
```

**Request Body:**
```json
{
  "label": "New Option",
  "value": "new_option",
  "parentValue": "parent_value",
  "sortOrder": 5,
  "metadata": {
    "description": "A new option",
    "color": "#4ecdc4"
  }
}
```

### Update Specific Option
```http
PUT /field-options/:id/options/:optionValue
```

### Remove Option from Type
```http
DELETE /field-options/:id/options/:optionValue
```

### Bulk Create Field Option Types
```http
POST /field-options/bulk
```

**Request Body:**
```json
{
  "optionTypes": [
    {
      "optionType": "type1",
      "options": [...],
      "metadata": {...}
    }
  ]
}
```

### Get Options for Form Schema
```http
POST /field-options/schema
```

### Import Options from JSON
```http
POST /field-options/import
```

---

## 🔗 Dynamic Mappings API

### Get All Mappings
```http
GET /dynamic-mappings
```

**Query Parameters:**
- `parentField` (string) - Filter by parent field
- `childField` (string) - Filter by child field
- `parentOptionType` (string) - Filter by parent option type
- `childOptionType` (string) - Filter by child option type
- `isActive` (boolean, default: true) - Filter by active status

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "id": "industry_categories",
    "name": "Industry → Categories",
    "description": "Categories change based on selected industry",
    "parentField": "industry",
    "childField": "categories",
    "parentOptionType": "industries",
    "childOptionType": "service_categories",
    "mapping": {
      "oil_gas": [
        {"label": "Drilling", "value": "drilling"},
        {"label": "Exploration", "value": "exploration"}
      ],
      "manufacturing": [
        {"label": "Production", "value": "production"},
        {"label": "Quality Control", "value": "quality_control"}
      ]
    },
    "isActive": true,
    "metadata": {
      "createdBy": "migration",
      "version": "1.0.0",
      "category": "dynamic_mapping"
    }
  }
]
```

### Get All Mappings Summary
```http
GET /dynamic-mappings/summary
```

### Get Mapping by Custom ID
```http
GET /dynamic-mappings/custom/:id
```

### Get Mapping by MongoDB ID
```http
GET /dynamic-mappings/:id
```

### Create New Mapping
```http
POST /dynamic-mappings
```

**Request Body:**
```json
{
  "id": "custom_mapping_id",
  "name": "Custom Mapping",
  "description": "A custom dynamic mapping",
  "parentField": "parent_field",
  "childField": "child_field",
  "parentOptionType": "parent_options",
  "childOptionType": "child_options",
  "mapping": {
    "parent_value_1": [
      {"label": "Child Option 1", "value": "child1"},
      {"label": "Child Option 2", "value": "child2"}
    ]
  },
  "metadata": {
    "createdBy": "user123",
    "category": "custom"
  }
}
```

### Update Mapping
```http
PUT /dynamic-mappings/:id
```

### Delete Mapping
```http
DELETE /dynamic-mappings/:id
```

### Get Mappings by Parent-Child Relationship
```http
GET /dynamic-mappings/parent/:parentField/child/:childField
```

### Get Mappings by Option Types
```http
GET /dynamic-mappings/options/:parentOptionType/:childOptionType
```

### Get Mapped Options for a Parent Value
```http
GET /dynamic-mappings/:mappingId/options/:parentValue
```

**Response:**
```json
{
  "mapping": {
    "id": "industry_categories",
    "name": "Industry → Categories",
    "parentField": "industry",
    "childField": "categories"
  },
  "parentValue": "oil_gas",
  "mappedOptions": [
    {"label": "Drilling", "value": "drilling"},
    {"label": "Exploration", "value": "exploration"}
  ]
}
```

### Get Mapped Options by Custom Mapping ID
```http
GET /dynamic-mappings/custom/:mappingId/options/:parentValue
```

### Apply Mapping to Data
```http
POST /dynamic-mappings/:mappingId/apply
```

**Request Body:**
```json
{
  "parentValue": "oil_gas"
}
```

### Test Mapping with Sample Data
```http
POST /dynamic-mappings/:mappingId/test
```

**Request Body:**
```json
{
  "testValues": ["oil_gas", "manufacturing", "technology"]
}
```

### Bulk Create Mappings
```http
POST /dynamic-mappings/bulk
```

**Request Body:**
```json
{
  "mappings": [
    {
      "id": "mapping1",
      "name": "Mapping 1",
      "parentField": "field1",
      "childField": "field2",
      "mapping": {...}
    }
  ]
}
```

---

## 📊 Submission API

The submission API remains unchanged and works with the new form structure.

---

## 🚀 Usage Examples

### Creating a Form with Dynamic Options
1. Create field options for dropdowns
2. Create dynamic mappings for dependent fields
3. Create the form with references to option types

### Frontend Integration
```javascript
// Get form by custom ID
const form = await fetch('/api/forms/custom/contact_form_example');

// Get options for a specific type
const options = await fetch('/api/field-options/type/industries');

// Get mapped options when parent value changes
const mappedOptions = await fetch('/api/dynamic-mappings/custom/industry_categories/options/oil_gas');
```

---

## 🔧 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- IDs are MongoDB ObjectIds for database operations
- Custom IDs are used for frontend compatibility
- The API is designed to be RESTful and consistent
- All endpoints support proper error handling and validation
