# Overview

This is a full-stack web application that provides an AI-powered chat interface integrated with AWS Bedrock AI agents and S3 document management. The application allows users to have conversations with an AI agent while accessing and viewing reports stored in S3. It features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: 
  - Main chat interface for AI conversations
  - Reports sidebar for S3 document browsing
  - Modal system for report viewing
  - Responsive design with mobile support

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful endpoints for chat sessions, messages, and reports
- **File Structure**: Modular route handlers with separate storage abstraction layer

## Database Schema
- **Users**: Basic user management with username/password
- **Chat Sessions**: Individual conversation sessions with unique session IDs
- **Chat Messages**: Message history with user/agent distinction
- **Reports**: Metadata for S3-stored documents with file paths and metadata

## Authentication & Authorization
- **Session-based Authentication**: Uses express-session with PostgreSQL store
- **Memory Storage Fallback**: In-memory storage implementation for development
- **User Management**: Basic username/password system with user creation endpoints

## AI Integration
- **AWS Bedrock**: Integration with Bedrock Agent Runtime for AI conversations
- **Agent Configuration**: Configurable agent ID and alias through environment variables
- **Session Persistence**: Maintains conversation context across requests
- **Streaming Support**: Configured for real-time AI responses

## File Management
- **AWS S3**: Document storage and retrieval system
- **Report Management**: List, view, and download capabilities for stored documents
- **Metadata Tracking**: Database storage of file metadata and S3 paths
- **Content Delivery**: Direct S3 object retrieval for document viewing

# External Dependencies

## Cloud Services
- **AWS Bedrock Agent Runtime**: AI conversation engine with agent-based responses
- **AWS S3**: Document storage service for reports and file management
- **Neon Database**: PostgreSQL hosting service (based on connection string format)

## Development Tools
- **Vite**: Frontend build tool with React plugin and development server
- **Drizzle Kit**: Database migration and schema management
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Backend bundling for production builds

## UI/UX Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **React Markdown**: Markdown rendering for report content display

## Backend Dependencies
- **Express.js**: Web application framework with middleware support
- **Connect PG Simple**: PostgreSQL session store for Express sessions
- **Zod**: Runtime type validation for API request/response schemas
- **Date-fns**: Date manipulation and formatting utilities