#!/bin/bash
set -e

AWS_REGION="us-east-1"
PROJECT_NAME="hbb"
VPC_CIDR="10.0.0.0/16"
SUBNET1_CIDR="10.0.1.0/24"
SUBNET2_CIDR="10.0.2.0/24"
AZ1="${AWS_REGION}a"
AZ2="${AWS_REGION}b"

echo "🚀 Setting up AWS infrastructure for HBB service..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: ${ACCOUNT_ID}${NC}"

# Create VPC
echo -e "${YELLOW}📡 Creating VPC...${NC}"
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block $VPC_CIDR \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value='${PROJECT_NAME}'-vpc}]' \
    --query 'Vpc.VpcId' --output text)
echo -e "${GREEN}✅ VPC created: ${VPC_ID}${NC}"

# Create Internet Gateway
echo -e "${YELLOW}🌐 Creating Internet Gateway...${NC}"
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value='${PROJECT_NAME}'-igw}]' \
    --query 'InternetGateway.InternetGatewayId' --output text)

aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
echo -e "${GREEN}✅ Internet Gateway created: ${IGW_ID}${NC}"

# Create Subnets
echo -e "${YELLOW}🏗️ Creating subnets...${NC}"
SUBNET1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $SUBNET1_CIDR \
    --availability-zone $AZ1 \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value='${PROJECT_NAME}'-subnet-1}]' \
    --query 'Subnet.SubnetId' --output text)

SUBNET2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block $SUBNET2_CIDR \
    --availability-zone $AZ2 \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value='${PROJECT_NAME}'-subnet-2}]' \
    --query 'Subnet.SubnetId' --output text)

echo -e "${GREEN}✅ Subnets created: ${SUBNET1_ID}, ${SUBNET2_ID}${NC}"

# Create Route Table
echo -e "${YELLOW}🗺️ Creating route table...${NC}"
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value='${PROJECT_NAME}'-rt}]' \
    --query 'RouteTable.RouteTableId' --output text)

aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $ROUTE_TABLE_ID
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $ROUTE_TABLE_ID

# Create Security Groups
echo -e "${YELLOW}🔒 Creating security groups...${NC}"
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-alb-sg \
    --description "ALB security group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-ecs-sg \
    --description "ECS security group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 3000 --source-group $ALB_SG_ID
aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol udp --port 40000-49999 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 40000-49999 --cidr 0.0.0.0/0

# Create ECS Cluster
echo -e "${YELLOW}🐳 Creating ECS cluster...${NC}"
aws ecs create-cluster --cluster-name ${PROJECT_NAME}-cluster >/dev/null 2>&1 || echo "Cluster exists"

echo -e "${GREEN}🎉 Infrastructure setup complete!${NC}"
echo "VPC ID: $VPC_ID"
echo "Subnet 1: $SUBNET1_ID"
echo "Subnet 2: $SUBNET2_ID"
echo "ECS Security Group: $ECS_SG_ID"

# Save GitHub secrets
cat > github-secrets.txt << SECRETS
Add these to GitHub repository secrets:

AWS_ACCESS_KEY_ID: [Your AWS Access Key]
AWS_SECRET_ACCESS_KEY: [Your AWS Secret Key]
SUBNET_ID_1: $SUBNET1_ID
SUBNET_ID_2: $SUBNET2_ID
SECURITY_GROUP_ID: $ECS_SG_ID
SECRETS

# Update task definition
if [ -f ".aws/task-definition.json" ]; then
    sed -i.bak "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" .aws/task-definition.json
    echo -e "${GREEN}✅ Task definition updated${NC}"
fi

echo -e "\n${GREEN}Next: ./scripts/setup-secrets.sh${NC}"
