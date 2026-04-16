# Form Management Service Migration Guide

This guide explains how to migrate frontend JSON data to the MongoDB-backed Form Management Service.

## 📁 Project Structure

```
WAY2REACH-WEB-BACKEND/Form_Management_Service/
├── models/
│   ├── Form.js (enhanced)
│   ├── DynamicMapping.js (enhanced)
│   ├── FieldOption.js (enhanced)
│   └── Submission.js
├── scripts/
│   ├── migrateData.js (main migration script)
│   └── checkAllData.js (verification script)
├── MIGRATION_GUIDE.md (this file)
├── MIGRATION_SUMMARY.md (migration results)
└── run-migration.bat (Windows batch file)
```

## 🗄️ Database Schema

### Form Model
- **Structure**: One document per form with complete schema
- **Key Fields**: `id`, `name`, `description`, `type`, `schema`, `createdAt`, `updatedAt`, `isExample`, `metadata`
- **Schema**: Stored as `mongoose.Schema.Types.Mixed` to preserve complete structure

### Field Option Model
- **Structure**: One document per option type with all options in an array
- **Key Fields**: `optionType`, `options[]`, `isActive`, `metadata`
- **Example**: All industry options stored in a single document

### Dynamic Mapping Model
- **Structure**: One document per mapping with complete mapping data
- **Key Fields**: `id`, `name`, `description`, `parentField`, `childField`, `parentOptionType`, `childOptionType`, `mapping`, `isActive`, `metadata`

## 🚀 Migration Process

### Prerequisites
1. MongoDB running locally or accessible via connection string
2. Node.js and npm installed
3. Frontend JSON files available in the expected locations

### Step 1: Environment Setup
1. Copy `config.env.example` to `config.env`
2. Update the MongoDB connection string in `config.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/form_management
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Migration
```bash
# Option 1: Using batch file (Windows)
run-migration.bat

# Option 2: Direct execution
node scripts/migrateData.js
```

### Step 4: Verify Migration
```bash
node scripts/checkAllData.js
```

## 📊 Expected Results

After successful migration, you should see:

### Forms Collection
- **Total**: 9 forms
- **Source**: `E-marketplace/src/app/Jay_2/data/all_forms/`
- **Structure**: Complete form schemas with sections and fields

### Field Options Collection
- **Total**: 21 option types
- **Source**: `E-marketplace/src/app/Jay_2/data/fieldOptions.json`
- **Structure**: One document per option type with all options

### Dynamic Mappings Collection
- **Total**: 4 mappings
- **Source**: `E-marketplace/src/app/Jay_2/data/dynamicMappings.json`
- **Structure**: One document per mapping with complete mapping data

## 🔧 Available Scripts

### Main Scripts
1. **`migrateData.js`** - Complete migration script
   - Migrates forms, field options, and dynamic mappings
   - Handles duplicates gracefully
   - Provides detailed progress output

2. **`checkAllData.js`** - Verification script
   - Shows current database status
   - Displays counts and summaries
   - Lists all imported data

### Batch Files
- **`run-migration.bat`** - Windows batch file to run migration
- **`killport.bat`** - Kill process on specific port (if needed)

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `config.env`
   - Verify network connectivity

2. **File Not Found Errors**
   - Ensure frontend JSON files exist in expected locations
   - Check file paths in migration script

3. **Duplicate Key Errors**
   - Migration handles duplicates automatically
   - Existing data will be skipped

4. **Schema Validation Errors**
   - Check JSON file format
   - Ensure required fields are present

### Error Recovery

If migration fails:
1. Check console output for specific error messages
2. Verify MongoDB connection and permissions
3. Run verification script to check current state
4. Re-run migration (duplicates will be skipped)

## 📈 Performance Notes

- **Indexes**: All collections have appropriate indexes for optimal performance
- **Batch Processing**: Migration processes data in batches to avoid memory issues
- **Error Handling**: Individual record failures don't stop the entire migration

## 🔄 Re-running Migration

The migration script is designed to be idempotent:
- Existing records are detected and skipped
- New records are added
- No data is lost or overwritten

To re-run migration:
```bash
node scripts/migrateData.js
```

## 📞 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify MongoDB connection and permissions
3. Run the verification script to check data integrity
4. Review this guide for troubleshooting steps

## ✅ Migration Status

The migration is designed to be safe and repeatable. All data is preserved and the process can be run multiple times without issues. 