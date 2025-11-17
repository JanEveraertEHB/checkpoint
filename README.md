# Checkpoint - Classroom Feedback & Progress Tracking

A web application for teachers and students to track learning progress through checkpoints and feedback.

## Features

### For Teachers
- Create and manage classrooms with academic year
- Generate unique invite codes for students to join
- Define learning checkpoints with descriptions
- Track student progress through checkpoints
- Provide rich text feedback to students
- Lock student feedback to prevent further edits
- View student timelines with both feedback and checkpoint achievements

### For Students
- Join classrooms using invite codes
- View next checkpoint to achieve
- Track personal progress through checkpoints
- Add self-feedback with rich text (WYSIWYG editor)
- Upload images to feedback submissions
- View timeline of feedback and checkpoint achievements
- Edit own feedback (unless locked by teacher)

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- React Router for navigation
- React-Quill for rich text editing
- DOMPurify for XSS protection
- Skeleton CSS framework
- Axios for API requests
- crypto-js for MD5 password hashing

### Backend
- Node.js with Express
- PostgreSQL database
- Knex.js query builder/migrations
- JWT authentication
- bcrypt password hashing
- Multer for file uploads
- Socket.io for real-time features

### Infrastructure
- Docker Compose for orchestration

## Project Structure

```
checkpoint/
├── docker-compose.yml          # Docker orchestration
├── images/
│   ├── api/                    # Backend API service
│   │   ├── src/
│   │   │   ├── server.js       # Express app entry
│   │   │   ├── routes/         # API endpoints
│   │   │   │   ├── users.js    # Auth & user management
│   │   │   │   ├── classrooms.js
│   │   │   │   ├── feedback.js
│   │   │   │   └── checkpoints.js
│   │   │   ├── db/
│   │   │   │   ├── db.js       # Database connection
│   │   │   │   └── migrations/ # Schema migrations
│   │   │   └── helpers/        # Utility functions
│   │   └── uploads/            # Uploaded images
│   └── vite_frontend/          # React frontend
│       ├── src/
│       │   ├── pages/          # Page components
│       │   ├── contexts/       # React contexts (Auth)
│       │   ├── services/       # API client
│       │   └── types/          # TypeScript interfaces
│       └── vite.config.ts      # Vite configuration
└── docs/
    └── style/                  # CSS styling reference
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (or use Docker)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.template .env
```

2. Configure the following variables in `.env`:
```
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=checkpoint
TOKEN_ENCRYPTION=your_jwt_secret
```

### Running with Docker

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database
- API server on port 3000
- Frontend dev server on port 5173

### Database Migrations

Run migrations to set up the database schema:

```bash
docker-compose exec api npx knex migrate:latest
```

### Local Development

**Backend:**
```bash
cd images/api
npm install
npm run dev
```

**Frontend:**
```bash
cd images/vite_frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /users/register` - Register new user
- `POST /users/login` - Login user
- `GET /users/validate_token` - Validate JWT token

### Classrooms
- `GET /classrooms` - List user's classrooms
- `GET /classrooms/:uuid` - Get classroom details
- `POST /classrooms` - Create classroom (teachers)
- `POST /classrooms/join/:invite_code` - Join classroom (students)
- `GET /classrooms/:uuid/invite` - Get invite code (teachers)

### Feedback
- `GET /feedback/classroom/:uuid/student/:student_uuid` - Get student feedback
- `GET /feedback/classroom/:uuid/my-feedback` - Get own feedback
- `POST /feedback` - Create feedback
- `PUT /feedback/:uuid` - Update feedback content
- `PUT /feedback/:uuid/lock` - Lock/unlock feedback (teachers)
- `POST /feedback/:uuid/images` - Upload images to feedback
- `DELETE /feedback/images/:image_uuid` - Delete feedback image

### Checkpoints
- `GET /checkpoints/classroom/:uuid` - List classroom checkpoints
- `POST /checkpoints` - Create checkpoint (teachers)
- `DELETE /checkpoints/:uuid` - Delete checkpoint (teachers)
- `GET /checkpoints/classroom/:uuid/student/:student_uuid/progress` - Get student progress
- `POST /checkpoints/:checkpoint_uuid/students/:student_uuid` - Mark checkpoint reached
- `DELETE /checkpoints/:checkpoint_uuid/students/:student_uuid` - Unmark checkpoint

## Security Features

- Passwords hashed with MD5 on frontend before transmission
- Server-side password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (teacher/student)
- Input sanitization with DOMPurify
- File upload restrictions (image types only, 10MB limit)
- CORS configuration

## Author

Jan Everaert (jan.everaert@ehb.be)

## License

MIT
