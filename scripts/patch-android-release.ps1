# Apply Play Store release signing + version to android/app/build.gradle (idempotent).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$gradle = Join-Path $root "android\app\build.gradle"

if (-not (Test-Path $gradle)) {
    Write-Error "android\app\build.gradle not found. Run: npx cap add android"
}

$content = Get-Content $gradle -Raw

if ($content -notmatch "signingConfigs") {
    $signingBlock = @'

def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

'@
    $content = $signingBlock + $content

    $content = $content -replace '(android \{\s*\n)', @'
android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

'@

    $content = $content -replace '(buildTypes \{\s*\n\s*release \{\s*\n)', @'
buildTypes {
        release {
            signingConfig signingConfigs.release
'@
}

# Launch version — bump versionCode for each Play Store upload.
$content = $content -replace 'versionCode \d+', 'versionCode 1'
$content = $content -replace 'versionName "[^"]*"', 'versionName "1.0.0"'

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($gradle, $content.TrimEnd() + "`n", $utf8NoBom)
Write-Host "Patched android/app/build.gradle for Play Store release (v1.0.0 / code 1)."
