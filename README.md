
# LMS Real-Time Course Notification System

## 1. Project Overview

The LMS Real-Time Course Notification System is a backend application designed to manage courses, assignments, student dashboards, and real-time notifications.

It uses Node.js, Express.js, MySQL, Redis, and Socket.io.

## 2. Technologies Used

- Node.js
- Express.js
- MySQL
- Redis
- Socket.io
- Redis Pub/Sub
- JWT Authentication
- Passport Local Strategy
- bcryptjs
- HTML, CSS, JavaScript

## 3. Main Features

- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Role-based access for students and instructors
- Course creation and listing
- Redis caching for course data
- Assignment creation
- Real-time assignment notifications using Socket.io
- Redis Pub/Sub notifications
- Student dashboard
- Student leaderboard using Redis Sorted Sets

## 4. Project Structure

```text
lms-realtime/
├── config/
│   ├── db.js
│   ├── redis.js
│   └── passport.js
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── socketAuthMiddleware.js
├── models/
│   ├── User.js
│   ├── Course.js
│   └── Assignment.js
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── instructorRoutes.js
│   └── studentRoutes.js
├── socket/
│   └── socketHandler.js
├── pubsub/
│   ├── publisher.js
│   └── subscriber.js
├── public/
│   └── client.html
├── .env
├── .gitignore
├── app.js
├── package.json
└── README.md
```

## 5. Installation

Install the project dependencies:

```bash
npm install
```

Configure the MySQL database and Redis server.

Update the `.env` file with the appropriate database credentials and JWT secret.

Create the required MySQL database and tables before starting the application.

## 6. Run the Application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Base URL:

```text
http://localhost:5000
```

Notification client:

```text
http://localhost:5000/client.html
```

## 7. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | / | Check server status |
| POST | /api/v1/auth/register | Register a user |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/auth/me | Get logged-in user |
| GET | /api/v1/courses | List courses |
| GET | /api/v1/courses/:id | Get course details |
| POST | /api/v1/courses | Create a course |
| POST | /api/v1/instructor/assignments | Create an assignment |
| GET | /api/v1/instructor/courses/:courseId/assignments | Get course assignments |
| GET | /api/v1/students/dashboard | Student dashboard |
| GET | /api/v1/students/leaderboard | Get leaderboard |
| POST | /api/v1/students/leaderboard/score | Update student score |

Protected endpoints require a JWT token in the Authorization header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## 8. Redis Features

### Course Caching

Course listings are cached in Redis for 300 seconds. Creating a new course invalidates the cached course list.

### Redis Pub/Sub

Assignment notifications are published to the `assignment_notifications` channel.

### Leaderboard

Student scores are stored in a Redis Sorted Set to retrieve the top-ranked students.

## 9. Real-Time Notifications

Socket.io allows authenticated clients to join course rooms and receive assignment notifications.

## 10. Database

The application uses MySQL for users, courses, assignments, and course enrollments.

Create the database and required tables before testing the APIs.

## 11. Security

- Password hashing
- JWT authentication
- Role-based authorization
- Parameterized SQL queries
- Request body size limit

## 12. Future Enhancements

- Google OAuth authentication
- Assignment submission and grading
- Email notifications
- Administrative dashboard
- More comprehensive automated tests
