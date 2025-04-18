#!/bin/bash

# Login as super admin
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' http://localhost:5000/api/auth/login)

# Extract and save the cookie
COOKIE=$(echo "$LOGIN_RESPONSE" | grep -i set-cookie | sed -e 's/^.*set-cookie: \(.*\);.*$/\1/')

# Seed the test data
echo "Creating test restaurant data..."
curl -s -X POST -H "Content-Type: application/json" -H "Cookie: $COOKIE" http://localhost:5000/api/dev/seed-test-data

echo "Test data created! Check the restaurants page to see them."