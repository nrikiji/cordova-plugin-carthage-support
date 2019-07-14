#!/usr/bin/env node

var crypto = require("crypto");
var exec = require("child_process").exec
var execSync = require("child_process").execSync
var fs = require("fs")
var path = require("path")
var xml2js = require("xml2js")
var parser = new xml2js.Parser()
var semver = require('semver');

var stdio = { stdio:[0, 1, 2] };

module.exports = function (context) {
    var rootPath = context.opts.projectRoot
    var configPath = path.join(rootPath, "config.xml")
    var configParser = getConfigParser(context, configPath)
    var platformPath = rootPath + "/platforms/ios"
    var cartfilePath = platformPath + "/Cartfile"
    var xcodeProjectPath = platformPath + "/" + configParser.name() + ".xcodeproj"

    var cartfiles = []
    var frameworks = []

    context.opts.cordova.plugins.forEach(id => {
        var xmlPath = "plugins/" + id + "/plugin.xml"
        parser.parseString(fs.readFileSync(xmlPath), (err, data) => {
            if (err || !data.plugin.platform) {
                return
            }
            data.plugin.platform.forEach((platform) => {
                if (platform.$.name != "ios" || !platform.carthage) {
                    return
                }
                platform.carthage.forEach((carthage) => {
                    var items = carthage.cartfile || []
                    items.forEach((cartfile) => {
                        cartfiles.push(cartfile)
                    })
                    items = carthage.framework || []
                    items.filter((framework) => {
                        return framework.$ && framework.$.src
                    }).forEach((framework) => {
                        frameworks.push(framework.$.src)
                    })
                })
            })
        })
    })

    if (cartfiles.length < 1 || frameworks.length < 1) {
        process.exit(0)
    }

    console.log("##### Create Cartfile")
    var cmd, tmpCartfilePath = cartfilePath + ".tmp"
    fs.writeFileSync(tmpCartfilePath, cartfiles.join("\r\n"))

    if (changeCartfile(cartfilePath, tmpCartfilePath)) {
        cmd = "carthage update --platform iOS"
    } else {
        cmd = "carthage bootstrap --platform iOS --cache-builds"
    }
    fs.writeFileSync(cartfilePath, cartfiles.join("\r\n"))

    console.log("##### Update Carthage")
    console.log(cmd)
    exec(cmd, { cwd: platformPath }, (err, stdout, stderr) => {
        if (err) {
            console.error(err, stderr)
            process.exit(1)
        }
        console.log(stdout)
        console.log("##### Setting Run Script")
        var json = { frameworks: frameworks, project_path: xcodeProjectPath }
        execSync("ruby " + __dirname + "/modify_pbxproj.rb '" + JSON.stringify(json) + "'", stdio);
    })

    function getConfigParser(context, config) {
        let ConfigParser;

        if (semver.lt(context.opts.cordova.version, '5.4.0')) {
            ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser');
        } else {
            ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
        }

        return new ConfigParser(configPath);
    }

    function changeCartfile(srcPath, dstPath) {
        try {
            fs.statSync(srcPath)
            fs.statSync(dstPath)
            return md5file(srcPath) != md5file(dstPath)
        } catch(err) {
            return true
        }
    }

    function md5file(path) {
        var target = fs.readFileSync(path)
        var md5hash = crypto.createHash("md5")
        md5hash.update(target)
        return md5hash.digest("hex")
    }    
}
