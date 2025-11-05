#!/bin/bash
# Check project structure for Docker build issues

echo "🔍 Checking project structure..."

echo "📁 Root directory contents:"
ls -la

echo ""
echo "📋 Required files check:"
FILES=("package.json" "tsconfig.json" "Dockerfile")
for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "✅ $FILE exists"
    else
        echo "❌ $FILE missing"
    fi
done

echo ""
echo "📂 Source directory:"
if [ -d "src" ]; then
    echo "✅ src/ directory exists"
    echo "Contents:"
    find src -name "*.ts" -o -name "*.js" | head -10
    
    # Find the main entry point
    echo ""
    echo "🎯 Looking for main entry point:"
    ENTRY_POINTS=("src/index.ts" "src/app.ts" "src/server.ts" "src/main.ts")
    for ENTRY in "${ENTRY_POINTS[@]}"; do
        if [ -f "$ENTRY" ]; then
            echo "✅ Found: $ENTRY"
            MAIN_FILE="$ENTRY"
            break
        fi
    done
    
    if [ -z "$MAIN_FILE" ]; then
        echo "❌ No main entry point found"
        echo "Available TS files in src/:"
        find src -name "*.ts" | head -5
    fi
else
    echo "❌ src/ directory missing"
fi

echo ""
echo "📦 package.json scripts:"
if [ -f "package.json" ]; then
    cat package.json | jq -r '.scripts'
else
    echo "❌ package.json not found"
fi

echo ""
echo "🐳 .dockerignore check:"
if [ -f ".dockerignore" ]; then
    echo "⚠️ .dockerignore exists, checking if it excludes important files:"
    cat .dockerignore | grep -E "(tsconfig|src|package)" || echo "No conflicts found"
else
    echo "✅ No .dockerignore file (good)"
fi

echo ""
echo "🔧 TypeScript config:"
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
    echo "Output directory:"
    cat tsconfig.json | jq -r '.compilerOptions.outDir // "Not specified"'
else
    echo "❌ tsconfig.json missing - this is the problem!"
fi