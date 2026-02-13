# Top - Personal & Social Ranking App

Create and share your personal rankings of anything - movies, music, books, food, and more!

## Project Structure

```
top/
├── backend/          # Node.js + Express API server
├── web/              # React + Vite web application
├── mobile/           # React Native + Expo mobile app
└── shared/           # Shared types and utilities
```

## Features

- **Create Categories**: Organize your rankings by topic (Top Movies, Best Albums, etc.)
- **Rank Items**: Drag-and-drop to reorder your favorites
- **Privacy Controls**: Keep rankings private or share them publicly
- **Social Features**: Follow users, like submissions, and discover trending content
- **Dark/Light Theme**: Automatic theme support
- **Cross-Platform**: Web and mobile apps

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (For mobile) Expo CLI: `npm install -g expo-cli`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API server will start at `http://localhost:3001`

### Web App Setup

```bash
cd web
npm install
npm run dev
```

The web app will start at `http://localhost:5173`

### Mobile App Setup

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go app on your phone, or press:
- `i` for iOS simulator
- `a` for Android emulator

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Categories
- `GET /api/categories` - List user's categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category with submissions
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/:id` - Get submission details
- `PUT /api/submissions/:id` - Update submission
- `DELETE /api/submissions/:id` - Delete submission
- `POST /api/submissions/reorder` - Reorder submissions
- `POST /api/submissions/:id/like` - Like submission
- `DELETE /api/submissions/:id/like` - Unlike submission

### Users & Social
- `GET /api/users/:username` - Get user profile
- `POST /api/users/:username/follow` - Follow user
- `DELETE /api/users/:username/follow` - Unfollow user

### Feed
- `GET /api/feed/trending` - Trending submissions
- `GET /api/feed/discover` - Discover categories
- `GET /api/feed/search` - Search content

## Tech Stack

**Backend**
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- JWT Authentication
- bcrypt password hashing
- Zod validation

**Web**
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand (state management)
- dnd-kit (drag and drop)

**Mobile**
- React Native
- Expo
- Expo Router
- TypeScript
- Zustand

## License

MIT
