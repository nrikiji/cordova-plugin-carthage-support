# cordova-plugin-carthage-support
本プラグインはCarthageで導入したライブラリを使用してCordovaプラグインを開発するためのプラグイン。  
Xcodeの`Build Phases`へ`Run Script`の設定を行う。  

## Supported Platforms
- iOS

## Supported version
Node vXXX  
Cordova vXXX  

## Requirement
https://github.com/CocoaPods/Xcodeproj  
https://github.com/Leonidas-from-XIV/node-xml2js  

## Installation
```
cordova plugin add https://github.com/nrikiji/cordova-plugin-carthage-support.git
```

## Usage、Example

1. carthageでframeworkを入手  

```
# Cartfile
github "line/line-sdk-ios-swift" ~> 5.0

# Build
carthage update --platform iOS

# Copy framework
cp -r Carthage/Build/iOS/LineSDK.framework /path/to/plugin/src/ios
cp -r Carthage/Build/iOS/LineSDKObjC.framework /path/to/plugin/src/ios
```

2. plugin.xmlのframeworkタグにcarthage属性を追加  

plugin.xml
```
<framework src="src/ios/LineSDK.framework" custom="true" carthage="true" />
<framework src="src/ios/LineSDKObjC.framework" custom="true" carthage="true" />
```
