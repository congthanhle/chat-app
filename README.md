# Chat App with Video Call Feature

A real-time chat application built with React, Vite, and Firebase, featuring integrated video calling capabilities.

## Features

### Chat Functionality
- Real-time messaging with Firebase Firestore
- Multiple chat rooms
- User authentication and username management
- Message timestamps and sender identification

### Video Call Feature
- **Two-person limit**: Only 2 people can join a video call at a time
- **Call initiation**: Any user in a room can start a video call
- **Call notifications**: System messages notify when someone joins or leaves a call
- **WebRTC integration**: Peer-to-peer video and audio communication
- **Call controls**: Toggle video/audio, end call functionality
- **Session management**: Video call sessions are automatically cleaned up when ended
- **Chat continuity**: Chat remains available during and after video calls

### Video Call Workflow
1. User clicks "Video Call" button in a chat room
2. System creates a call session and notifies the room
3. Other users see an incoming call notification
4. Maximum 2 users can join the video call
5. WebRTC handles peer-to-peer connection establishment
6. Users can toggle video/audio or end the call
7. Call session is cleaned up when ended, chat continues normally

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Firebase Firestore
- **Video Calling**: WebRTC
- **Styling**: Tailwind CSS
- **Icons**: PrimeIcons

## Development Setup

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Usage

1. Start the development server: `npm run dev`
2. Navigate to the provided localhost URL
3. Create or join a chat room
4. Set your username
5. Start chatting and use the "Video Call" button for video communication

## Firebase Configuration

Make sure to configure your Firebase project and update the `fireBaseConfig.js` file with your project credentials.
