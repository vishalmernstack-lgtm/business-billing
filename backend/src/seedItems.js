const mongoose = require('mongoose')
const Item = require('./models/Item')
const User = require('./models/User')
require('dotenv').config()

const defaultItems = [
  {
    name: 'Consultation Fee',
    description: 'General consultation service',
    price: 500,
    category: 'Service'
  },
  {
    name: 'Document Processing',
    description: 'Processing of legal documents',
    price: 200,
    category: 'Service'
  },
  {
    name: 'Form Filling',
    description: 'Government form filling service',
    price: 100,
    category: 'Service'
  },
  {
    name: 'Photocopy',
    description: 'Document photocopying',
    price: 2,
    category: 'Service'
  },
  {
    name: 'Printing',
    description: 'Document printing service',
    price: 5,
    category: 'Service'
  },
  {
    name: 'Aadhaar Services',
    description: 'Aadhaar card related services',
    price: 50,
    category: 'Government'
  },
  {
    name: 'PAN Services',
    description: 'PAN card related services',
    price: 100,
    category: 'Government'
  },
  {
    name: 'Passport Services',
    description: 'Passport application services',
    price: 300,
    category: 'Government'
  },
  {
    name: 'Bank Account Opening',
    description: 'Bank account opening assistance',
    price: 150,
    category: 'Banking'
  },
  {
    name: 'Loan Application',
    description: 'Loan application assistance',
    price: 500,
    category: 'Banking'
  }
]

const seedItems = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find an admin user to assign as creator
    let adminUser = await User.findOne({ role: 'Admin' })
    
    if (!adminUser) {
      // Create a default admin user if none exists
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@system.com',
        password: 'admin123', // This will be hashed by the pre-save middleware
        role: 'Admin',
        isActive: true
      })
      await adminUser.save()
      console.log('Created default admin user')
    }

    // Clear existing items
    await Item.deleteMany({})
    console.log('Cleared existing items')

    // Create default items
    const itemsWithCreator = defaultItems.map(item => ({
      ...item,
      createdBy: adminUser._id
    }))

    await Item.insertMany(itemsWithCreator)
    console.log(`Created ${defaultItems.length} default items`)

    console.log('Seed completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seedItems()