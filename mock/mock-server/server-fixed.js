const express = require('express');
const cors = require('cors');

const app = express();
const port = 3080;

// Middleware
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'mock-server' });
});



// Memories endpoint
app.get('/api/memories', (req, res) => {
  res.json({
    memories: [
      { id: 1, title: 'Mock Memory 1', content: 'This is a mock memory.' },
      { id: 2, title: 'Mock Memory 2', content: 'This is another mock memory.' },
    ]
  });
});




// Other required endpoints
app.get('/api/banner', (req, res) => {
  res.json({
    data: {
      banner_image: "/assets/banner-placeholder.jpg",
      banner_text: "Welcome to ShopMindAI"
    },
    message: "Banner endpoint - placeholder for ShopMindAI"
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    data: {
      app_name: "ShopMindAI",
      emailEnabled: false,
      features: ["auth", "ai", "shopping"],
      registrationEnabled: true,
      socialLogins: {
        discord: false,
        facebook: false,
        github: false,
        google: false
      },
      turnstile: {
        siteKey: ""
      },
      version: "1.0.0-mvp"
    },
    message: "Config endpoint - placeholder for ShopMindAI"
  });
});


app.get('/api/endpoints', (req, res) => {
  res.json({
    azureOpenAI: false,
    openAI: true,
    google: false,
    anthropic: false,
    custom: true,
    assistants: true,
    azureAssistants: false,
    chatGPTBrowser: false,
    gptPlugins: false,
    xAI: false
  });
});

app.get('/api/startup', (req, res) => {
  res.json({
    data: {
      app_name: "ShopMindAI",
      version: "1.0.0-mvp",
      features: {
        plugins: true,
        assistants: true,
        files: true,
        search: true
      }
    },
    message: "Startup config - placeholder for ShopMindAI"
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    data: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    message: "Metrics endpoint - placeholder for ShopMindAI"
  });
});

// Chat/Messages endpoints
app.get('/api/messages', (req, res) => {
  res.json({
    conversations: [],
    pageNumber: 1,
    pageSize: 50,
    pages: 1
  });
});

app.post('/api/ask', (req, res) => {
  const { message, conversationId, model, endpoint } = req.body;
  res.json({
    message: `Mock response to: ${message}`,
    conversationId: conversationId || 'mock-conversation-id',
    messageId: 'mock-message-id-' + Date.now(),
    parentMessageId: null,
    model: model || 'gpt-3.5-turbo',
    endpoint: endpoint || 'openAI'
  });
});

// Conversations endpoints
app.get('/api/convos', (req, res) => {
  res.json([
    {
      conversationId: 'mock-convo-1',
      title: 'Mock Conversation 1',
      endpoint: 'openAI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
});

app.post('/api/convos', (req, res) => {
  res.json({
    conversationId: 'new-mock-convo-' + Date.now(),
    title: 'New Conversation',
    endpoint: req.body.endpoint || 'openAI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

app.put('/api/convos/:conversationId', (req, res) => {
  res.json({
    conversationId: req.params.conversationId,
    title: req.body.title || 'Updated Conversation',
    endpoint: req.body.endpoint || 'openAI',
    updatedAt: new Date().toISOString()
  });
});

app.delete('/api/convos/:conversationId', (req, res) => {
  res.json({ message: 'Conversation deleted successfully' });
});

// Files endpoints
app.get('/api/files', (req, res) => {
  res.json({
    files: [],
    message: 'Files endpoint - placeholder for ShopMindAI'
  });
});

app.post('/api/files/upload', (req, res) => {
  res.json({
    file_id: 'mock-file-id-' + Date.now(),
    filename: 'mock-file.txt',
    type: 'text/plain',
    size: 1024,
    message: 'File uploaded successfully'
  });
});

// Models/Presets endpoints
app.get('/api/models', (req, res) => {
  res.json({
    data: [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        endpoint: 'openAI',
        maxTokens: 4096
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        endpoint: 'openAI',
        maxTokens: 8192
      }
    ]
  });
});

app.get('/api/presets', (req, res) => {
  res.json([
    {
      presetId: 'default-preset',
      title: 'Default Preset',
      endpoint: 'openAI',
      model: 'gpt-3.5-turbo'
    }
  ]);
});

// Plugins/Tools endpoints  
app.get('/api/plugins', (req, res) => {
  res.json({
    data: [],
    message: 'Plugins endpoint - placeholder for ShopMindAI'
  });
});

app.get('/api/tools', (req, res) => {
  res.json({
    data: [],
    message: 'Tools endpoint - placeholder for ShopMindAI'
  });
});

// Search endpoints
app.get('/api/search', (req, res) => {
  res.json({
    conversations: [],
    messages: [],
    message: 'Search endpoint - placeholder for ShopMindAI'
  });
});

// ✅ ENDPOINT-URI CRITICE PENTRU CHATFORM (ADĂUGATE ACUM)
app.get('/api/endpoints/config', (req, res) => {
  res.json({
    availableEndpoints: ['azureOpenAI', 'openAI', 'google', 'anthropic', 'custom'],
    defaultEndpoint: 'openAI'
  });
});

app.get('/api/endpoints/config/openAI', (req, res) => {
  res.json({
    availableModels: [
      { name: 'gpt-3.5-turbo', model: 'gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
      { name: 'gpt-4', model: 'gpt-4', description: 'GPT-4' }
    ],
    modelNames: ['gpt-3.5-turbo', 'gpt-4']
  });
});

app.get('/api/search/enable', (req, res) => {
  res.json({ enabled: false });
});

app.get('/api/balance', (req, res) => {
  res.json({ balance: 0, credit_balance: 0, aggregate_balance: 0 });
});

app.get('/api/config/app', (req, res) => {
  res.json({
    customFooter: null,
    exampleEndpoints: [
      {
        name: 'OpenAI',
        endpoint: 'openAI',
        apiKey: '',
        models: ['gpt-3.5-turbo', 'gpt-4']
      }
    ],
    socialLogins: [],
    emailEnabled: false,
    checkBalance: false,
    modelNames: ['gpt-3.5-turbo', 'gpt-4']
  });
});

app.get('/api/convos/latest', (req, res) => {
  res.json({
    conversations: [
      {
        conversationId: 'mock-convo-1',
        title: 'Mock Conversation 1',
        endpoint: 'openAI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        conversationId: 'mock-convo-2',
        title: 'Mock Conversation 2',
        endpoint: 'openAI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pageNumber: 1,
    pageSize: 50,
    pages: 1
  });
});




app.get('/api/startup/config', (req, res) => {
  res.json({
    appTitle: 'ShopMindAI',
    socialLogins: [],
    emailEnabled: false,
    checkBalance: false,
    modelNames: ['gpt-3.5-turbo', 'gpt-4']
  });
});

// Generic API routes
app.get('/api/*', (req, res) => {
  res.json({
    message: "Generic API endpoint",
    path: req.path,
    method: req.method
  });
});
// ✅ Endpoint pentru agents/chat - CRITIC PENTRU CHATFORM
app.post('/api/agents/chat/:agentId', (req, res) => {
  const { message, conversationId, model, endpoint } = req.body;
  const { agentId } = req.params;
  
  console.log(`Agent chat request - Agent: ${agentId}, Message: ${message}`);
  
  res.json({
    message: `Mock response from agent ${agentId} to: ${message}`,
    conversationId: conversationId || 'mock-agent-conversation-id',
    messageId: 'mock-agent-message-id-' + Date.now(),
    parentMessageId: null,
    model: model || 'gpt-3.5-turbo',
    endpoint: endpoint || 'openAI',
    agentId: agentId
  });
});

// ✅ Endpoint GET pentru a preveni erorile de preflight OPTIONS
app.options('/api/agents/chat/:agentId', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.get('/api/agents/chat/:agentId', (req, res) => {
  const { agentId } = req.params;
  res.json({
    message: `GET endpoint for agent ${agentId}`,
    agentId: agentId,
    status: 'active'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Mock server running on http://localhost:${port}`);
  console.log('✅ All critical endpoints for ChatForm are available!');
});

module.exports = app;