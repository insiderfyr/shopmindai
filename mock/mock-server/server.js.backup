const express = require('express');
const cors = require('cors');

const app = express();
const port = 3080;

// Middleware
app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'mock-server' });
});

// Auth v1 endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username && password) {
    res.json({
      message: "Login successful",
      data: {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        token_type: 'Bearer',
        expires_in: 300,
        user: {
          id: "mock-user-id",
          username: username,
          email: username.includes('@') ? username : `${username}@example.com`,
          first_name: "Mock",
          last_name: "User",
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    });
  } else {
    res.status(400).json({ 
      error: "validation_error",
      message: "Invalid request format",
      code: 400,
      details: "Username and password are required"
    });
  }
});

app.post('/api/v1/auth/register', (req, res) => {
  const { username, email, password, first_name, last_name } = req.body;
  
  if (username && email && password && first_name && last_name) {
    res.json({
      message: "Registration successful",
      data: {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        token_type: 'Bearer',
        expires_in: 300,
        user: {
          id: "mock-user-id",
          username: username,
          email: email,
          first_name: first_name,
          last_name: last_name,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    });
  } else {
    res.status(400).json({ 
      error: "validation_error",
      message: "Invalid request format",
      code: 400,
      details: "All fields are required"
    });
  }
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const { refresh_token } = req.body;
  
  if (refresh_token) {
    res.json({
      message: "Token refreshed successfully",
      data: {
        access_token: 'new-mock-jwt-token-' + Date.now(),
        refresh_token: 'new-mock-refresh-token-' + Date.now(),
        token_type: 'Bearer',
        expires_in: 300
      }
    });
  } else {
    res.status(400).json({ 
      error: "validation_error",
      message: "Invalid request format",
      code: 400,
      details: "Refresh token is required"
    });
  }
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

app.get('/api/user', (req, res) => {
  res.json({
    id: "mock-user-id",
    username: "mockuser",
    email: "mock@example.com",
    first_name: "Mock",
    last_name: "User"
  });
});

app.get('/api/endpoints', (req, res) => {
  res.json({
    data: {
      agents: null,
      anthropic: null,
      assistants: null,
      azureAssistants: null,
      azureOpenAI: null,
      chatGPTBrowser: null,
      custom: null,
      google: null,
      gptPlugins: null,
      openAI: null,
      xAI: null
    },
    message: "AI Endpoints - placeholder for ShopMindAI"
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

// Generic API routes
app.get('/api/*', (req, res) => {
  res.json({
    message: "Generic API endpoint",
    path: req.path,
    method: req.method
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
  console.log('\n📝 Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/v1/auth/login');
  console.log('  POST /api/v1/auth/register');
  console.log('  POST /api/v1/auth/logout');
  console.log('  POST /api/v1/auth/refresh');
  console.log('  GET  /api/banner');
  console.log('  GET  /api/config');
  console.log('  GET  /api/user');
  console.log('  GET  /api/endpoints');
  console.log('  GET  /api/startup');
  console.log('  GET  /metrics');
  console.log('  GET  /api/* (generic)');
  console.log('\n✅ Ready to serve!');
});

module.exports = app;

// Auth config endpoint
app.get('/api/v1/auth/config', (req, res) => {
  res.json({
    data: {
      app_name: "ShopMindAI",
      version: "1.0.0-mvp",
      features: {
        plugins: true,
        assistants: true,
        files: true,
        search: true
      },
      auth: {
        enabled: true,
        provider: "keycloak",
        keycloak_url: "http://localhost:8080",
        realm: "shopmindai",
        client_id: "shopmindai-client"
      }
    },
    message: "Auth configuration for ShopMindAI"
  });
});


// Auth config endpoint
app.get('/api/v1/auth/config', (req, res) => {
  res.json({
    data: {
      app_name: 'ShopMindAI',
      version: '1.0.0-mvp',
      features: {
        plugins: true,
        assistants: true,
        files: true,
        search: true
      },
      auth: {
        enabled: true,
        provider: 'keycloak',
        keycloak_url: 'http://localhost:8080',
        realm: 'shopmindai',
        client_id: 'shopmindai-client'
      }
    },
    message: 'Auth configuration for ShopMindAI'
  });
});
