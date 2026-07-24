# Keystore Setup Guide

This document guides you through creating and configuring a keystore for APK signing.

## Generate Keystore File

Run this command on your local machine:

```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias farm-directory-key
```

When prompted, enter:
- **Keystore Password:** `FarmDirectory2024!` (save this)
- **Key Password:** `FarmDirectory2024!` (save this)
- **First and Last Name:** Your Name
- **Organizational Unit:** Development
- **Organization:** Farm Directory Pro
- **City/Locality:** Your City
- **State/Province:** Your State
- **Country Code:** US (or your country code)

This creates `release.keystore` file.

## Convert to Base64

```bash
base64 -w 0 release.keystore > keystore.b64
cat keystore.b64
```

Copy the output.

## Add GitHub Secrets

Go to: https://github.com/1andrewprice6-jpg/Farm-directory-pro-g/settings/secrets/actions

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `KEYSTORE_BASE64` | Paste the base64 string from above |
| `KEYSTORE_PASSWORD` | `FarmDirectory2024!` |
| `KEY_ALIAS` | `farm-directory-key` |
| `KEY_PASSWORD` | `FarmDirectory2024!` |
| `VITE_API_URL` | `https://api.example.com` |

## Secure Storage

⚠️ **IMPORTANT:**
- Keep `release.keystore` file **PRIVATE** - do NOT commit to Git
- Store the passwords securely in a password manager
- Never share the keystore file or passwords publicly
- Add to `.gitignore`:
  ```
  *.keystore
  *.jks
  keystore.b64
  ```

## Verification

After adding secrets, trigger a build:
```
https://github.com/1andrewprice6-jpg/Farm-directory-pro-g/actions
```

Watch the workflow complete and download the signed APK artifact.
