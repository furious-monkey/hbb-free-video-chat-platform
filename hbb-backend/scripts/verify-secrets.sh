#!/bin/bash
# Verify all required secrets exist

echo "🔍 Verifying all required secrets exist..."

SECRETS=(
    "hbb-database-url"
    "hbb-jwt-secret" 
    "hbb-redis-url"
    "hbb-aws-secret-key"
    "hbb-stripe-secret"
    "hbb-mailgun-api-key"
    "hbb-dtls-cert"
    "hbb-dtls-key"
)

MISSING_SECRETS=()

for SECRET in "${SECRETS[@]}"; do
    if aws secretsmanager describe-secret --secret-id "$SECRET" >/dev/null 2>&1; then
        echo "✅ $SECRET exists"
    else
        echo "❌ $SECRET missing"
        MISSING_SECRETS+=("$SECRET")
    fi
done

if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    echo ""
    echo "🎉 All secrets exist! You can proceed with updating the task definition."
    echo ""
    echo "Run: ./update-task-definition.sh"
else
    echo ""
    echo "⚠️  Missing secrets found. You need to create them first:"
    for SECRET in "${MISSING_SECRETS[@]}"; do
        echo "  • $SECRET"
    done
    echo ""
    echo "🔧 To create missing secrets, run:"
    echo "   ./scripts/setup-secrets.sh"
    echo ""
    echo "📝 Or create them manually:"
    for SECRET in "${MISSING_SECRETS[@]}"; do
        echo "aws secretsmanager create-secret --name $SECRET --secret-string 'YOUR_VALUE'"
    done
fi