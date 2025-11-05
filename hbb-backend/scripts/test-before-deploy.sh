#!/bin/bash

echo "🧪 Testing Before Deployment"
echo "==========================="

# 1. Test the Docker build
echo -e "\n1️⃣ Building Docker image..."
docker build -t hbb-test-final .

# 2. Run the container and check if it starts
echo -e "\n2️⃣ Running container to test startup..."
docker run -d --name hbb-test-run \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e JWT_SECRET="test-secret" \
  -e REDIS_URL="redis://localhost:6379" \
  hbb-test-final

# Wait for container to start
echo "Waiting for container to start..."
sleep 10

# Check if container is still running
if docker ps | grep -q hbb-test-run; then
  echo "✅ Container is running!"
  
  # Show logs
  echo -e "\n📋 Container logs:"
  docker logs hbb-test-run
  
  # Try health check
  echo -e "\n🏥 Testing health endpoint:"
  curl -f http://localhost:3000/health || echo "⚠️  Health check failed (might be normal if DB is not connected)"
else
  echo "❌ Container crashed!"
  echo -e "\n📋 Container logs:"
  docker logs hbb-test-run
  
  # Check what went wrong
  echo -e "\n🔍 Checking file structure in container:"
  docker run --rm hbb-test-final find /app/dist -name "*.js" -type f | head -10
fi

# Clean up
docker stop hbb-test-run 2>/dev/null
docker rm hbb-test-run 2>/dev/null

echo -e "\n✅ Test complete!"