#!/bin/bash
# scripts/setup-ecs-service.sh - Create the ECS service
set -e

AWS_REGION="us-east-1"
PROJECT_NAME="hbb"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Setting up ECS service for HBB...${NC}"

# Check if task definition exists
if ! aws ecs describe-task-definition --task-definition hbb-task-definition >/dev/null 2>&1; then
    echo -e "${RED}❌ Task definition 'hbb-task-definition' not found!${NC}"
    echo -e "${YELLOW}Creating initial task definition...${NC}"
    
    # Register the task definition first
    aws ecs register-task-definition --cli-input-json file://.aws/task-definition.json
    echo -e "${GREEN}✅ Task definition registered${NC}"
fi

# Get subnet and security group IDs from tags
echo -e "${YELLOW}🔍 Finding subnets and security groups...${NC}"

SUBNET1_ID=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-subnet-1" \
    --query 'Subnets[0].SubnetId' --output text)

SUBNET2_ID=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-subnet-2" \
    --query 'Subnets[0].SubnetId' --output text)

ECS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" \
    --query 'SecurityGroups[0].GroupId' --output text)

ALB_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-alb-sg" \
    --query 'SecurityGroups[0].GroupId' --output text)

VPC_ID=$(aws ec2 describe-subnets --subnet-ids $SUBNET1_ID \
    --query 'Subnets[0].VpcId' --output text)

if [ "$SUBNET1_ID" = "None" ] || [ "$SUBNET2_ID" = "None" ] || [ "$ECS_SG_ID" = "None" ]; then
    echo -e "${RED}❌ Required infrastructure not found. Run ./scripts/setup-aws-infrastructure.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found infrastructure:${NC}"
echo "  Subnet 1: $SUBNET1_ID"
echo "  Subnet 2: $SUBNET2_ID"
echo "  ECS Security Group: $ECS_SG_ID"
echo "  ALB Security Group: $ALB_SG_ID"
echo "  VPC: $VPC_ID"

# Create Application Load Balancer
echo -e "${YELLOW}⚖️ Creating Application Load Balancer...${NC}"

ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${PROJECT_NAME}-alb \
    --subnets $SUBNET1_ID $SUBNET2_ID \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "exists")

if [ "$ALB_ARN" = "exists" ]; then
    echo -e "${YELLOW}⚠️ ALB already exists, getting ARN...${NC}"
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names ${PROJECT_NAME}-alb \
        --query 'LoadBalancers[0].LoadBalancerArn' --output text)
else
    echo -e "${GREEN}✅ ALB created: $ALB_ARN${NC}"
fi

# Create Target Group
echo -e "${YELLOW}🎯 Creating target group...${NC}"

TG_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "exists")

if [ "$TG_ARN" = "exists" ]; then
    echo -e "${YELLOW}⚠️ Target group already exists, getting ARN...${NC}"
    TG_ARN=$(aws elbv2 describe-target-groups \
        --names ${PROJECT_NAME}-tg \
        --query 'TargetGroups[0].TargetGroupArn' --output text)
else
    echo -e "${GREEN}✅ Target group created: $TG_ARN${NC}"
fi

# Create ALB Listener
echo -e "${YELLOW}👂 Creating ALB listener...${NC}"

LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --query 'Listeners[0].ListenerArn' --output text 2>/dev/null || echo "exists")

if [ "$LISTENER_ARN" = "exists" ]; then
    echo -e "${YELLOW}⚠️ Listener already exists${NC}"
else
    echo -e "${GREEN}✅ Listener created: $LISTENER_ARN${NC}"
fi

# Create CloudWatch Log Group
echo -e "${YELLOW}📊 Creating CloudWatch log group...${NC}"
aws logs create-log-group --log-group-name /ecs/hbb-service 2>/dev/null || echo "Log group already exists"

# Check if service already exists
if aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-service >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ ECS service already exists${NC}"
    
    # Update the service to desired count of 1
    aws ecs update-service \
        --cluster ${PROJECT_NAME}-cluster \
        --service ${PROJECT_NAME}-service \
        --desired-count 1 >/dev/null
    
    echo -e "${GREEN}✅ Service updated${NC}"
else
    # Create ECS Service
    echo -e "${YELLOW}🐳 Creating ECS service...${NC}"
    
    aws ecs create-service \
        --cluster ${PROJECT_NAME}-cluster \
        --service-name ${PROJECT_NAME}-service \
        --task-definition hbb-task-definition \
        --desired-count 1 \
        --launch-type FARGATE \
        --platform-version LATEST \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$TG_ARN,containerName=hbb-container,containerPort=3000" \
        --health-check-grace-period-seconds 300 >/dev/null
    
    echo -e "${GREEN}✅ ECS service created${NC}"
fi

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)

echo -e "\n${GREEN}🎉 ECS service setup complete!${NC}"
echo -e "\n${YELLOW}📋 Service Details:${NC}"
echo "Cluster: ${PROJECT_NAME}-cluster"
echo "Service: ${PROJECT_NAME}-service"
echo "Load Balancer URL: http://$ALB_DNS"
echo "Target Group: $TG_ARN"

echo -e "\n${YELLOW}📝 Add these to your GitHub secrets:${NC}"
echo "SUBNET_ID_1: $SUBNET1_ID"
echo "SUBNET_ID_2: $SUBNET2_ID"
echo "SECURITY_GROUP_ID: $ECS_SG_ID"

echo -e "\n${YELLOW}⏳ Note: It may take 5-10 minutes for the service to become stable${NC}"
echo -e "${YELLOW}Monitor the service at: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/${PROJECT_NAME}-cluster/services${NC}"