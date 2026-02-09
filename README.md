# Business Billing Software

A comprehensive full-stack billing and business management system built with React, Node.js, Express, and MongoDB.

## 🚀 Features

### User Management
- Role-based access control (Admin, User)
- User authentication with JWT
- Profile management
- Password change functionality

### Client Management
- Add, edit, and delete clients
- Client document uploads (Aadhaar, PAN, Photo)
- Client search and filtering
- Client history tracking

### Bill Management
- Create and manage bills
- Auto-fill client details
- Item management with autocomplete
- Payment tracking and history
- Multiple payment methods support
- Bill status management (Draft, Sent, Partial, Paid)
- Professional bill printing with company branding
- Admin can edit/delete paid bills

### Payment Management
- Add payments to bills
- Payment history tracking
- Multiple payment methods (Cash, Card, UPI, Bank Transfer, Cheque)
- Admin can delete payment records
- Automatic status updates based on payments

### Item Management
- Create and manage inventory items
- Active/Inactive item status
- Item search and filtering
- Price management

### Company Settings
- Company information management
- Logo upload
- Company details appear on printed bills
- GST number and contact information

### Reports & Analytics
- Dashboard with key metrics
- Revenue tracking
- Payment status overview
- Client statistics

### Expense Management
- Track business expenses
- Expense categories
- Document uploads for expenses
- Approval workflow

### Salary Management
- Employee salary tracking
- Salary history
- Payment records

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Joi** - Validation
- **Bcrypt** - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd business-billing-software
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend` directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/business-billing
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRE=2d
JWT_REFRESH_EXPIRE=30d
SKIP_RATE_LIMIT=true
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 6. Run the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## 👤 Default Admin Account

After starting the application, you can create an admin account or use the seed script:

```bash
cd backend
node src/seedUsers.js
```

Default credentials:
- **Email**: admin@example.com
- **Password**: admin123

## 📁 Project Structure

```
business-billing-software/
├── backend/
│   ├── src/
│   │   ├── middleware/      # Authentication, error handling, uploads
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── server.js        # Entry point
│   ├── uploads/             # File uploads directory
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store and slices
│   │   ├── utils/           # Utility functions
│   │   └── App.jsx          # Main app component
│   └── package.json
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting on API endpoints
- Input validation with Joi
- CORS configuration
- Helmet security headers

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Bills
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID
- `POST /api/bills` - Create new bill
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill
- `POST /api/bills/:id/payments` - Add payment
- `GET /api/bills/:id/payments` - Get payment history
- `DELETE /api/bills/:id/payments/:paymentId` - Delete payment (Admin only)

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Items
- `GET /api/items` - Get all items
- `GET /api/items/active` - Get active items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Company Settings
- `GET /api/company-settings` - Get company settings
- `PUT /api/company-settings` - Update company settings (Admin only)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/status` - Update user status

## 🎨 Key Features Explained

### Bill Printing
Bills are printed with professional formatting including:
- Company logo and information
- Client details
- Itemized list with quantities and prices
- Payment status and balance due
- Professional styling with company branding

### Payment Tracking
- Multiple payment methods supported
- Partial payment handling
- Automatic status updates
- Payment history with dates and amounts
- Admin can delete incorrect payments

### Role-Based Access
- **Admin**: Full access to all features, can manage users, edit paid bills
- **User**: Can manage their own bills, clients, and view their data

### File Uploads
- Client documents (Aadhaar, PAN, Photo)
- Company logo
- Expense receipts
- Automatic file organization

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify MongoDB port (default: 27017)

### Port Already in Use
- Change the PORT in backend `.env` file
- Kill the process using the port

### Rate Limiting Errors
- Set `SKIP_RATE_LIMIT=true` in backend `.env` for development
- Adjust rate limits in `server.js` if needed

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email your-email@example.com or create an issue in the repository.

## 🙏 Acknowledgments

- Material-UI for the component library
- Redux Toolkit for state management
- Express.js for the backend framework
- MongoDB for the database

---

Made with ❤️ for business management
