#!/bin/bash

# Package script for Mindful Tab Switch extension
# This creates a production-ready zip file for Chrome Web Store

echo "Packaging BlockBS extension..."

# Check if icons exist
if [ ! -f "icon16.png" ] || [ ! -f "icon48.png" ] || [ ! -f "icon128.png" ]; then
    echo "❌ Error: Icon files not found!"
    echo "Please generate icons using create-icons.html first"
    exit 1
fi

# Create temp directory for clean packaging
TEMP_DIR="blockbs_package_temp"
rm -rf "$TEMP_DIR"
mkdir "$TEMP_DIR"

# Copy necessary files
echo "Copying files..."
cp manifest.json "$TEMP_DIR/"
cp background.js "$TEMP_DIR/"
cp validation.js "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"
cp modal.css "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.css "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"
cp icon16.png "$TEMP_DIR/"
cp icon48.png "$TEMP_DIR/"
cp icon128.png "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Create zip file
cd "$TEMP_DIR"
zip -r ../blockbs-extension.zip . -x "*.DS_Store"
cd ..

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Package created: blockbs-extension.zip"
echo ""
echo "Next steps:"
echo "1. Go to https://chrome.google.com/webstore/devconsole"
echo "2. Click 'New Item'"
echo "3. Upload blockbs-extension.zip"
echo "4. Fill out the store listing"
echo "5. Submit for review"
