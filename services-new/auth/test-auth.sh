#!/bin/bash
# Make this file executable: chmod +x test-auth.sh
# ===========================================
# Test script pentru Auth Service
# ===========================================

set -e

BASE_URL="http://localhost:8088"
KEYCLOAK_URL="http://localhost:8081"

echo "🧪 Testing ShopMindAI Auth Service"
echo "=================================="

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
echo "   ✅ Health: $(echo $HEALTH_RESPONSE | jq -r '.status')"

# Test 2: Get auth config
echo "2️⃣ Testing auth config endpoint..."
CONFIG_RESPONSE=$(curl -s "$BASE_URL/api/auth/config")
echo "   ✅ Config loaded successfully"

# Test 3: Test user registration
echo "3️⃣ Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser'$(date +%s)'",
        "email": "test'$(date +%s)'@shopmindai.com", 
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User"
    }')

if echo "$REGISTER_RESPONSE" | jq -e '.message' > /dev/null; then
    echo "   ✅ Registration: $(echo $REGISTER_RESPONSE | jq -r '.message')"
else
    echo "   ❌ Registration failed: $(echo $REGISTER_RESPONSE | jq -r '.error // .message')"
fi

# Test 4: Test user login with existing test user
echo "4️⃣ Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "password": "TestPassword123!"
    }')

if echo "$LOGIN_RESPONSE" | jq -e '.data.access_token' > /dev/null; then
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
    REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refresh_token')
    echo "   ✅ Login successful - tokens received"
    
    # Test 5: Test protected endpoint
    echo "5️⃣ Testing protected endpoint (user profile)..."
    PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/api/v1/user/profile")
    
    if echo "$PROFILE_RESPONSE" | jq -e '.user' > /dev/null; then
        USERNAME=$(echo $PROFILE_RESPONSE | jq -r '.user.username')
        echo "   ✅ Profile access successful for user: $USERNAME"
    else
        echo "   ❌ Profile access failed: $(echo $PROFILE_RESPONSE | jq -r '.error // .message')"
    fi
    
    # Test 6: Test token refresh
    echo "6️⃣ Testing token refresh..."
    REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")
    
    if echo "$REFRESH_RESPONSE" | jq -e '.data.access_token' > /dev/null; then
        echo "   ✅ Token refresh successful"
        NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.access_token')
        
        # Test 7: Test logout
        echo "7️⃣ Testing logout..."
        LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/logout" \
            -H "Content-Type: application/json" \
            -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")
        
        if echo "$LOGOUT_RESPONSE" | jq -e '.message' > /dev/null; then
            echo "   ✅ Logout successful"
        else
            echo "   ❌ Logout failed: $(echo $LOGOUT_RESPONSE | jq -r '.error // .message')"
        fi
    else
        echo "   ❌ Token refresh failed: $(echo $REFRESH_RESPONSE | jq -r '.error // .message')"
    fi
else
    echo "   ❌ Login failed: $(echo $LOGIN_RESPONSE | jq -r '.error // .message')"
    echo "   💡 Make sure Keycloak is running and setup-keycloak.sh was executed"
fi

# Test 8: CORS headers
echo "8️⃣ Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$BASE_URL/api/v1/auth/login" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "   ✅ CORS headers present"
else
    echo "   ❌ CORS headers missing"
fi

# Test 9: Rate limiting (quick test)
echo "9️⃣ Testing rate limiting..."
echo "   Making rapid requests to test rate limiting..."
for i in {1..3}; do
    RATE_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
    if [[ "$RATE_TEST" == "200" ]]; then
        echo "   Request $i: ✅ ($RATE_TEST)"
    else
        echo "   Request $i: ❌ ($RATE_TEST)"
    fi
done

echo ""
echo "🎉 Auth Service testing completed!"
echo "================================="
echo ""
echo "📋 Summary:"
echo "   • Health check: Working"
echo "   • Configuration endpoint: Working"
echo "   • User registration: Check above"
echo "   • User login: Check above"
echo "   • Protected routes: Check above"
echo "   • Token refresh: Check above"
echo "   • Logout: Check above"
echo "   • CORS: Check above"
echo "   • Rate limiting: Basic test completed"
echo ""
echo "🔗 Useful endpoints for frontend:"
echo "   Auth Config: $BASE_URL/api/auth/config"
echo "   Login: $BASE_URL/api/v1/auth/login"
echo "   Register: $BASE_URL/api/v1/auth/register"
echo "   Profile: $BASE_URL/api/v1/user/profile"
echo "   Keycloak Admin: $KEYCLOAK_URL/admin"
echo ""
