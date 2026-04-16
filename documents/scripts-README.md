# Migration Scripts

This directory contains scripts for migrating data from the frontend JSON files to the backend database.

## 📋 Available Scripts

### 1. `migrateData.js` - Main Migration Script

**Purpose:** Migrate forms from frontend JSON files to backend database with new structure.

**Usage:**
```bash
# Migrate forms using direct database operations (recommended)
node migrateData.js migrate

# Migrate forms using API endpoints
node migrateData.js migrate --api

# Clean up all forms from database (for testing)
node migrateData.js cleanup

# List all forms in database
node migrateData.js list
```

**Features:**
- ✅ Reads forms from `E-marketplace/src/app/Jay_2/data/all_forms/`
- ✅ Converts old structure to new structure (settings, status, metadata, statistics)
- ✅ Handles legacy fields (`isTemplate`, `isExample`)
- ✅ Validates migration results
- ✅ Provides detailed error reporting

### 2. `test-migration.js` - Test Script

**Purpose:** Test migration functionality without actually running it.

**Usage:**
```bash
node test-migration.js
```

**Features:**
- ✅ Tests form normalization
- ✅ Validates new structure
- ✅ Tests legacy field mapping
- ✅ Checks frontend forms reading

## 🔄 Migration Process

### **Step 1: Prepare Backend**
```bash
# Start the backend server
cd WAY2REACH-WEB-BACKEND/Form_Management_Service
npm start
```

### **Step 2: Test Migration**
```bash
# Test the migration functionality
node scripts/test-migration.js
```

### **Step 3: Run Migration**
```bash
# Run the actual migration
node scripts/migrateData.js migrate
```

### **Step 4: Verify Results**
```bash
# List all migrated forms
node scripts/migrateData.js list
```

## 📊 Migration Details

### **Old Structure → New Structure**

**Before:**
```json
{
  "id": "form_123",
  "name": "Test Form",
  "isTemplate": true,
  "isExample": false
}
```

**After:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "form_123",
  "name": "Test Form",
  "settings": {
    "allowMultipleSubmissions": false,
    "requireAuthentication": false,
    "redirectUrl": "/thank-you",
    "successMessage": "Form submitted successfully!",
    "errorMessage": "Please check your form and try again."
  },
  "status": {
    "isPublished": false,
    "isTemplate": true
  },
  "metadata": {
    "createdBy": "admin",
    "version": "1.0.0",
    "lastModifiedBy": "admin"
  },
  "statistics": {
    "totalSubmissions": 0,
    "totalViews": 0,
    "lastSubmissionDate": null
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### **Legacy Field Mapping**
- `isTemplate` → `status.isTemplate`
- `isExample` → `status.isTemplate` (if true)
- Old metadata → New metadata structure
- Missing fields → Default values

## ⚠️ Important Notes

1. **Backup:** Always backup your database before running migration
2. **Test First:** Run `test-migration.js` before actual migration
3. **Server Running:** Ensure backend server is running on port 3004
4. **MongoDB:** Ensure MongoDB is running and accessible
5. **Frontend Path:** Ensure frontend forms directory exists

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Frontend forms directory not found"**
   - Check if the path `E-marketplace/src/app/Jay_2/data/all_forms/` exists
   - Verify you're running from the correct directory

2. **"MongoDB connection error"**
   - Ensure MongoDB is running
   - Check your `MONGODB_URI` environment variable

3. **"Form validation error"**
   - Check if form JSON files are valid
   - Ensure required fields are present

4. **"Duplicate key error"**
   - Forms with same ID already exist in database
   - Use `cleanup` command to remove existing forms first

### **Recovery:**

If migration fails, you can:
1. Use `cleanup` to remove all forms
2. Fix any issues in frontend JSON files
3. Run migration again

## 📈 Migration Results

The migration script provides detailed results:
- ✅ Created forms count
- ✅ Updated forms count
- ❌ Error count with details
- 📊 Validation summary
- 🔍 Structure verification

## 🎯 Next Steps

After successful migration:
1. Update frontend `simpleApiConfig.js` to use backend
2. Test form operations end-to-end
3. Verify all forms work correctly
4. Remove old JSON files (optional)
