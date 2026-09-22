const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/form_management';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connected successfully');

    const FieldOption = require('../models/FieldOption');
    await FieldOption.updateMany(
      { ownerId: null, isTemplate: { $ne: true } },
      { $set: { isTemplate: true } }
    );
    try {
      await FieldOption.collection.dropIndex('optionType_1');
    } catch (indexError) {
      if (indexError?.codeName !== 'IndexNotFound' && indexError?.code !== 27) {
        console.warn('Could not replace the old option type index:', indexError.message);
      }
    }
    try {
      await FieldOption.syncIndexes();
    } catch (syncError) {
      console.warn('Could not sync option set indexes:', syncError.message);
    }

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;