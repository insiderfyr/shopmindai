# ShopMindAI Mock Server

A simple Express.js mock server for frontend development and testing.

## Features

- **Authentication**: Login, register, logout endpoints
- **User Management**: Get and update user profile
- **Conversations**: CRUD operations for chat conversations
- **Messages**: Send and receive messages with mock AI responses
- **Models**: Available AI models configuration
- **Presets**: Chat presets management
- **Search**: Search conversations
- **Files**: File upload/download simulation
- **Plugins**: Plugin management
- **Assistants**: AI assistants configuration
- **Balance**: User balance information

## Quick Start

1. **Install dependencies:**
   ```bash
   cd mock-server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Server will start on:**
   - Default: `http://localhost:3080`
   - Custom: Set `PORT` and `HOST` environment variables

## Environment Variables

- `PORT`: Server port (default: 3080)
- `HOST`: Server host (default: localhost)

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User
- `GET /api/user` - Get current user
- `PATCH /api/user` - Update user profile

### Conversations
- `GET /api/convos` - Get all conversations
- `POST /api/convos` - Create new conversation
- `GET /api/convos/:id` - Get specific conversation
- `DELETE /api/convos/:id` - Delete conversation

### Messages
- `GET /api/messages/:convId` - Get messages for conversation
- `POST /api/messages` - Send new message

### Models & Presets
- `GET /api/models` - Get available AI models
- `GET /api/presets` - Get chat presets
- `POST /api/presets` - Create new preset

### Configuration
- `GET /api/config` - Get app configuration
- `GET /api/search/convos` - Search conversations
- `GET /api/files` - Get user files
- `POST /api/files` - Upload file
- `GET /api/plugins` - Get available plugins
- `GET /api/assistants` - Get AI assistants
- `GET /api/balance` - Get user balance

## Mock Data

The server includes pre-populated mock data:
- **Users**: Test user account
- **Conversations**: Sample conversation with messages
- **Models**: GPT-3.5, GPT-4, Claude 3
- **Presets**: Default and Creative presets

## Development

This mock server is designed for frontend development and testing. It provides realistic API responses without requiring a full backend implementation.

### Adding New Endpoints

To add new endpoints, simply add new routes to `server.js` following the existing pattern:

```javascript
app.get('/api/new-endpoint', (req, res) => {
  res.json({ message: 'New endpoint response' });
});
```

### Modifying Mock Data

Update the mock data arrays at the top of `server.js` to customize the responses:

```javascript
const mockUsers = [
  { id: 1, username: 'youruser', email: 'your@email.com', name: 'Your Name' }
];
```

## License

MIT
