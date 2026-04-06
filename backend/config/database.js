const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI missing in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log('✅ MongoDB connected:', conn.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);

    if (error.message.includes('bad auth')) {
      console.error('   FIX: Wrong username/password in MONGODB_URI');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('   FIX: Check cluster name in URI');
    } else if (error.message.includes('timed out')) {
      console.error('   FIX: Resume cluster at MongoDB Atlas');
    } else {
      console.error('   FIX: Atlas → Network Access → Add 0.0.0.0/0');
    }

    process.exit(1);
  }
};

module.exports = connectDB;