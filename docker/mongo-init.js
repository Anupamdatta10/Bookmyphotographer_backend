// MongoDB initialization script
// This runs when the MongoDB container starts for the first time

db = db.getSiblingDB('book-my-photographer');

// Create collections with validation
db.createCollection('photographers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'phone', 'address'],
      properties: {
        name: { bsonType: 'string', minLength: 2, maxLength: 100 },
        email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
        phone: { bsonType: 'string', minLength: 10, maxLength: 20 },
        address: { bsonType: 'string', minLength: 5, maxLength: 200 },
        specialties: { bsonType: 'array', items: { bsonType: 'string' } },
        bio: { bsonType: 'string', maxLength: 2000 },
        experienceYears: { bsonType: 'int', minimum: 0 },
        pricePerHour: { bsonType: 'double', minimum: 0 },
        portfolioUrl: { bsonType: 'string' },
        profileImageUrl: { bsonType: 'string' },
        isAvailable: { bsonType: 'bool' },
        rating: { bsonType: 'double', minimum: 0, maximum: 5 },
        totalReviews: { bsonType: 'int', minimum: 0 },
        userId: { bsonType: 'objectId' },
      },
    },
  },
});

db.createCollection('bookings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['photographerId', 'userId', 'eventDate', 'eventLocation'],
      properties: {
        photographerId: { bsonType: 'objectId' },
        userId: { bsonType: 'objectId' },
        eventDate: { bsonType: 'date' },
        eventLocation: { bsonType: 'string', minLength: 5, maxLength: 200 },
        status: { enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] },
        durationHours: { bsonType: 'int', minimum: 1 },
        totalPrice: { bsonType: 'double', minimum: 0 },
        notes: { bsonType: 'string', maxLength: 1000 },
        specialRequirements: { bsonType: 'string', maxLength: 1000 },
        confirmedAt: { bsonType: 'date' },
        completedAt: { bsonType: 'date' },
        cancellationReason: { bsonType: 'string', maxLength: 500 },
      },
    },
  },
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { bsonType: 'string', minLength: 2, maxLength: 100 },
        email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
        password: { bsonType: 'string', minLength: 8 },
        role: { enum: ['client', 'photographer', 'admin'] },
        phone: { bsonType: 'string', maxLength: 20 },
        address: { bsonType: 'string', maxLength: 200 },
        profileImageUrl: { bsonType: 'string' },
        isActive: { bsonType: 'bool' },
        lastLoginAt: { bsonType: 'date' },
        photographerProfileId: { bsonType: 'objectId' },
      },
    },
  },
});

// Create indexes
db.photographers.createIndex({ email: 1 }, { unique: true });
db.photographers.createIndex({ specialties: 1 });
db.photographers.createIndex({ isAvailable: 1 });
db.photographers.createIndex({ rating: -1 });
db.photographers.createIndex({ pricePerHour: 1 });
db.photographers.createIndex({ createdAt: -1 });

db.bookings.createIndex({ photographerId: 1 });
db.bookings.createIndex({ userId: 1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ eventDate: 1 });
db.bookings.createIndex({ createdAt: -1 });
db.bookings.createIndex({ photographerId: 1, eventDate: 1 });
db.bookings.createIndex({ userId: 1, eventDate: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });

// Insert sample data for development
if (process.env.NODE_ENV !== 'production') {
  // Sample photographers
  db.photographers.insertMany([
    {
      name: 'John Smith',
      email: 'john.smith@photographer.com',
      phone: '+1234567890',
      address: '123 Photography Lane, New York, NY 10001',
      specialties: ['Wedding', 'Portrait', 'Event'],
      bio: 'Professional wedding and portrait photographer with 10+ years of experience.',
      experienceYears: 10,
      pricePerHour: 200,
      portfolioUrl: 'https://johnsmithphotography.com',
      profileImageUrl: 'https://example.com/john-smith.jpg',
      isAvailable: true,
      rating: 4.8,
      totalReviews: 127,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@photographer.com',
      phone: '+1234567891',
      address: '456 Camera Street, Los Angeles, CA 90001',
      specialties: ['Wedding', 'Engagement', 'Maternity'],
      bio: 'Award-winning wedding photographer specializing in natural light photography.',
      experienceYears: 8,
      pricePerHour: 250,
      portfolioUrl: 'https://sarahjohnsonphoto.com',
      profileImageUrl: 'https://example.com/sarah-johnson.jpg',
      isAvailable: true,
      rating: 4.9,
      totalReviews: 89,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@photographer.com',
      phone: '+1234567892',
      address: '789 Lens Avenue, Chicago, IL 60601',
      specialties: ['Corporate', 'Event', 'Headshot'],
      bio: 'Corporate and event photographer with expertise in professional headshots.',
      experienceYears: 12,
      pricePerHour: 180,
      portfolioUrl: 'https://michaelchenphoto.com',
      profileImageUrl: 'https://example.com/michael-chen.jpg',
      isAvailable: true,
      rating: 4.7,
      totalReviews: 156,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Sample users
  db.users.insertMany([
    {
      name: 'Admin User',
      email: 'admin@bookmyphotographer.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // password: admin123
      role: 'admin',
      phone: '+1234567800',
      address: '100 Admin Blvd, New York, NY 10001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Jane Client',
      email: 'jane.client@example.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // password: client123
      role: 'client',
      phone: '+1234567801',
      address: '200 Client Ave, Los Angeles, CA 90001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  print('Sample data inserted successfully');
}

print('MongoDB initialization completed');