const fs = require('fs');
try {
    const { getDefaultConfig } = require("expo/metro-config");
    const { withNativeWind } = require("nativewind/metro");

    const config = getDefaultConfig(__dirname);
    const newConfig = withNativeWind(config, { input: "./global.css" });
    console.log("Success!");
} catch (e) {
    fs.writeFileSync('debug_error.txt', e.toString() + '\n' + e.stack);
    console.error("Failed, wrote to debug_error.txt");
}
