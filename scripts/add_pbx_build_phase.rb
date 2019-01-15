#!/usr/bin/env ruby

require "xcodeproj"
require "json"

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
    flagBuildPhase = false
    target.build_phases.each do |build_phase|
      if build_phase.isa != "PBXShellScriptBuildPhase"
        next
      elsif build_phase.name != "Cordova Plugin Carthage Run Script"
        next
      else
        flagBuildPhase = true
      end
    end
    if !flagBuildPhase
      build_phase = project.new(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
      build_phase.name = "Cordova Plugin Carthage Run Script"
      build_phase.shell_path = "/bin/sh"
      build_phase.shell_script = "/usr/local/bin/carthage copy-frameworks\n"
      target.build_phases << build_phase
    end
  end

  project.targets.each do |target|
    target.build_phases.each do |build_phase|
      if build_phase.isa != "PBXShellScriptBuildPhase"
        next
      elsif build_phase.name != "Cordova Plugin Carthage Run Script"
        next
      end
      frameworks["frameworks"].each do |framework|
        unless build_phase.input_paths.include?(framework)
          build_phase.input_paths.push(framework)
        end
      end
    end
  end

  project.save()
  
rescue => e
  p e
end
