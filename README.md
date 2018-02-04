### install
```bash
npm i
```

### run web
```bash
ionic serve
```

### run mobile
```bash
source .bash_profile
ionic cordova run android --livereload
```
### test hot push on mobile

```bash
# build in aot mode
npm run build --prod

# gen chcp.json and chcp.manifest to ./www
cordova-hcp build

# build and run android-debug.apk
cordova emulate android
```

```bash
# modify and build again to test
cordova-hcp build

# upload to server
firebase deploy
```

### release app

```bash
# generate private key (alias_name可自訂)
keytool -genkey -v -keystore mykey.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# view the key's infomation (SHA1...)
keytool -list -v -keystore mykey.keystore
```

```js
// new and edit build.json
{
  "android": {
    "release": {
      "keystore": "android.keystore",
      "storePassword": "storepassword",
      "alias": "mykey",
      "password" : "password",
      "keystoreType": ""
    }
  }
}
```

```bash
ionic cordova build --release android
```

### deploy web host(firebase)

```bash
firebase deploy
```

