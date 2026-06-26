# Apply Play Store release signing, R8 optimization, and version to android/app/build.gradle (idempotent).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$gradle = Join-Path $root "android\app\build.gradle"
$proguardTemplate = Join-Path $root "scripts\android-proguard-rules.pro"
$proguardDest = Join-Path $root "android\app\proguard-rules.pro"
$versionFile = Join-Path $root "scripts\android-version.properties"

if (-not (Test-Path $versionFile)) {
    Write-Error "scripts\android-version.properties not found."
}

$versionProps = @{}
Get-Content $versionFile | ForEach-Object {
    if ($_ -match '^\s*versionCode\s*=\s*(\d+)\s*$') { $versionProps.versionCode = $matches[1] }
    if ($_ -match '^\s*versionName\s*=\s*(.+)\s*$') { $versionProps.versionName = $matches[1].Trim() }
}

if (-not $versionProps.versionCode -or -not $versionProps.versionName) {
    Write-Error "scripts\android-version.properties must define versionCode and versionName."
}

if (-not (Test-Path $gradle)) {
    Write-Error "android\app\build.gradle not found. Run: npx cap add android"
}

if (-not (Test-Path $proguardTemplate)) {
    Write-Error "scripts\android-proguard-rules.pro not found."
}

Copy-Item $proguardTemplate $proguardDest -Force

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

# R8: code shrinking + obfuscation (release only)
$content = $content -replace 'minifyEnabled\s+false', 'minifyEnabled true'
if ($content -notmatch 'minifyEnabled\s+true') {
    $content = $content -replace '(signingConfig signingConfigs\.release\s*\n)', "`$1            minifyEnabled true`n"
}

$content = $content -replace "getDefaultProguardFile\('proguard-android\.txt'\)", "getDefaultProguardFile('proguard-android-optimize.txt')"

if ($content -notmatch 'shrinkResources\s+true') {
    $content = $content -replace '(minifyEnabled\s+true\s*\n)', "`$1            shrinkResources true`n"
}

if ($content -notmatch "proguardFiles getDefaultProguardFile\('proguard-android-optimize\.txt'\)") {
    $content = $content -replace '(shrinkResources\s+true\s*\n)', "`$1            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'`n"
    if ($content -notmatch "proguardFiles getDefaultProguardFile\('proguard-android-optimize\.txt'\)") {
        $content = $content -replace '(minifyEnabled\s+true\s*\n)', "`$1            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'`n"
    }
}

# Play Store version — edit scripts/android-version.properties before each upload.
$content = $content -replace 'versionCode \d+', "versionCode $($versionProps.versionCode)"
$content = $content -replace 'versionName "[^"]*"', "versionName `"$($versionProps.versionName)`""

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($gradle, $content.TrimEnd() + "`n", $utf8NoBom)
Write-Host "Patched android/app/build.gradle for Play Store release (R8 enabled, v$($versionProps.versionName) / code $($versionProps.versionCode))."
