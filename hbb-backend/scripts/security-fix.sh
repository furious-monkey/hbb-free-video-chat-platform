#!/bin/bash

echo "🔍 AWS CLI MediaSoup Network Diagnostics"
echo "========================================="

# Set your region if not already set
export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo "Using AWS Region: $AWS_DEFAULT_REGION"
echo ""

# 1. Find your Application Load Balancer
echo "📋 Finding your Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?contains(LoadBalancerName, `hbb`) || contains(LoadBalancerName, `app`)].LoadBalancerArn' \
  --output text | head -1)

if [ -n "$ALB_ARN" ]; then
    echo "Found ALB: $ALB_ARN"
    
    # Get ALB details including public IP
    echo ""
    echo "🌐 Getting ALB public IP and DNS..."
    ALB_DNS=$(aws elbv2 describe-load-balancers \
      --load-balancer-arns $ALB_ARN \
      --query 'LoadBalancers[0].DNSName' \
      --output text)
    
    echo "ALB DNS Name: $ALB_DNS"
    
    # Resolve ALB DNS to IP addresses
    ALB_IPS=$(nslookup $ALB_DNS | grep 'Address:' | grep -v '#' | awk '{print $2}' | tr '\n' ' ')
    echo "ALB IP Addresses: $ALB_IPS"
    
    # Get the first IP for MediaSoup configuration
    FIRST_ALB_IP=$(echo $ALB_IPS | awk '{print $1}')
    echo ""
    echo "✅ Use this IP for MEDIASOUP_ANNOUNCED_IP: $FIRST_ALB_IP"
    echo ""
    
else
    echo "❌ No ALB found. Listing all load balancers:"
    aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,LoadBalancerArn,DNSName]' --output table
    echo ""
    echo "Please identify your ALB and set ALB_ARN manually:"
    echo "ALB_ARN='arn:aws:elasticloadbalancing:region:account:loadbalancer/app/name/id'"
    exit 1
fi

# 2. Check ALB Security Groups
echo "🔒 Checking ALB Security Groups..."
ALB_SECURITY_GROUPS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].SecurityGroups' \
  --output text)

echo "ALB Security Groups: $ALB_SECURITY_GROUPS"

for SG in $ALB_SECURITY_GROUPS; do
    echo ""
    echo "🔍 Checking Security Group: $SG"
    
    # Check for MediaSoup port range in security group
    MEDIASOUP_RULES=$(aws ec2 describe-security-groups \
      --group-ids $SG \
      --query "SecurityGroups[0].IpPermissions[?FromPort>=\`40000\` && ToPort<=\`49999\`]" \
      --output json)
    
    if [ "$MEDIASOUP_RULES" = "[]" ]; then
        echo "❌ No MediaSoup port rules (40000-49999) found in $SG"
        echo ""
        echo "🔧 To fix, run these commands:"
        echo "# Add UDP ports for MediaSoup"
        echo "aws ec2 authorize-security-group-ingress \\"
        echo "  --group-id $SG \\"
        echo "  --protocol udp \\"
        echo "  --port 40000-49999 \\"
        echo "  --cidr 0.0.0.0/0"
        echo ""
        echo "# Add TCP ports for MediaSoup"
        echo "aws ec2 authorize-security-group-ingress \\"
        echo "  --group-id $SG \\"
        echo "  --protocol tcp \\"
        echo "  --port 40000-49999 \\"
        echo "  --cidr 0.0.0.0/0"
        echo ""
    else
        echo "✅ MediaSoup port rules found:"
        echo "$MEDIASOUP_RULES" | jq -r '.[] | "  \(.IpProtocol) \(.FromPort)-\(.ToPort) from \(.IpRanges[].CidrIp // .UserIdGroupPairs[].GroupId // "N/A")"'
    fi
done

# 3. Find your ECS Service and Cluster
echo ""
echo "🐳 Finding ECS Service..."
ECS_CLUSTERS=$(aws ecs list-clusters --query 'clusterArns[*]' --output text)

for CLUSTER_ARN in $ECS_CLUSTERS; do
    CLUSTER_NAME=$(echo $CLUSTER_ARN | awk -F'/' '{print $NF}')
    echo "Checking cluster: $CLUSTER_NAME"
    
    SERVICES=$(aws ecs list-services --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output text)
    
    for SERVICE_ARN in $SERVICES; do
        SERVICE_NAME=$(echo $SERVICE_ARN | awk -F'/' '{print $NF}')
        
        # Check if this service is related to your app (adjust the grep pattern as needed)
        if echo "$SERVICE_NAME" | grep -i "hbb\|app\|stream" > /dev/null; then
            echo "Found relevant service: $SERVICE_NAME in cluster $CLUSTER_NAME"
            ECS_CLUSTER=$CLUSTER_NAME
            ECS_SERVICE=$SERVICE_NAME
            break 2
        fi
    done
done

if [ -z "$ECS_SERVICE" ]; then
    echo "❌ Could not find ECS service. Listing all services:"
    for CLUSTER_ARN in $ECS_CLUSTERS; do
        CLUSTER_NAME=$(echo $CLUSTER_ARN | awk -F'/' '{print $NF}')
        echo "Cluster: $CLUSTER_NAME"
        aws ecs list-services --cluster $CLUSTER_NAME --query 'serviceArns[*]' --output text | xargs -n1 basename
    done
    echo ""
    echo "Please set manually:"
    echo "ECS_CLUSTER='your-cluster-name'"
    echo "ECS_SERVICE='your-service-name'"
    exit 1
fi

# 4. Check ECS Service Security Groups
echo ""
echo "🔍 Checking ECS Service Security Groups..."
TASK_DEFINITION_ARN=$(aws ecs describe-services \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --query 'services[0].taskDefinition' \
  --output text)

echo "Task Definition: $TASK_DEFINITION_ARN"

# Get the security groups from the service network configuration
SERVICE_SECURITY_GROUPS=$(aws ecs describe-services \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups' \
  --output text)

echo "ECS Service Security Groups: $SERVICE_SECURITY_GROUPS"

for SG in $SERVICE_SECURITY_GROUPS; do
    echo ""
    echo "🔍 Checking ECS Security Group: $SG"
    
    # Check for MediaSoup port range
    MEDIASOUP_RULES=$(aws ec2 describe-security-groups \
      --group-ids $SG \
      --query "SecurityGroups[0].IpPermissions[?FromPort>=\`40000\` && ToPort<=\`49999\`]" \
      --output json)
    
    if [ "$MEDIASOUP_RULES" = "[]" ]; then
        echo "❌ No MediaSoup port rules (40000-49999) found in ECS security group $SG"
        echo ""
        echo "🔧 To fix, run these commands:"
        echo "# Add UDP ports for MediaSoup to ECS security group"
        echo "aws ec2 authorize-security-group-ingress \\"
        echo "  --group-id $SG \\"
        echo "  --protocol udp \\"
        echo "  --port 40000-49999 \\"
        echo "  --cidr 0.0.0.0/0"
        echo ""
        echo "# Add TCP ports for MediaSoup to ECS security group"
        echo "aws ec2 authorize-security-group-ingress \\"
        echo "  --group-id $SG \\"
        echo "  --protocol tcp \\"
        echo "  --port 40000-49999 \\"
        echo "  --cidr 0.0.0.0/0"
        echo ""
    else
        echo "✅ MediaSoup port rules found in ECS security group:"
        echo "$MEDIASOUP_RULES" | jq -r '.[] | "  \(.IpProtocol) \(.FromPort)-\(.ToPort) from \(.IpRanges[].CidrIp // .UserIdGroupPairs[].GroupId // "N/A")"'
    fi
done

# 5. Check current ECS task environment variables
echo ""
echo "📋 Checking current ECS task environment variables..."
TASK_DEFINITION=$(aws ecs describe-task-definition \
  --task-definition $TASK_DEFINITION_ARN \
  --query 'taskDefinition.containerDefinitions[0].environment' \
  --output json)

echo "Current environment variables in task definition:"
echo "$TASK_DEFINITION" | jq -r '.[] | "\(.name)=\(.value)"' | grep -E "(MEDIASOUP|PORT|IP)" || echo "No MediaSoup-related environment variables found"

# 6. Get running tasks for real-time environment check
echo ""
echo "🏃 Checking running tasks..."
RUNNING_TASKS=$(aws ecs list-tasks \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text)

if [ "$RUNNING_TASKS" != "None" ] && [ -n "$RUNNING_TASKS" ]; then
    echo "Found running task: $RUNNING_TASKS"
    
    # Get task details including network interface
    TASK_ENI=$(aws ecs describe-tasks \
      --cluster $ECS_CLUSTER \
      --tasks $RUNNING_TASKS \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
      --output text)
    
    if [ -n "$TASK_ENI" ]; then
        echo "Task Network Interface: $TASK_ENI"
        
        # Get the public IP of the task (if any)
        TASK_PUBLIC_IP=$(aws ec2 describe-network-interfaces \
          --network-interface-ids $TASK_ENI \
          --query 'NetworkInterfaces[0].Association.PublicIp' \
          --output text)
        
        echo "Task Public IP: ${TASK_PUBLIC_IP:-'None (private only)'}"
        
        TASK_PRIVATE_IP=$(aws ec2 describe-network-interfaces \
          --network-interface-ids $TASK_ENI \
          --query 'NetworkInterfaces[0].PrivateIpAddress' \
          --output text)
        
        echo "Task Private IP: $TASK_PRIVATE_IP"
    fi
fi

# 7. Summary and recommendations
echo ""
echo "📝 SUMMARY AND RECOMMENDATIONS"
echo "=============================="
echo ""
echo "1. 🌐 Set this in your ECS environment variables:"
echo "   MEDIASOUP_ANNOUNCED_IP=$FIRST_ALB_IP"
echo ""
echo "2. 🔒 Security Group Rules Needed:"
echo "   - ALB Security Groups: Open ports 40000-49999 UDP/TCP to 0.0.0.0/0"
echo "   - ECS Security Groups: Open ports 40000-49999 UDP/TCP to 0.0.0.0/0"
echo ""
echo "3. 📋 Your Configuration:"
echo "   - ALB DNS: $ALB_DNS"
echo "   - ALB IP: $FIRST_ALB_IP"
echo "   - ECS Cluster: $ECS_CLUSTER"
echo "   - ECS Service: $ECS_SERVICE"
echo ""

# 8. Generate update commands
echo "4. 🔧 Commands to fix security groups:"
echo ""

# ALB Security Groups
for SG in $ALB_SECURITY_GROUPS; do
    echo "# Fix ALB Security Group $SG"
    echo "aws ec2 authorize-security-group-ingress --group-id $SG --protocol udp --port 40000-49999 --cidr 0.0.0.0/0"
    echo "aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 40000-49999 --cidr 0.0.0.0/0"
    echo ""
done

# ECS Security Groups
for SG in $SERVICE_SECURITY_GROUPS; do
    echo "# Fix ECS Security Group $SG"
    echo "aws ec2 authorize-security-group-ingress --group-id $SG --protocol udp --port 40000-49999 --cidr 0.0.0.0/0"
    echo "aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 40000-49999 --cidr 0.0.0.0/0"
    echo ""
done

echo "5. 🔄 Update ECS environment variables (you'll need to create a new task definition revision):"
echo ""
echo "After updating your task definition with MEDIASOUP_ANNOUNCED_IP=$FIRST_ALB_IP, redeploy with:"
echo "aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment"