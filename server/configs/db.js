import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () =>
      console.log('Database connected')
    );

    await mongoose.connect(process.env.MONGODB_URL);
  } catch (error) {
    console.log('DB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
