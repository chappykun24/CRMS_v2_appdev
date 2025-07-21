# CRMS_V2 - Class Record Management System

A comprehensive class record management system for universities built with React Native and Expo.

## Features

- **Role-based Access Control**: Different access levels for Faculty, Staff, Program Chairs, and Deans
- **Syllabi Management**: Create, edit, and manage course syllabi
- **Student Management**: Comprehensive student record management
- **Course Management**: Manage courses and academic programs
- **Reports and Analytics**: Generate reports and view analytics
- **Modern UI/UX**: Clean and intuitive user interface

## Hardware Back Button Behavior

The app implements custom hardware back button handling to provide a better user experience:

### When Logged Out (Public Pages)
- Hardware back button works normally, allowing users to navigate back through the app's navigation stack
- Users can freely navigate between public pages (Home, Login, Help, etc.)

### When Logged In (Authenticated Pages)
- Hardware back button shows an "Exit App" confirmation dialog
- Users must confirm if they want to exit the application
- This prevents accidental logout when users intend to exit the app
- The app will quit completely instead of logging out

### Welcome Page
- Hardware back button works normally, allowing users to navigate back if they came from another app

## Technical Implementation

The hardware back button handling is implemented in `app/_layout.jsx` using:
- React Native's `BackHandler` API
- Expo's `expo-application` for reliable app exit functionality
- Custom utility function (`utils/appExit.js`) for better error handling and fallbacks

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Dependencies

- React Native 0.79.5
- Expo SDK 53
- Expo Router for navigation
- React Native AsyncStorage for data persistence
- Expo Application for app exit functionality

## Project Structure

```
CRMS_V2/
├── app/                    # Main application screens
├── components/             # Reusable UI components
├── contexts/              # React contexts (UserContext)
├── utils/                 # Utility functions
├── types/                 # Type definitions and sample data
└── assets/                # Images and static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
