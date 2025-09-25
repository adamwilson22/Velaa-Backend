# Velaa Vehicle Management System - Backend

A comprehensive vehicle inventory management system built with Node.js, Express.js, and MongoDB.

## 🚀 Features

### 🔐 Authentication & User Management
- User registration with warehouse details
- OTP verification via SMS
- JWT-based authentication
- Role-based access control (Admin, Manager, User)
- Password reset functionality
- Profile management

### 🚗 Vehicle Management
- Complete vehicle inventory tracking
- Vehicle status management
- Image and document uploads
- Maintenance history tracking
- Search and filtering
- Vehicle statistics and analytics

### 👥 Client Management
- Individual and company client profiles
- Document management
- Credit limit tracking
- Communication preferences
- Client relationship tracking

### 💰 Billing & Finance
- Invoice generation and management
- Payment tracking
- Outstanding balance monitoring
- Tax calculations
- Payment reminders
- Financial reporting

### 📊 Dashboard & Analytics
- Real-time statistics
- Revenue trends
- Inventory aging reports
- Performance metrics
- Custom reports

### 🔔 Notifications
- SMS notifications via Twilio
- Email notifications
- In-app notifications
- Payment reminders
- Document expiry alerts

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with Sharp for image processing
- **SMS Service**: Twilio
- **Email Service**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Built-in API documentation

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (v5.0 or higher)
- npm (v8.0.0 or higher)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd velaa-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/velaa_vehicle_management
   JWT_SECRET=your-super-secret-jwt-key
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-email-password
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Once the server is running, you can access:

- **API Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`
- **Base API URL**: `http://localhost:5000/api`

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password recovery
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Add new vehicle
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/search` - Search vehicles
- `POST /api/vehicles/:id/images` - Upload vehicle images

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add new client
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `GET /api/clients/search` - Search clients

### Billing
- `GET /api/billing` - Get all billing records
- `POST /api/billing` - Create billing record
- `POST /api/billing/:id/payment` - Record payment
- `GET /api/billing/outstanding` - Get outstanding balances

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/chart-data` - Get chart data

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Database connection
│   │   ├── jwt.js       # JWT configuration
│   │   └── sms.js       # SMS service configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js      # Authentication middleware
│   │   ├── validation.js # Validation middleware
│   │   ├── upload.js    # File upload middleware
│   │   └── rateLimiter.js # Rate limiting
│   ├── models/          # Mongoose models
│   │   ├── User.js      # User model
│   │   ├── Vehicle.js   # Vehicle model
│   │   ├── Client.js    # Client model
│   │   ├── Billing.js   # Billing model
│   │   └── Notification.js # Notification model
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── vehicles.js  # Vehicle routes
│   │   ├── clients.js   # Client routes
│   │   ├── billing.js   # Billing routes
│   │   └── dashboard.js # Dashboard routes
│   ├── services/        # Business logic services
│   │   ├── smsService.js    # SMS service
│   │   ├── emailService.js  # Email service
│   │   └── uploadService.js # File upload service
│   ├── utils/           # Utility functions
│   │   ├── helpers.js   # Helper functions
│   │   ├── validators.js # Custom validators
│   │   └── constants.js # Application constants
│   └── app.js           # Express app configuration
├── uploads/             # File upload directory
├── package.json         # Dependencies and scripts
├── server.js           # Server entry point
└── README.md           # This file
```

## 🔒 Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Validation**: Input validation using Joi
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable CORS policy
- **Data Sanitization**: MongoDB injection and XSS prevention
- **File Upload Security**: File type and size validation

## 📝 Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Format code with Prettier

# Database
npm run seed        # Seed database with sample data
npm run migrate     # Run database migrations
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/velaa` |
| `JWT_SECRET` | JWT secret key | Required |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Required for SMS |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Required for SMS |
| `SMTP_USER` | SMTP email username | Required for email |
| `SMTP_PASS` | SMTP email password | Required for email |

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "velaa-backend"

# Monitor the application
pm2 monit

# View logs
pm2 logs velaa-backend
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

The application includes built-in monitoring endpoints:

- **Health Check**: `/health` - Server health status
- **System Metrics**: `/api/dashboard/system-health` - System performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@velaa.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and management
  - Vehicle inventory management
  - Client management
  - Billing and payment tracking
  - Dashboard and analytics
  - SMS and email notifications

---

**Made with ❤️ by the Velaa Team**
