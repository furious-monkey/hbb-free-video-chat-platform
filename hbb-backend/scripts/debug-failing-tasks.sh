#!/bin/bash
# Debug failing ECS tasks

set -e

CLUSTER="hbb-cluster"
SERVICE="hbb-service"

echo "🔍 Debugging failing ECS tasks..."

# Get the most recent task (even if stopped)
echo "1. Getting recent tasks..."
RECENT_TASKS=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --max-items 5 --query 'taskArns[]' --output text)

if [ -z "$RECENT_TASKS" ]; then
    echo "❌ No tasks found. Checking if any stopped tasks exist..."
    STOPPED_TASKS=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --desired-status STOPPED --max-items 3 --query 'taskArns[]' --output text)
    RECENT_TASKS=$STOPPED_TASKS
fi

if [ -n "$RECENT_TASKS" ]; then
    for TASK_ARN in $RECENT_TASKS; do
        echo ""
        echo "🐳 Task: $(basename $TASK_ARN)"
        
        # Get task details
        TASK_INFO=$(aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN)
        
        echo "Status:" 
        echo "$TASK_INFO" | jq -r '.tasks[0] | {
            lastStatus: .lastStatus,
            healthStatus: .healthStatus,
            createdAt: .createdAt,
            startedAt: .startedAt,
            stoppedAt: .stoppedAt,
            stoppedReason: .stoppedReason
        }'
        
        echo ""
        echo "Container Status:"
        echo "$TASK_INFO" | jq -r '.tasks[0].containers[0] | {
            name: .name,
            lastStatus: .lastStatus,
            healthStatus: .healthStatus,
            exitCode: .exitCode,
            reason: .reason
        }'
        
        # Get logs if available
        LOG_GROUP="/ecs/hbb-service"
        LOG_STREAM="ecs/hbb-container/$(basename $TASK_ARN)"
        
        echo ""
        echo "📋 Recent logs:"
        if aws logs get-log-events --log-group-name $LOG_GROUP --log-stream-name $LOG_STREAM --limit 20 --query 'events[-20:].message' --output text 2>/dev/null; then
            echo "✅ Logs retrieved"
        else
            echo "❌ No logs found or log stream doesn't exist"
            echo "   Log stream should be: $LOG_STREAM"
            
            # Try to find actual log streams
            echo "   Available log streams:"
            aws logs describe-log-streams --log-group-name $LOG_GROUP --order-by LastEventTime --descending --max-items 5 --query 'logStreams[].logStreamName' --output text 2>/dev/null || echo "   No log group found"
        fi
        
        echo "----------------------------------------"
        break  # Just check the most recent task
    done
else
    echo "❌ No tasks found at all"
fi

# Check target group health
echo ""
echo "🎯 Target Group Health:"
TG_ARN=$(aws elbv2 describe-target-groups --names hbb-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "not-found")

if [ "$TG_ARN" != "not-found" ]; then
    aws elbv2 describe-target-health --target-group-arn $TG_ARN --query 'TargetHealthDescriptions[].{Target:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason,Description:TargetHealth.Description}' --output table 2>/dev/null
else
    echo "❌ Target group not found"
fi

echo ""
echo "🔧 Common fixes to try:"
echo "1. Add /health endpoint to your app"
echo "2. Make sure app binds to 0.0.0.0:3000 (not localhost)"
echo "3. Check environment variables are loading correctly"
echo "4. Verify secrets exist and have correct values"
echo "5. Check security groups allow port 3000 traffic"