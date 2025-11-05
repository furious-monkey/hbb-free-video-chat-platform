#!/bin/bash
# scripts/fix-aws-permissions.sh
# Script to create and attach the necessary IAM policies for HBB deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Fixing AWS permissions for HBB deployment...${NC}"

# Get current user info
CURRENT_USER=$(aws sts get-caller-identity --query 'Arn' --output text)
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
USER_NAME=$(echo $CURRENT_USER | cut -d'/' -f2)

echo -e "${GREEN}Current User: ${USER_NAME}${NC}"
echo -e "${GREEN}Account ID: ${ACCOUNT_ID}${NC}"

# Create the IAM policy document
cat > /tmp/hbb-deployment-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRFullAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchImportLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:CreateRepository",
        "ecr:DeleteRepository",
        "ecr:DescribeRepositories",
        "ecr:GetRepositoryPolicy",
        "ecr:InitiateLayerUpload",
        "ecr:ListImages",
        "ecr:PutImage",
        "ecr:SetRepositoryPolicy",
        "ecr:UploadLayerPart",
        "ecr:DescribeImages",
        "ecr:DeleteRepositoryPolicy"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSFullAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:CreateCluster",
        "ecs:DeleteCluster",
        "ecs:DescribeClusters",
        "ecs:CreateService",
        "ecs:UpdateService",
        "ecs:DeleteService",
        "ecs:DescribeServices",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:ListTaskDefinitions",
        "ecs:RunTask",
        "ecs:StopTask",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:ListContainerInstances",
        "ecs:DescribeContainerInstances",
        "ecs:UpdateContainerAgent",
        "ecs:StartTask",
        "ecs:ListServices",
        "ecs:ListClusters",
        "ecs:PutAttributes",
        "ecs:TagResource",
        "ecs:UntagResource",
        "ecs:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ELBAccess",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "VPCNetworkingAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:DescribeVpcs",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:DescribeSubnets",
        "ec2:CreateInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeRegions",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeImages",
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMRoleAccess",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListPolicyVersions",
        "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": [
        "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole*",
        "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskRole*",
        "arn:aws:iam::${ACCOUNT_ID}:policy/ECS*",
        "arn:aws:iam::${ACCOUNT_ID}:policy/HBB*"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:DeleteSecret",
        "secretsmanager:DescribeSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:UpdateSecret",
        "secretsmanager:ListSecrets",
        "secretsmanager:TagResource",
        "secretsmanager:UntagResource"
      ],
      "Resource": "arn:aws:secretsmanager:*:${ACCOUNT_ID}:secret:hbb-*"
    },
    {
      "Sid": "LogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:CreateLogStream",
        "logs:DeleteLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:PutRetentionPolicy",
        "logs:TagLogGroup",
        "logs:UntagLogGroup"
      ],
      "Resource": "arn:aws:logs:*:${ACCOUNT_ID}:log-group:/ecs/hbb-*"
    },
    {
      "Sid": "ApplicationAutoScalingAccess",
      "Effect": "Allow",
      "Action": [
        "application-autoscaling:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "STSAccess",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create the IAM policy
echo -e "${YELLOW}📋 Creating IAM policy...${NC}"
POLICY_ARN=$(aws iam create-policy \
    --policy-name HBBDeploymentPolicy \
    --policy-document file:///tmp/hbb-deployment-policy.json \
    --description "Policy for HBB service deployment to AWS" \
    --query 'Policy.Arn' --output text 2>/dev/null || echo "exists")

if [ "$POLICY_ARN" = "exists" ]; then
    echo -e "${YELLOW}⚠️  Policy already exists, getting ARN...${NC}"
    POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/HBBDeploymentPolicy"
else
    echo -e "${GREEN}✅ Policy created: ${POLICY_ARN}${NC}"
fi

# Attach the policy to the user
echo -e "${YELLOW}🔗 Attaching policy to user ${USER_NAME}...${NC}"
aws iam attach-user-policy \
    --user-name $USER_NAME \
    --policy-arn $POLICY_ARN

echo -e "${GREEN}✅ Policy attached successfully!${NC}"

# Clean up
rm -f /tmp/hbb-deployment-policy.json

# Test ECR access
echo -e "${YELLOW}🧪 Testing ECR access...${NC}"
if aws ecr describe-repositories --repository-names hbb-backend >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ECR repository already exists${NC}"
elif aws ecr create-repository --repository-name hbb-backend --region us-east-1 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ECR repository created successfully${NC}"
else
    echo -e "${RED}❌ Still having issues with ECR access${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Permissions fixed! You can now proceed with the deployment.${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run: ./scripts/setup-aws-infrastructure.sh"
echo "2. Run: ./scripts/setup-secrets.sh"
echo "3. Add GitHub secrets and push your code"

echo -e "\n${YELLOW}📝 If you're using GitHub Actions, make sure to use these credentials as secrets:${NC}"
echo "AWS_ACCESS_KEY_ID: [Your current access key]"
echo "AWS_SECRET_ACCESS_KEY: [Your current secret key]"