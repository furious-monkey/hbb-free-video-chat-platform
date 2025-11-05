#!/bin/bash

echo "🔍 Comprehensive ECS Debug Analysis"
echo "===================================="

# 1. Get the latest task (stopped or running)
echo -e "\n1️⃣ Finding latest task..."
LATEST_TASK=$(aws ecs list-tasks \
  --cluster hbb-cluster \
  --service-name hbb-service \
  --query 'taskArns[0]' --output text)

if [ "$LATEST_TASK" == "None" ] || [ -z "$LATEST_TASK" ]; then
  # Try stopped tasks
  LATEST_TASK=$(aws ecs list-tasks \
    --cluster hbb-cluster \
    --service-name hbb-service \
    --desired-status STOPPED \
    --query 'taskArns[0]' --output text)
fi

if [ "$LATEST_TASK" != "None" ] && [ -n "$LATEST_TASK" ]; then
  TASK_ID=$(echo $LATEST_TASK | rev | cut -d'/' -f1 | rev)
  echo "Found task: $TASK_ID"
  
  # 2. Get detailed task information
  echo -e "\n2️⃣ Task Details:"
  aws ecs describe-tasks \
    --cluster hbb-cluster \
    --tasks $LATEST_TASK \
    --query 'tasks[0]' \
    --output json > task-details.json
  
  # Extract key information
  echo "Status: $(jq -r '.lastStatus' task-details.json)"
  echo "Stop Code: $(jq -r '.stopCode' task-details.json)"
  echo "Stop Reason: $(jq -r '.stoppedReason' task-details.json)"
  echo "Container Exit Code: $(jq -r '.containers[0].exitCode' task-details.json)"
  echo "Container Reason: $(jq -r '.containers[0].reason' task-details.json)"
  
  # 3. Get CloudWatch logs
  echo -e "\n3️⃣ Container Logs (last 50 lines):"
  LOG_STREAM="ecs/hbb-container/$TASK_ID"
  
  # Try to get logs
  aws logs get-log-events \
    --log-group-name /ecs/hbb-service \
    --log-stream-name "$LOG_STREAM" \
    --limit 50 \
    --query 'events[*].message' \
    --output text 2>/dev/null || {
      echo "⚠️  No logs found. Trying tail..."
      aws logs tail /ecs/hbb-service \
        --log-stream-name-prefix "$LOG_STREAM" \
        --format short 2>/dev/null || echo "❌ No logs available"
    }
  
  # Clean up
  rm -f task-details.json
fi

# 4. Check task definition
echo -e "\n4️⃣ Current Task Definition:"
TASK_DEF=$(aws ecs describe-services \
  --cluster hbb-cluster \
  --services hbb-service \
  --query 'services[0].taskDefinition' \
  --output text)

echo "Using task definition: $TASK_DEF"

# 5. Check secrets permissions
echo -e "\n5️⃣ Checking IAM Permissions:"
echo "Task Execution Role policies:"
aws iam list-attached-role-policies \
  --role-name ecsTaskExecutionRole \
  --query 'AttachedPolicies[*].PolicyName' \
  --output text

# 6. Test secret access
echo -e "\n6️⃣ Testing Secret Access:"
echo -n "DATABASE_URL secret: "
aws secretsmanager describe-secret \
  --secret-id hbb-database-url-C3ovHL \
  --query 'Name' --output text 2>/dev/null && echo "✅ Exists" || echo "❌ Not found"

echo -n "JWT_SECRET secret: "
aws secretsmanager describe-secret \
  --secret-id hbb-jwt-secret-ZQaOM0 \
  --query 'Name' --output text 2>/dev/null && echo "✅ Exists" || echo "❌ Not found"

echo -n "REDIS_URL secret: "
aws secretsmanager describe-secret \
  --secret-id hbb-redis-url-H22UoJ \
  --query 'Name' --output text 2>/dev/null && echo "✅ Exists" || echo "❌ Not found"

# 7. Network configuration check
echo -e "\n7️⃣ Network Configuration:"
NETWORK_CONFIG=$(aws ecs describe-services \
  --cluster hbb-cluster \
  --services hbb-service \
  --query 'services[0].networkConfiguration.awsvpcConfiguration' \
  --output json)

echo "Security Groups: $(echo $NETWORK_CONFIG | jq -r '.securityGroups[]')"
echo "Subnets: $(echo $NETWORK_CONFIG | jq -r '.subnets[]')"
echo "Public IP: $(echo $NETWORK_CONFIG | jq -r '.assignPublicIp')"

# 8. Check if container image exists
echo -e "\n8️⃣ Checking ECR Image:"
IMAGE_URI=$(aws ecs describe-task-definition \
  --task-definition $(echo $TASK_DEF | cut -d'/' -f2) \
  --query 'taskDefinition.containerDefinitions[0].image' \
  --output text)

echo "Image URI: $IMAGE_URI"

# Extract repository and tag
REPO=$(echo $IMAGE_URI | cut -d'/' -f2 | cut -d':' -f1)
TAG=$(echo $IMAGE_URI | cut -d':' -f2)

# Check if image exists
echo -n "Image exists in ECR: "
aws ecr describe-images \
  --repository-name $REPO \
  --image-ids imageTag=$TAG \
  --query 'imageDetails[0].imageTags[0]' \
  --output text 2>/dev/null && echo "✅ Yes" || echo "❌ No"

echo -e "\n✅ Debug analysis complete!"
echo "Look for ❌ marks above to identify issues."