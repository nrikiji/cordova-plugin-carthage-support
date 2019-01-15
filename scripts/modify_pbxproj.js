#!/usr/bin/env node

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
    var xcodeProjectPath = rootPath + "/platforms/ios/" + configParser.name() + ".xcodeproj"

    var frameworks = []
    context.opts.cordova.plugins.forEach(id => {
        parser.parseString(fs.readFileSync('plugins/' + id + '/plugin.xml'), (err, data) => {
            if (!err && data.plugin.platform) {
                data.plugin.platform.forEach((platform) => {
                    if (platform.$.name === 'ios') {
                        (platform.framework || []).forEach(framework => {
                            if (framework.$.carthage) {
                                frameworks.push(configParser.name() + "/Plugins/" + id + "/" + path.basename(framework.$.src))
                            }
                        })
                    }
                })
            }
        })
    })
    if (0 < frameworks.length) {
        var json = { frameworks: frameworks, project_path: xcodeProjectPath }
        execSync("ruby " + __dirname + "/add_pbx_build_phase.rb '" + JSON.stringify(json) + "'", stdio);
    }

    function getConfigParser(context, config) {
        var semver = context.requireCordovaModule("semver")
        var ConfigParser
        if (semver.lt(context.opts.cordova.version, '5.4.0')) {
            ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser')
        } else {
            ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser')
        }
        return new ConfigParser(config)
    }
}
