# Looking App

Looking is a cross-platform mobile application for lost-and-found and errand services, connecting requesters with reporters. Built with React Native (Expo) and Node.js.

## 📱 Features

- **User Authentication**: Sign up, Login, and Profile management.
- **Request System**: Post requests for lost items or errands with photos, location, and rewards.
- **Real-time Chat**: Chat with other users to coordinate tasks or return items.
- **Map Integration**: View requests on a map and pick locations easily.
- **Payment System**: Secure reward payments using PortOne (Iamport).

## 🛠 Tech Stack

### Frontend

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State/API**: Axios, React Hooks
- **Maps**: react-native-maps, expo-location
- **Payment**: iamport-react-native

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.io
- **Authentication**: JWT, bcryptjs

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- Expo Go app (on mobile) or Android/iOS Simulator

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure `.env`:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/looking_db"
   JWT_SECRET="your_jwt_secret"
   PORT=3000
   ```

4. Push database schema:

   ```bash
   npx prisma db push
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npx expo start
   ```

4. Scan the QR code with Expo Go or press `a` for Android Emulator / `i` for iOS Simulator.

## 📱 Screens

- **Login/Signup**: Entry point for users.
- **Home**: List and Map view of active requests.
- **Create Request**: Form to post a new request.
- **Request Detail**: Detailed view of a request with "Pay Reward" option.
- **Chat List**: List of active conversations.
- **Chat Room**: Real-time messaging interface.
- **Profile**: User stats and settings.

## 📦 Build & Deploy

This project is configured for **EAS Build**.

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Build for Android:

   ```bash
   eas build --platform android --profile preview
   ```

4. Build for iOS:

   ```bash
   eas build --platform ios --profile preview
   ```
# 1215-app
