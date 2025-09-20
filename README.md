# BedrockAgentUI

## Capillary Migration - BRD Generation System

A modern web application built by the **AI Solutions Squad** for generating Business Requirements Documents (BRDs) for Capillary migration projects using AWS Bedrock and local AI agents.

## Features

- 🤖 **AI-Powered BRD Generation** - Uses AWS Bedrock agents with local API fallback
- 📊 **Real-time Streaming** - Interactive chat with streaming responses
- 📁 **S3 Integration** - Automatic report storage and retrieval from S3
- 🎨 **Professional UI** - Clean, business-appropriate design
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Auto-sync Reports** - Automatically syncs with S3 bucket for latest reports

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI Integration**: AWS Bedrock Agent Runtime
- **Storage**: AWS S3, In-memory storage
- **Streaming**: Server-Sent Events (SSE)

## Quick Start

### Prerequisites

- Node.js 18+
- AWS Account with Bedrock access
- S3 bucket for report storage

### Installation

1. Clone the repository:
```bash
git clone https://github.com/arjun-4978/BedrockAgentUI.git
cd BedrockAgentUI
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your AWS credentials and configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5000 in your browser

## Environment Configuration

Create a `.env` file with the following variables:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_REPORTS_BUCKET=your-s3-bucket

# Bedrock Agent Configuration
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS_ID=your_alias_id

# Local API Fallback
LOCAL_API_URL=http://localhost:8080/invocations
```

## API Endpoints

### Chat Endpoints
- `POST /api/chat/session` - Create new chat session
- `GET /api/chat/:sessionId/messages` - Get chat messages
- `POST /api/chat/:sessionId/message/stream` - Send message with streaming
- `POST /api/chat/:sessionId/message` - Send message (non-streaming)

### Reports Endpoints
- `GET /api/reports` - List all reports from S3
- `GET /api/reports/:id/content` - Get report content

## Local API Integration

If AWS Bedrock is unavailable, the system automatically falls back to a local API:

**Expected Local API Format:**
```bash
POST http://localhost:8080/invocations
Content-Type: application/json

{
  "input": "user message text"
}
```

**Expected Response:**
```json
{
  "output": "AI generated response"
}
```

## Project Structure

```
BedrockAgentUI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage
│   └── index.ts           # Server entry
├── shared/                # Shared types and schemas
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking

### Building for Production

```bash
npm run build
npm run start
```

## Team

**AI Solutions Squad** - Capillary Migration BRD Generation Team

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the AI Solutions Squad team.