# Who's That?

"Who's That?" is a website where users can play the classic character elimantion guessing game with custom images.

https://whos-that.com

## Gameplay

A modern spin on the classic board game, players can upload sets of images to be used as "characters" in a game of question asking and deduction. In game, players are presented with a list of characters. Each player is shown which the character the opponent needs to guess from among that list. Players take turns asking each other yes-or-no questions to deduce the identity of the character they need to guess. The first player to guess their character correctly wins, but if a player guesses wrong they lose!

Players can play from a variety of already curated character lists that were uploaded and made public by other players, no account creation needed for this. Users can also create an account to upload and save their own images to create entirely personalized game boards.

## Project Structure

The repository is organized as a monorepo containing two applications. The `whos_that_front` directory contains the React frontend application, while `whos_that_server` houses the Express backend server. Shared TypeScript types and Zod schemas are imported across projects to ensure type-safety.

## Tech Stack

The frontend is built with TypeScript and React, Tailwind CSS for styling and Vite as the build tool. The application uses React Router for navigation and Socket.IO for real-time communication. The system supports multiple image formats including JPEG, PNG, WebP, and HEIC, with automatic image optimization and resizing to ensure consistent performance across all devices.

Image storage and delivery is managed through AWS S3 with CloudFront CDN for optimized content delivery. Images are processed client-side using Pica for high-quality resizing before upload, the to-heic package is used for format conversion.

The backend api runs on TypeScript, Node.js and Express. Socket.io powers the real-time game functionality, while DrizzleORM manages database operations. The database uses a code-first approach with the DrizzleORM schemas being the source of truth. A PostgreSQL database is hosted on Neon. BetterAuth handles authentication flows with support for social login providers. Email sign-up was forgone to mitigate spam.

## License

Code is provided for educational and review purposes only. All rights reserved.

