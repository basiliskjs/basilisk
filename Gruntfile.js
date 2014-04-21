module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            build: {                       // a particular target
                src: ["src/**/*.ts"],      // The source typescript files, http://gruntjs.com/configuring-tasks#files
                outDir: 'build',           // If specified, the generate javascript files are placed here. Only works if out is not specified
                options: {                 // use to override the default options, http://gruntjs.com/configuring-tasks#options
                    target: 'es3',         // 'es3' (default) | 'es5'
                    module: 'amd',         // 'amd' (default) | 'commonjs'
                    sourceMap: false,       // true (default) | false
                    declaration: true,     // true | false (default)
                    removeComments: false  // true (default) | false
                }
            },
            testbuild: {                       // a particular target
                src: ["tests/**/*.ts"],      // The source typescript files, http://gruntjs.com/configuring-tasks#files
                outDir: 'testbuild',           // If specified, the generate javascript files are placed here. Only works if out is not specified
                options: {                 // use to override the default options, http://gruntjs.com/configuring-tasks#options
                    target: 'es3',         // 'es3' (default) | 'es5'
                    module: 'amd',         // 'amd' (default) | 'commonjs'
                    sourceMap: false,       // true (default) | false
                    declaration: true,     // true | false (default)
                    removeComments: false  // true (default) | false
                }
            }
        },

        connect: {
            test : {
                port : 8000
            }
        },
        jasmine: {
            taskName: {
                options: {
                    specs: 'testbuild/tests/*.test.js',
                    host: 'http://127.0.0.1:8000/',
                    outfile: 'testbuild/tests/_SpecRunner.html',
                    keepRunner: true,
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        requireConfig: {
                            baseUrl: '/testbuild/tests'
                        }
                    }
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-ts');

    grunt.registerTask('build', ['ts:build']);

    // We build our code, then also build in our tests
    grunt.registerTask('test', ['ts:testbuild', 'connect:test', 'jasmine']);
};