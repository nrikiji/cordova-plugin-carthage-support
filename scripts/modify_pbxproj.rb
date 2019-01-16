#!/usr/bin/env ruby

require "xcodeproj"
require "json"

BUILD_PHASE_NAME = "Cordova Plugin Carthage Run Script"

begin
  if ARGV.size < 1
    raise "require argument"
  end
  
  frameworks = JSON.parse(ARGV[0])
  if !frameworks.has_key?("frameworks")
    raise "frameworks is not exists"
  elsif !frameworks.has_key?("project_path")
    raise "project_path is not exists"
  end

  project_path = frameworks["project_path"]
  project = Xcodeproj::Project.open(project_path)

  project.targets.each do |target|
    paths = ['$(inherited)', "$(PROJECT_DIR)/Carthage/Build/iOS"]
    target.build_settings("Debug")["FRAMEWORK_SEARCH_PATHS"] = paths
    target.build_settings("Release")["FRAMEWORK_SEARCH_PATHS"] = paths
  end

  # project.build_configuration_list.build_configurations.each do |build_configuration|
  #   p "###############################"
  #   p build_configuration.isa
  #   p build_configuration.name

  #   paths = ["$(PROJECT_DIR)/Carthage/Build/iOS"]
  #   build_configuration.build_settings["FRAMEWORK_SEARCH_PATHS"] = paths
  # end

  # project.targets.each do |target|
  #   flagBuildPhase = false
  #   target.build_phases.each do |build_phase|
  #     if build_phase.isa != "PBXShellScriptBuildPhase"
  #       next
  #     elsif build_phase.name != BUILD_PHASE_NAME
  #       next
  #     else
  #       flagBuildPhase = true
  #     end
  #   end
  #   if !flagBuildPhase
  #     build_phase = project.new(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
  #     build_phase.name = BUILD_PHASE_NAME
  #     build_phase.shell_path = "/bin/sh"
  #     build_phase.shell_script = "/usr/local/bin/carthage copy-frameworks\n"
  #     build_phase.input_paths = []
  #     target.build_phases << build_phase
  #   end
  # end

  # project.targets.each do |target|
  #   flagBuildPhase = false
  #   target.build_phases.each do |build_phase|
  #     if build_phase.isa == "PBXFrameworksBuildPhase"
  #       frameworks["frameworks"].each do |framework|
  #         framework_ref = project.new(Xcodeproj::Project::Object::PBXFileReference)
  #         framework_ref.name = framework
  #         framework_ref.path = "Carthage/Build/iOS/" + framework
  #         build_phase.add_file_reference(framework_ref, true)
  #       end
  #     end
  #   end
  # end

  # project.targets.each do |target|
  #   target.build_phases.each do |build_phase|
  #     if build_phase.isa != "PBXShellScriptBuildPhase"
  #       next
  #     elsif build_phase.name != BUILD_PHASE_NAME
  #       next
  #     end
  #     frameworks["frameworks"].each do |framework|
  #       framework_path = "$(SRCROOT)/Carthage/Build/iOS/" + framework
  #       unless build_phase.input_paths.include?(framework_path)
  #         build_phase.input_paths.push(framework_path)
  #       end
  #     end
  #   end
  # end

  project.save()
  
rescue => e
  p e
end
