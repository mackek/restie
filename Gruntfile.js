/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Vadim Demedes;' +
        ' Licensed MIT */' + "\n\n" +
        'if (!(typeof window !== "undefined" && window !== null)) { global.window = {}; }',
        stripBanners: true
      },
      dist: {
        src: ['vendor/inflection/inflection.js', 'lib/adapters/jquery.js', 'lib/adapters/nodejs.js', 'lib/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      build: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: 'lib/*.coffee',
      tasks: ['coffee', 'concat', 'uglify']
    },
    coffee: {
      compile: {
        files: {
          'lib/restie.js': 'lib/restie.coffee'
        },
        options: {
          bare: true
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task.
  grunt.registerTask('default', ['coffee', 'concat', 'uglify']);

};
