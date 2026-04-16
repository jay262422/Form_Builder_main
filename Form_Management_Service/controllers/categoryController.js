const fs = require('fs').promises;
const path = require('path');
const { logAuditEvent } = require('../utils/auditLogger');
const {
  successResponse,
  errorResponse
} = require('../utils/responseHelper');

// Helper function to get the data directory path
const getDataDirectory = () => {
  // For development, we'll store data in a local data directory
  // In production, this could be configured via environment variables
  return path.join(__dirname, '..', 'data');
};

// Helper function to ensure data directory exists
const ensureDataDirectory = async () => {
  const dataDir = getDataDirectory();
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
  return dataDir;
};

// Category management
const getCategories = async (req, res) => {
  try {
    const dataDir = await ensureDataDirectory();
    const filePath = path.join(dataDir, 'categoryData.json');
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return successResponse(res, JSON.parse(data), 'Categories retrieved successfully');
    } catch (error) {
      // If file doesn't exist, return empty structure
      return successResponse(res, {
        mainCategories: [],
        categories: [],
        uncategorized: []
      }, 'Categories retrieved successfully (empty)');
    }
  } catch (error) {
    console.error('❌ Failed to load categories:', error);
    return errorResponse(res, error.message || 'Failed to load categories', 500);
  }
};

const saveCategories = async (req, res) => {
  try {
    const dataDir = await ensureDataDirectory();
    const filePath = path.join(dataDir, 'categoryData.json');
    
    console.log('🔧 Saving categories to:', filePath);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf8');

    await logAuditEvent(req, {
      action: 'CATEGORIES_SAVED',
      entityType: 'category_config',
      entityId: 'categoryData',
      metadata: {
        mainCategoriesCount: Array.isArray(req.body?.mainCategories) ? req.body.mainCategories.length : 0,
        categoriesCount: Array.isArray(req.body?.categories) ? req.body.categories.length : 0
      }
    });
    
    return successResponse(res, null, 'Categories saved successfully');
  } catch (error) {
    console.error('❌ Failed to save categories:', error);
    return errorResponse(res, error.message || 'Failed to save categories', 500);
  }
};

// Label mapping management
const getLabelMappings = async (req, res) => {
  try {
    const dataDir = await ensureDataDirectory();
    const filePath = path.join(dataDir, 'productLabelMappings.json');
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return successResponse(res, JSON.parse(data), 'Label mappings retrieved successfully');
    } catch (error) {
      // If file doesn't exist, return empty structure
      return successResponse(res, {
        products: [],
        unassignedGroups: []
      }, 'Label mappings retrieved successfully (empty)');
    }
  } catch (error) {
    console.error('❌ Failed to load label mappings:', error);
    return errorResponse(res, error.message || 'Failed to load label mappings', 500);
  }
};

const saveLabelMappings = async (req, res) => {
  try {
    const dataDir = await ensureDataDirectory();
    const filePath = path.join(dataDir, 'productLabelMappings.json');
    
    console.log('🔧 Saving label mappings to:', filePath);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf8');

    await logAuditEvent(req, {
      action: 'LABEL_MAPPINGS_SAVED',
      entityType: 'category_config',
      entityId: 'productLabelMappings',
      metadata: {
        productsCount: Array.isArray(req.body?.products) ? req.body.products.length : 0,
        unassignedGroupsCount: Array.isArray(req.body?.unassignedGroups) ? req.body.unassignedGroups.length : 0
      }
    });
    
    return successResponse(res, null, 'Label mappings saved successfully');
  } catch (error) {
    console.error('❌ Failed to save label mappings:', error);
    return errorResponse(res, error.message || 'Failed to save label mappings', 500);
  }
};

module.exports = {
  getCategories,
  saveCategories,
  getLabelMappings,
  saveLabelMappings
};
