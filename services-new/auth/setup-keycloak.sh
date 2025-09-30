#!/bin/bash
# Make this file executable: chmod +x setup-keycloak.sh
# ===========================================
# Keycloak Setup Script pentru ShopMindAI
# ===========================================

set -e

echo "🚀 Setting up Keycloak for ShopMindAI..."

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to start..."
until curl -s http://localhost:8081/health/ready >/dev/null 2>&1; do
    sleep 5
    echo "Still waiting for Keycloak..."
done

echo "✅ Keycloak is ready!"

# Load environment variables
if [[ -f .env ]]; then
    export $(grep -v '^#' .env | xargs)
fi

# Set defaults if not provided
KEYCLOAK_ADMIN_USER=${KEYCLOAK_ADMIN_USER:-admin}
KEYCLOAK_ADMIN_PASS=${KEYCLOAK_ADMIN_PASS:-admin_secure_password_2024}
KEYCLOAK_REALM=${KEYCLOAK_REALM:-ShopMindAI}
KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID:-auth-service}

echo "🔧 Configuring Keycloak..."

# Get admin access token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8081/realms/master/protocol/openid-connect/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$KEYCLOAK_ADMIN_USER" \
    -d "password=$KEYCLOAK_ADMIN_PASS" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

if [[ "$ADMIN_TOKEN" == "null" || -z "$ADMIN_TOKEN" ]]; then
    echo "❌ Failed to get admin token. Check admin credentials."
    exit 1
fi

echo "✅ Admin token obtained"

# Create realm if it doesn't exist
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:8081/admin/realms/$KEYCLOAK_REALM)

if [[ "$REALM_EXISTS" != "200" ]]; then
    echo "📝 Creating realm: $KEYCLOAK_REALM"
    curl -s -X POST http://localhost:8081/admin/realms \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "realm": "'$KEYCLOAK_REALM'",
            "displayName": "ShopMindAI",
            "enabled": true,
            "registrationAllowed": true,
            "loginWithEmailAllowed": true,
            "duplicateEmailsAllowed": false,
            "resetPasswordAllowed": true,
            "editUsernameAllowed": false,
            "bruteForceProtected": true,
            "permanentLockout": false,
            "maxFailureWaitSeconds": 900,
            "minimumQuickLoginWaitSeconds": 60,
            "waitIncrementSeconds": 60,
            "quickLoginCheckMilliSeconds": 1000,
            "maxDeltaTimeSeconds": 43200,
            "failureFactor": 30,
            "defaultRoles": ["default-roles-'$KEYCLOAK_REALM'"],
            "requiredCredentials": ["password"],
            "passwordPolicy": "length(8) and digits(1) and lowerCase(1) and upperCase(1) and specialChars(1) and notUsername",
            "accessTokenLifespan": 900,
            "accessTokenLifespanForImplicitFlow": 900,
            "ssoSessionIdleTimeout": 1800,
            "ssoSessionMaxLifespan": 36000,
            "offlineSessionIdleTimeout": 2592000,
            "offlineSessionMaxLifespanEnabled": false,
            "accessCodeLifespan": 60,
            "accessCodeLifespanUserAction": 300,
            "accessCodeLifespanLogin": 1800,
            "actionTokenGeneratedByAdminLifespan": 43200,
            "actionTokenGeneratedByUserLifespan": 300,
            "oauth2DeviceCodeLifespan": 600,
            "oauth2DevicePollingInterval": 5,
            "internationalizationEnabled": true,
            "supportedLocales": ["en", "ro"],
            "defaultLocale": "en"
        }'
    echo "✅ Realm created: $KEYCLOAK_REALM"
else
    echo "✅ Realm already exists: $KEYCLOAK_REALM"
fi

# Create client if it doesn't exist
CLIENT_EXISTS=$(curl -s \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "http://localhost:8081/admin/realms/$KEYCLOAK_REALM/clients?clientId=$KEYCLOAK_CLIENT_ID" | jq length)

if [[ "$CLIENT_EXISTS" == "0" ]]; then
    echo "📝 Creating client: $KEYCLOAK_CLIENT_ID"
    curl -s -X POST http://localhost:8081/admin/realms/$KEYCLOAK_REALM/clients \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "'$KEYCLOAK_CLIENT_ID'",
            "name": "ShopMindAI Auth Service",
            "description": "Authentication service for ShopMindAI",
            "enabled": true,
            "clientAuthenticatorType": "client-secret",
            "secret": "'$KEYCLOAK_CLIENT_SECRET'",
            "redirectUris": [
                "http://localhost:3000/*",
                "http://localhost:3080/*",
                "http://localhost:8080/*"
            ],
            "webOrigins": [
                "http://localhost:3000",
                "http://localhost:3080",
                "http://localhost:8080"
            ],
            "standardFlowEnabled": true,
            "implicitFlowEnabled": false,
            "directAccessGrantsEnabled": true,
            "serviceAccountsEnabled": true,
            "publicClient": false,
            "protocol": "openid-connect",
            "fullScopeAllowed": true,
            "defaultClientScopes": [
                "web-origins",
                "roles",
                "profile",
                "email"
            ],
            "optionalClientScopes": [
                "address",
                "phone",
                "offline_access",
                "microprofile-jwt"
            ]
        }'
    echo "✅ Client created: $KEYCLOAK_CLIENT_ID"
else
    echo "✅ Client already exists: $KEYCLOAK_CLIENT_ID"
fi

# Create test user
echo "👤 Creating test user..."
TEST_USER_EXISTS=$(curl -s \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "http://localhost:8081/admin/realms/$KEYCLOAK_REALM/users?username=testuser" | jq length)

if [[ "$TEST_USER_EXISTS" == "0" ]]; then
    curl -s -X POST http://localhost:8081/admin/realms/$KEYCLOAK_REALM/users \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser",
            "email": "test@shopmindai.com",
            "firstName": "Test",
            "lastName": "User",
            "enabled": true,
            "emailVerified": true,
            "credentials": [{
                "type": "password",
                "value": "TestPassword123!",
                "temporary": false
            }]
        }'
    echo "✅ Test user created (username: testuser, password: TestPassword123!)"
else
    echo "✅ Test user already exists"
fi

echo ""
echo "🎉 Keycloak setup completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   Keycloak URL: http://localhost:8081"
echo "   Admin Console: http://localhost:8081/admin"
echo "   Realm: $KEYCLOAK_REALM"
echo "   Client ID: $KEYCLOAK_CLIENT_ID"
echo "   Test User: testuser / TestPassword123!"
echo ""
echo "🌐 Frontend can now use these endpoints:"
echo "   Auth Config: http://localhost:8080/api/auth/config"
echo "   Login: http://localhost:8080/api/v1/auth/login"
echo "   Register: http://localhost:8080/api/v1/auth/register"
echo ""
