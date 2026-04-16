# Authentication Routes Summary

## ✅ All Routes Updated with Authentication

### Auth Routes (`/api/auth`)
- ✅ All routes configured
- ✅ Standardized responses

### Form Routes (`/api/forms`)

**Public Routes (Optional Auth):**
- `GET /api/forms` - Get all forms (filtered by user if authenticated)
- `GET /api/forms/:id` - Get form by ID (user's forms only if authenticated)

**Protected Routes (Require Auth):**
- `POST /api/forms` - Create form ✅
- `PUT /api/forms/:id` - Update form ✅
- `DELETE /api/forms/:id` - Delete form ✅
- `POST /api/forms/:id/duplicate` - Duplicate form ✅
- `GET /api/forms/:id/stats` - Get form statistics ✅
- `GET /api/forms/:id/export` - Export form ✅

### Submission Routes (`/api/submissions`)

**Public Routes (Optional Auth):**
- `GET /api/submissions` - Get all submissions (filtered by user if authenticated)
- `GET /api/submissions/:id` - Get submission by ID (user's submissions only if authenticated)
- `POST /api/submissions` - Create submission (sets userId if authenticated)

**Protected Routes (Require Auth):**
- `PUT /api/submissions/:id` - Update submission ✅
- `DELETE /api/submissions/:id` - Delete submission ✅
- `GET /api/submissions/form/:formId` - Get submissions by form ✅
- `GET /api/submissions/form/:formId/stats` - Get submission statistics ✅
- `GET /api/submissions/form/:formId/export` - Export submissions ✅

### Field Options Routes (`/api/field-options`)

**Public Routes (Optional Auth):**
- `GET /api/field-options` - Get all field option types
- `GET /api/field-options/types` - Get all option types (summary)
- `GET /api/field-options/type/:optionType` - Get options by type
- `POST /api/field-options/schema` - Get options for form schema

**Protected Routes (Require Auth):**
- `POST /api/field-options` - Create new field option type ✅
- `PUT /api/field-options/:id` - Update field option type ✅
- `DELETE /api/field-options/:id` - Delete field option type ✅
- `POST /api/field-options/:id/options` - Add option to existing type ✅
- `PUT /api/field-options/:id/options/:optionValue` - Update specific option ✅
- `DELETE /api/field-options/:id/options/:optionValue` - Remove option from type ✅
- `POST /api/field-options/bulk` - Bulk create field option types ✅
- `POST /api/field-options/import` - Import options from JSON ✅

### Dynamic Mappings Routes (`/api/dynamic-mappings`)

**Public Routes (Optional Auth):**
- `GET /api/dynamic-mappings` - Get all mappings
- `GET /api/dynamic-mappings/summary` - Get all mappings (summary)
- `GET /api/dynamic-mappings/custom/:id` - Get mapping by custom ID
- `GET /api/dynamic-mappings/parent/:parentField/child/:childField` - Get mappings by parent-child
- `GET /api/dynamic-mappings/options/:parentOptionType/:childOptionType` - Get mappings by option types
- `GET /api/dynamic-mappings/:id` - Get mapping by MongoDB ID
- `GET /api/dynamic-mappings/:mappingId/options/:parentValue` - Get mapped options
- `GET /api/dynamic-mappings/custom/:mappingId/options/:parentValue` - Get mapped options by custom ID
- `POST /api/dynamic-mappings/:mappingId/apply` - Apply mapping to data
- `POST /api/dynamic-mappings/:mappingId/test` - Test mapping with sample data

**Protected Routes (Require Auth):**
- `POST /api/dynamic-mappings` - Create new mapping ✅
- `PUT /api/dynamic-mappings/:id` - Update mapping ✅
- `DELETE /api/dynamic-mappings/:id` - Delete mapping ✅
- `POST /api/dynamic-mappings/bulk` - Bulk create mappings ✅

### Category Routes (`/api/category-management`)

**Public Routes (Optional Auth):**
- `GET /api/category-management/categories` - Get categories
- `GET /api/category-management/label-mappings` - Get label mappings

**Protected Routes (Require Auth):**
- `POST /api/category-management/categories` - Save categories ✅
- `POST /api/category-management/label-mappings` - Save label mappings ✅

---

## 🔒 Authentication Levels

### 1. **Public Routes** (No Auth Required)
- None currently - all routes have at least optional auth

### 2. **Optional Auth** (`optionalAuth` middleware)
- Routes work without auth, but filter by userId if authenticated
- Examples: `GET /api/forms`, `GET /api/submissions`

### 3. **Protected Routes** (`authenticate` middleware)
- Require valid JWT token
- Return 401 if not authenticated
- Examples: `POST /api/forms`, `PUT /api/forms/:id`

---

## 📊 Multi-Tenancy

All routes that modify data now:
- ✅ Filter by `userId` when authenticated
- ✅ Set `userId` when creating resources
- ✅ Verify ownership when updating/deleting

**Example:**
```javascript
// User can only see their own forms
const query = { userId: req.userId };
const forms = await Form.find(query);
```

---

## ✅ Standardized Responses

All controllers now use the response helper:
- ✅ `successResponse()` - Success responses
- ✅ `errorResponse()` - General errors
- ✅ `validationError()` - Validation errors (400)
- ✅ `unauthorizedResponse()` - Auth errors (401)
- ✅ `notFoundResponse()` - Not found (404)
- ✅ `conflictResponse()` - Duplicate/conflict (409)
- ✅ `createdResponse()` - Created resources (201)

---

## 🚀 Usage

### Making Authenticated Requests

```javascript
// Include JWT token in header
fetch('/api/forms', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Response Format

```json
{
  "success": true,
  "status": "success",
  "message": "Forms retrieved successfully",
  "data": {
    "forms": [...]
  }
}
```

---

## 📝 Notes

- **Public form submissions**: `POST /api/submissions` is public (for public forms) but sets userId if authenticated
- **Read-only routes**: Many GET routes are public but filter by user if authenticated
- **Write routes**: All POST, PUT, DELETE routes require authentication
- **Multi-tenancy**: Users can only access their own data

---

## ✅ Status

All routes are now:
- ✅ Protected with authentication where needed
- ✅ Using standardized response format
- ✅ Supporting multi-tenancy
- ✅ Filtering by userId when authenticated
