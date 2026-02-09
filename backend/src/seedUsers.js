const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-billing';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`Database already has ${existingUsers} users. Skipping seed.`);
      process.exit(0);
    }

    // Create test users
    const testUsers = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'Admin',
        isActive: true
      },
      {
        email: 'john.doe@example.com',
        password: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'User',
        isActive: true
      },
      {
        email: 'jane.smith@example.com',
        password: 'user123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'User',
        isActive: true
      },
      {
        email: 'mike.johnson@example.com',
        password: 'user123',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'User',
        isActive: true
      },
      {
        email: 'sarah.wilson@example.com',
        password: 'user123',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'User',
        isActive: false
      }
    ];

    // Insert users
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Successfully created ${createdUsers.length} test users:`);
    
    createdUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 User seeding completed successfully!');
    console.log('\nTest login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: john.doe@example.com / user123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedUsers();