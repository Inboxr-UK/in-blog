const gulp = require('gulp');
const clean = require('gulp-clean');
const path = require('path');
const plumber = require('gulp-plumber');
const vfs = require('vinyl-fs');
const GulpDockerCompose = require('gulp-docker-compose').GulpDockerCompose;

const srcFolder = `${__dirname}/site/`;
const dstFolder = `${__dirname}/www/`;

// clean the previous build
gulp.task('clean', function() {
    return gulp.src(dstFolder, {read: false})
        .pipe(clean({force: true}));
});

//compile js removed as dont need to compile
gulp.task('build', ['clean'], function() {
    // vfs follows symlinks
    // return vfs.src(srcFolder+'/**/*.js')
    //     .pipe(plumber())
    //     .pipe(babel({
    //         presets: [
    //             ["env", {
    //                 "targets": {
    //                     "node": "4"
    //                 },
    //                 "modules": "commonjs",
    //             }],
    //         ]
    //     }))
    //     .pipe(vfs.dest(dstFolder));
});

var gulpDocker = new GulpDockerCompose(gulp, {
    serviceName: 'website',
    tasks: {
        run: {
            name: 'run',
            dependences: ['build'],
        },
        restart: {
            name: 'restart',
            dependences: ['build'],
        },
        // are we using thos?
        // watchYML: {
        //     name: 'watch-yml',
        // },
    },
    extraArgs: {
        upOnRun: '--scale app=3',
        upOnYMLChange: '--scale app=3',
    },
    exposeCLICommands: true,
    exposeStdOut: false,
    exposeStdErr: true,
    projectFolder: __dirname,
});

gulp.task('watch', function() {
    gulp.watch([srcFolder+'/**/*'], ['restart']);
});

gulp.task('default', [ 'watch', 'run']); //'watch-yml', 'build', 'build', 