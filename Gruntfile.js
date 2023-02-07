module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-text-replace');
    require('time-grunt')(grunt);
    require('load-grunt-config')(grunt, {
        jitGrunt: {
            staticMappings: {
                scsslint: 'grunt-scss-lint',
                replace: 'grunt-text-replace'
            }
        }
    });

    grunt.registerTask('jqueryui', ['clean:jqueryui', 'copy:jqueryui', 'replace:jqueryui']);
    grunt.registerTask('default', ['eslint', 'karma', 'scsslint', 'svgstore', 'jqueryui'])
};
