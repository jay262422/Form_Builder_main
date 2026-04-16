# Form Management Service

A microservice for managing dynamic forms, field options, and form submissions. This service provides a complete backend solution for the E-marketplace form system.

## Features

- **Dynamic Form Management**: Create, update, and manage dynamic forms with various field types
- **Field Options**: Manage dropdown options and selections for form fields
- **Dynamic Mappings**: Create mappings between different forms for data transformation
- **Form Submissions**: Handle form submissions with validation and workflow management
- **MongoDB Integration**: Full database support with MongoDB
- **RESTful API**: Complete REST API for all operations
- **Data Migration**: Tools to migrate data from the frontend JSON files

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on localhost:27017 or configured via environment variables)
- npm or yarn

### Installation

1. Navigate to the service directory:
```bash
cd WAY2REACH-WEB-BACKEND/Form_Management_Service
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp config.env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/form_management
NODE_ENV=development
```

5. Start the service:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### Data Migration

To migrate existing data from the frontend:

```bash
node scripts/migrateData.js
```

This will migrate:
- Field options from `fieldOptions.json`
- Forms from the `all_forms` directory
- Dynamic mappings from `dynamicMappings.json`

## API Endpoints

### Forms

- `GET /api/forms` - Get all forms
- `GET /api/forms/:id` - Get form by ID
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/duplicate` - Duplicate form
- `GET /api/forms/:id/stats` - Get form statistics
- `GET /api/forms/:id/export` - Export form as JSON

### Field Options

- `GET /api/field-options` - Get all field options
- `GET /api/field-options/types` - Get all option types
- `GET /api/field-options/type/:optionType` - Get options by type
- `POST /api/field-options` - Create new field option
- `PUT /api/field-options/:id` - Update field option
- `DELETE /api/field-options/:id` - Delete field option
- `POST /api/field-options/bulk` - Bulk create field options
- `POST /api/field-options/schema` - Get options for form schema
- `POST /api/field-options/import` - Import options from JSON

### Dynamic Mappings

- `GET /api/dynamic-mappings` - Get all mappings
- `GET /api/dynamic-mappings/:id` - Get mapping by ID
- `POST /api/dynamic-mappings` - Create new mapping
- `PUT /api/dynamic-mappings/:id` - Update mapping
- `DELETE /api/dynamic-mappings/:id` - Delete mapping
- `GET /api/dynamic-mappings/source/:sourceFormId` - Get mappings by source form
- `GET /api/dynamic-mappings/target/:targetFormId` - Get mappings by target form
- `POST /api/dynamic-mappings/:mappingId/apply` - Apply mapping to data

### Submissions

- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/:id` - Get submission by ID
- `POST /api/submissions` - Create new submission
- `PUT /api/submissions/:id` - Update submission
- `DELETE /api/submissions/:id` - Delete submission
- `GET /api/submissions/form/:formId` - Get submissions by form
- `GET /api/submissions/form/:formId/stats` - Get submission statistics
- `GET /api/submissions/form/:formId/export` - Export submissions

## Database Models

### Form
```javascript
{
  name: String,
  description: String,
  version: String,
  fields: [FieldSchema],
  settings: {
    allowMultipleSubmissions: Boolean,
    requireAuthentication: Boolean,
    maxSubmissions: Number,
    autoSave: Boolean,
    theme: String
  },
  metadata: {
    createdBy: String,
    tags: [String],
    category: String,
    isActive: Boolean
  }
}
```

### FieldOption
```javascript
{
  optionType: String,
  label: String,
  value: String,
  parentType: String,
  parentValue: String,
  sortOrder: Number,
  isActive: Boolean,
  metadata: {
    description: String,
    icon: String,
    color: String,
    category: String
  }
}
```

### DynamicMapping
```javascript
{
  name: String,
  description: String,
  sourceForm: ObjectId,
  targetForm: ObjectId,
  rules: [MappingRuleSchema],
  isActive: Boolean,
  metadata: {
    createdBy: String,
    version: String,
    tags: [String],
    category: String
  }
}
```

### Submission
```javascript
{
  formId: ObjectId,
  data: Mixed,
  status: String,
  submittedBy: {
    userId: String,
    email: String,
    name: String,
    ipAddress: String,
    userAgent: String
  },
  metadata: {
    submissionTime: Date,
    processingTime: Number,
    version: String,
    tags: [String],
    notes: String
  },
  validation: {
    isValid: Boolean,
    errors: [ValidationError],
    warnings: [ValidationWarning]
  },
  workflow: {
    currentStep: String,
    steps: [WorkflowStep]
  }
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3004)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: JWT secret for authentication
- `CORS_ORIGIN`: CORS origin configuration

### MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `form_management`
3. Update the `MONGODB_URI` in your `.env` file

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
Form_Management_Service/
├── config/
│   └── database.js
├── controllers/
│   ├── formController.js
│   ├── fieldOptionsController.js
│   ├── dynamicMappingsController.js
│   └── submissionController.js
├── models/
│   ├── Form.js
│   ├── FieldOption.js
│   ├── DynamicMapping.js
│   └── Submission.js
├── routes/
│   ├── formRoutes.js
│   ├── fieldOptionsRoutes.js
│   ├── dynamicMappingsRoutes.js
│   └── submissionRoutes.js
├── scripts/
│   └── migrateData.js
├── server.js
├── package.json
└── README.md
```

## Integration with Frontend

Update your frontend API calls to point to the new microservice:

```javascript
// Old frontend API calls
const response = await fetch('/api/Jay_2/forms');

// New microservice API calls
const response = await fetch('http://localhost:3004/api/forms');
```

## Health Check

The service includes a health check endpoint:

```bash
GET http://localhost:3004/health
```

Response:
```json
{
  "status": "OK",
  "service": "Form Management Service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Docker (Recommended)

1. Create a Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3004
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t form-management-service .
docker run -p 3004:3004 form-management-service
```

### PM2

```bash
npm install -g pm2
pm2 start server.js --name "form-management-service"
```

## Monitoring and Logging

The service includes:
- Request logging with Morgan
- Error handling middleware
- Health check endpoint
- MongoDB connection monitoring

## Security

- CORS configuration
- Helmet for security headers
- Input validation
- Rate limiting (configurable)

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check API endpoint documentation

## Migration from Frontend

The service includes migration scripts to move data from the existing frontend JSON files to the new MongoDB database. Run the migration script after setting up the service:

```bash
node scripts/migrateData.js
```

This will preserve all existing data while providing the benefits of a proper database backend. 