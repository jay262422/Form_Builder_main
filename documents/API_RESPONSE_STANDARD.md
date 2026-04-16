# API Response Standard

## Overview

All API responses follow a standardized structure for consistency and easier frontend handling.

## Response Structure

### Success Response

```json
{
  "success": true,
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "status": "error_type",
  "message": "Human-readable error message",
  "error": {
    "type": "error_type",
    "message": "Error message",
    "details": {} // Only in development mode
  }
}
```

## Status Types

### Success Statuses
- `success` - General success
- `created` - Resource created (201)

### Error Statuses
- `validation_error` - Input validation failed (400)
- `unauthorized` - Authentication required (401)
- `forbidden` - Insufficient permissions (403)
- `not_found` - Resource not found (404)
- `conflict` - Resource already exists (409)
- `error` - General server error (500)

## HTTP Status Codes

| Status Code | Status Type | Use Case |
|------------|-------------|----------|
| 200 | success | GET, PUT, PATCH requests |
| 201 | created | POST requests (resource created) |
| 204 | no_content | DELETE requests (resource deleted) |
| 400 | validation_error | Invalid input data |
| 401 | unauthorized | Authentication required |
| 403 | forbidden | Insufficient permissions |
| 404 | not_found | Resource not found |
| 409 | conflict | Resource already exists |
| 500 | error | Server error |

## Examples

### Success Response (200)

```json
{
  "success": true,
  "status": "success",
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Created Response (201)

```json
{
  "success": true,
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Validation Error (400)

```json
{
  "success": false,
  "status": "validation_error",
  "message": "Email, password, and name are required",
  "error": {
    "type": "validation_error",
    "message": "Email, password, and name are required",
    "errors": {
      "email": "Email is required",
      "password": "Password is required"
    }
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "status": "unauthorized",
  "message": "Invalid email or password",
  "error": {
    "type": "unauthorized",
    "message": "Invalid email or password"
  }
}
```

### Conflict (409)

```json
{
  "success": false,
  "status": "conflict",
  "message": "User with this email already exists. Please login instead.",
  "error": {
    "type": "conflict",
    "message": "User with this email already exists. Please login instead."
  }
}
```

### Not Found (404)

```json
{
  "success": false,
  "status": "not_found",
  "message": "User not found",
  "error": {
    "type": "not_found",
    "message": "User not found"
  }
}
```

### Server Error (500)

```json
{
  "success": false,
  "status": "error",
  "message": "Failed to process request",
  "error": {
    "type": "error",
    "message": "Failed to process request",
    "details": {
      "stack": "..." // Only in development mode
    }
  }
}
```

## Usage in Controllers

### Import Helpers

```javascript
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');
```

### Success Examples

```javascript
// Simple success
return successResponse(res, data, 'Operation successful');

// Created resource
return createdResponse(res, newUser, 'User created successfully');

// Success with custom message
return successResponse(res, { user }, 'User retrieved successfully');
```

### Error Examples

```javascript
// Validation error
return validationError(res, 'Email is required');

// Unauthorized
return unauthorizedResponse(res, 'Invalid credentials');

// Not found
return notFoundResponse(res, 'User not found');

// Conflict
return conflictResponse(res, 'Email already exists');

// General error
return errorResponse(res, 'Failed to process request', 500);
```

## Frontend Handling

### Success Handling

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (data.success) {
  // Handle success
  console.log(data.message); // "Login successful"
  console.log(data.data); // { user, token }
} else {
  // Handle error
  console.error(data.message); // Error message
  console.error(data.status); // Error type
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (!data.success) {
    // Check error type
    switch (data.status) {
      case 'validation_error':
        // Show validation errors
        break;
      case 'conflict':
        // Show conflict message
        break;
      case 'unauthorized':
        // Redirect to login
        break;
      default:
        // Show general error
    }
    
    throw new Error(data.message);
  }

  // Success
  return data.data;
} catch (error) {
  console.error(error.message);
}
```

## Benefits

1. **Consistency** - All responses follow the same structure
2. **Predictability** - Frontend knows what to expect
3. **Error Handling** - Easy to handle different error types
4. **Debugging** - Clear error messages and types
5. **Type Safety** - Can create TypeScript interfaces

## Migration Notes

All auth controller methods have been updated to use the standardized response format. Other controllers should be updated gradually to maintain consistency across the API.
