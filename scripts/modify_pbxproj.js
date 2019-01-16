#!/usr/bin/env node

var exec = require("child_process").exec
var execSync = require("child_process").execSync
var fs = require("fs")
var path = require("path")
var xml2js = require("xml2js")
var parser = new xml2js.Parser()

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
    parser.parseString(fs.readFileSync("plugins/" + id + "/plugin.xml"), (err, data) => {
      if (!err && data.plugin.platform) {
        data.plugin.platform.forEach((platform) => {
          if (platform.$.name === "ios" && platform.carthage) {
            platform.carthage.forEach((carthage) => {
              if (carthage.cartfile) {
                carthage.cartfile.forEach((cartfile) => {
                  cartfiles.push(cartfile)
                })
              }
              if (carthage.framework) {
                carthage.framework.forEach((framework) => {
                  if (framework.$ && framework.$.src) {
                    frameworks.push(framework.$.src)
                  }
                })
              }
            })
          }
        })
      }
    })
  })

  if (0 < cartfiles.length && 0 < frameworks.length) {
    console.log("### Create Cartfile")
    fs.writeFileSync(cartfilePath, cartfiles.join("\r\n"))

    // var json = { frameworks: frameworks, project_path: xcodeProjectPath }
    // execSync("ruby " + __dirname + "/modify_pbxproj.rb '" + JSON.stringify(json) + "'", stdio);

    console.log("### Update Carthage")
    exec("carthage update", { cwd: platformPath }, (err, stdout, stderr) => {
      console.log(stdout)
      console.log(stderr)

      console.log("### Setting Run Script")
      var json = { frameworks: frameworks, project_path: xcodeProjectPath }
      execSync("ruby " + __dirname + "/modify_pbxproj.rb '" + JSON.stringify(json) + "'", stdio);
    })
  }

  function getConfigParser(context, config) {
    var semver = context.requireCordovaModule("semver")
    var ConfigParser
    if (semver.lt(context.opts.cordova.version, "5.4.0")) {
      ConfigParser = context.requireCordovaModule("cordova-lib/src/ConfigParser/ConfigParser")
    } else {
      ConfigParser = context.requireCordovaModule("cordova-common/src/ConfigParser/ConfigParser")
    }
    return new ConfigParser(config)
  }
}
