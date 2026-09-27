# Book My Photographer - Backend API

A very robust NestJS backend application with MongoDB integration for a photographer booking platform.

## 🚀 Features

- **NestJS Framework** - Modern, scalable Node.js framework
- **MongoDB with Mongoose** - ODM for MongoDB with schema validation
- **RESTful API** - Well-structured endpoints with Swagger documentation
- **Data Validation** - Class-validator with DTOs for request validation
- **Environment Configuration** - ConfigModule for environment management
- **Docker Support** - Multi-stage Dockerfile and docker-compose
- **Health Checks** - Built-in health monitoring
- **Pagination & Filtering** - Advanced query capabilities
- **Error Handling** - Comprehensive exception handling

## 📋 Prerequisites

- Node.js 20+
- MongoDB 7.0+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Local Development

1. **Clone and navigate to the project**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB** (if not using Docker)
   ```bash
   # Using MongoDB locally
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

### Docker Development

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f backend
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## 📁 Project Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
├── photographers/             # Photographers module
│   ├── dto/                   # Data Transfer Objects
│   ├── schemas/               # Mongoose schemas
│   ├── photographers.controller.ts
│   ├── photographers.service.ts
│   └── photographers.module.ts
├── bookings/                  # Bookings module
│   ├── dto/
│   ├── schemas/
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
└── users/                     # Users module
    ├── dto/
    ├── schemas/
    ├── users.controller.ts
    ├── users.service.ts
    └── users.module.ts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/book-my-photographer` |
| `JWT_SECRET` | JWT signing secret | Required for production |
| `JWT_EXPIRATION` | JWT token expiration | `1d` |

## 📚 API Documentation

Swagger UI is available at: `http://localhost:3001/api/docs`

### Main Endpoints

#### Photographers
- `POST /api/photographers` - Create photographer
- `GET /api/photographers` - List photographers (paginated, filterable)
- `GET /api/photographers/stats` - Get statistics
- `GET /api/photographers/specialties` - Get all specialties
- `GET /api/photographers/:id` - Get photographer by ID
- `PATCH /api/photographers/:id` - Update photographer
- `DELETE /api/photographers/:id` - Delete photographer

#### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings (paginated, filterable)
- `GET /api/bookings/stats` - Get booking statistics
- `GET /api/bookings/photographer/:photographerId` - Bookings by photographer
- `GET /api/bookings/user/:userId` - Bookings by user
- `GET /api/bookings/photographer/:photographerId/upcoming` - Upcoming bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PATCH /api/bookings/:id` - Update booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking

#### Users
- `POST /api/users` - Create user
- `POST /api/users/login` - User login
- `GET /api/users` - List users (paginated, filterable)
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🐳 Docker Commands

```bash
# Build image
docker build -t book-my-photographer-backend .

# Run container
docker run -p 3001:3001 --env-file .env book-my-photographer-backend

# Development with docker-compose
docker-compose -f docker-compose.yml up -d

# Production with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:debug` | Start with debugger |
| `npm run start:prod` | Start production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- Input validation and sanitization
- CORS configuration
- Helmet.js ready (add `@nestjs/platform-express` helmet)
- Rate limiting ready (add `@nestjs/throttler`)

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure MongoDB with authentication
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging
7. Configure backup strategy for MongoDB

### Environment-Specific Configs

Create `.env.production` for production overrides:
```env
NODE_ENV=production
MONGODB_URI=mongodb://user:pass@host:27017/db?authSource=admin
JWT_SECRET=your-very-secure-random-secret-key
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the logs for error details #Bookmyphotographer_backend
