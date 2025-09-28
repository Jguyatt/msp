# RenewalTracker - Production Ready MSP Contract Management

A full-stack React application for MSPs to track contract renewals with CSV upload, automated reminders, and production deployment capabilities.

## 🚀 Features

### ✅ **Complete Application**
- **Landing Page** with Clerk authentication
- **Dashboard** with real-time KPIs and contract overview
- **CSV Upload** with validation and error handling
- **Contract Management** with search, filtering, and sorting
- **Backend API** with SQLite database
- **Production Ready** with Heroku deployment support

### 📊 **Dashboard Features**
- Total contracts tracked
- Contracts expiring this month
- Reminders sent this week
- Estimated savings calculation
- Real-time data from database

### 📁 **CSV Upload**
- Downloadable CSV template
- File validation (CSV only, 10MB limit)
- Data validation with detailed error reporting
- Automatic contract processing and storage

### 🔧 **Backend API**
- Express.js server with SQLite database
- RESTful API endpoints
- File upload handling with multer
- CSV parsing and validation
- User-specific data isolation

## 🛠 Tech Stack

**Frontend:**
- React 18 with functional components
- React Router for navigation
- TailwindCSS for styling
- Lucide React for icons
- Clerk for authentication

**Backend:**
- Node.js with Express.js
- SQLite database
- Multer for file uploads
- CSV parser for data processing
- CORS for cross-origin requests

## 🚀 Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```
   This starts both the React app (port 3000) and the backend API (port 5000).

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/api

### Production

1. **Build the React app:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm run server
   ```

## 📋 API Endpoints

### Contracts
- `GET /api/contracts` - Get all contracts for the user
- `POST /api/contracts/upload` - Upload CSV file with contracts

### KPIs
- `GET /api/kpis` - Get dashboard KPI data

## 📁 CSV Format

Download the template or use this format:

| Column | Description | Example |
|--------|-------------|---------|
| Vendor | Company name | Microsoft |
| Contract Name | Contract identifier | Office 365 Business Premium |
| Start Date | YYYY-MM-DD format | 2024-01-01 |
| End Date | YYYY-MM-DD format | 2025-01-01 |
| Value (USD) | Contract value | 1500.00 |
| Contact Email | Valid email address | admin@company.com |

## 🚀 Deployment

### Heroku

1. **Install Heroku CLI**

2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

### Other Platforms

The app includes a `Procfile` for easy deployment to any platform that supports Node.js.

## 🔧 Configuration

### Environment Variables

Create a `.env` file:
```env
PORT=5000
NODE_ENV=development
```

### Database

The app uses SQLite for development and can be easily configured for PostgreSQL in production.

## 📱 Usage

1. **Register/Login** using Clerk authentication
2. **Upload Contracts** via CSV file
3. **View Dashboard** with real-time KPIs
4. **Manage Contracts** with search and filtering
5. **Track Renewals** with automated reminders

## 🎯 Production Features

- **File Upload Validation** - CSV only, 10MB limit
- **Data Validation** - Email, date, and required field validation
- **Error Handling** - Comprehensive error messages
- **Database Integration** - SQLite with user isolation
- **Responsive Design** - Mobile-friendly interface
- **Real-time Updates** - Live KPI calculations

## 🔒 Security

- **User Authentication** via Clerk
- **File Upload Validation** - Type and size restrictions
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Controlled cross-origin access

## 📈 Scalability

- **Database Ready** - Easy migration to PostgreSQL
- **API Architecture** - RESTful design for scaling
- **File Processing** - Efficient CSV parsing
- **Caching Ready** - KPI data can be cached

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:** Make sure ports 3000 and 5000 are available
2. **File upload errors:** Check file size and format
3. **Database errors:** Ensure SQLite database is writable

### Development

- Check browser console for frontend errors
- Check server logs for backend errors
- Verify API endpoints with curl or Postman

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Ready for production use!** 🚀

The application is fully functional with CSV upload, database storage, and real-time dashboard updates. Perfect for MSPs to track contract renewals and never miss important deadlines.# msp
