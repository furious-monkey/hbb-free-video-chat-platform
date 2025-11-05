#!/bin/bash
# scripts/setup-secrets.sh - macOS compatible
set -e

echo "🔐 Setting up AWS Secrets Manager secrets..."

create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    if [ -z "$secret_value" ]; then
        echo "❌ Error: Empty secret value for $secret_name"
        return 1
    fi
    
    if aws secretsmanager describe-secret --secret-id "$secret_name" >/dev/null 2>&1; then
        echo "⚠️  Updating existing secret: $secret_name"
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" >/dev/null
    else
        echo "✅ Creating secret: $secret_name"
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "$description" \
            --secret-string "$secret_value" >/dev/null
    fi
}

# Database URL
read -p "Enter DATABASE_URL: " DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    create_or_update_secret "hbb-database-url" "$DATABASE_URL" "Database URL"
fi

# JWT Secret
read -p "Enter JWT secret (or press Enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret: $JWT_SECRET"
fi
create_or_update_secret "hbb-jwt-secret" "$JWT_SECRET" "JWT secret"

# Redis URL
read -p "Enter Redis URL (default: redis://localhost:6379): " REDIS_URL
REDIS_URL=${REDIS_URL:-redis://localhost:6379}
create_or_update_secret "hbb-redis-url" "$REDIS_URL" "Redis URL"

# AWS Credentials
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    create_or_update_secret "hbb-aws-access-key" "$AWS_ACCESS_KEY_ID" "AWS access key"
fi

read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo
if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    create_or_update_secret "hbb-aws-secret-key" "$AWS_SECRET_ACCESS_KEY" "AWS secret key"
fi

# Stripe
read -p "Enter Stripe Secret Key: " STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
    create_or_update_secret "hbb-stripe-secret" "$STRIPE_SECRET_KEY" "Stripe secret"
fi

# Mailgun
read -p "Enter Mailgun API Key: " MAILGUN_API_KEY
if [ -n "$MAILGUN_API_KEY" ]; then
    create_or_update_secret "hbb-mailgun-api-key" "$MAILGUN_API_KEY" "Mailgun API key"
fi

# Generate DTLS certificates for MediaSoup
echo "🔑 Generating DTLS certificates for MediaSoup..."

# Create temp directory
TEMP_DIR=$(mktemp -d)

# Generate certificates
openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
    -keyout "$TEMP_DIR/dtls-key.pem" \
    -out "$TEMP_DIR/dtls-cert.pem" \
    -subj "/C=US/ST=State/L=City/O=HBB/CN=mediasoup.hbb.com" 2>/dev/null

# Check if files were created
if [ -f "$TEMP_DIR/dtls-cert.pem" ] && [ -f "$TEMP_DIR/dtls-key.pem" ]; then
    echo "✅ Certificates generated successfully"
    
    # macOS-compatible base64 encoding
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        DTLS_CERT_BASE64=$(base64 -i "$TEMP_DIR/dtls-cert.pem" | tr -d '\n')
        DTLS_KEY_BASE64=$(base64 -i "$TEMP_DIR/dtls-key.pem" | tr -d '\n')
    else
        # Linux
        DTLS_CERT_BASE64=$(base64 -w 0 "$TEMP_DIR/dtls-cert.pem")
        DTLS_KEY_BASE64=$(base64 -w 0 "$TEMP_DIR/dtls-key.pem")
    fi
    
    # Verify base64 encoding worked
    if [ ${#DTLS_CERT_BASE64} -gt 0 ] && [ ${#DTLS_KEY_BASE64} -gt 0 ]; then
        create_or_update_secret "hbb-dtls-cert" "$DTLS_CERT_BASE64" "DTLS certificate"
        create_or_update_secret "hbb-dtls-key" "$DTLS_KEY_BASE64" "DTLS private key"
        echo "✅ DTLS certificates stored in secrets manager"
    else
        echo "❌ Error: Base64 encoding failed"
        exit 1
    fi
else
    echo "❌ Error: Certificate generation failed"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "\n✅ All secrets created successfully!"

# List created secrets
echo -e "\n📋 Created secrets:"
aws secretsmanager list-secrets \
    --query 'SecretList[?starts_with(Name, `hbb-`)].Name' \
    --output table
