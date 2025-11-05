#!/bin/bash
# Get the correct ARNs for all secrets

echo "🔍 Getting correct secret ARNs..."

SECRETS=("hbb-database-url" "hbb-jwt-secret" "hbb-redis-url" "hbb-aws-access-key" "hbb-aws-secret-key" "hbb-stripe-secret" "hbb-mailgun-api-key" "hbb-dtls-cert" "hbb-dtls-key")

echo "Copy these ARNs to your task definition:"
echo "========================================="

for SECRET in "${SECRETS[@]}"; do
    ARN=$(aws secretsmanager describe-secret --secret-id $SECRET --query 'ARN' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$ARN" != "NOT_FOUND" ]; then
        echo "\"$SECRET\": \"$ARN\""
    else
        echo "❌ $SECRET: NOT FOUND"
    fi
done

echo ""
echo "📝 Update your task definition with these complete ARNs"