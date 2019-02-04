const os = require('os');
const gulp = require('gulp');
const clean = require('gulp-clean');
const path = require('path');
const plumber = require('gulp-plumber');
const vfs = require('vinyl-fs');
const GulpDockerCompose = require('gulp-docker-compose').GulpDockerCompose;
const livereload = require('gulp-livereload');
const sass = require('gulp-sass');
const sassLint = require('gulp-sass-lint');
const run = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
 
sass.compiler = require('node-sass');

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
    return vfs.src(srcFolder+'/**/*')
        .pipe(plumber())
        .pipe(vfs.dest(dstFolder));
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


gulp.task('sass', ['sassLint'], function () {
    return gulp.src('./assets/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./site/themes/inboxr/css'));
        //.pipe(livereload());
});

gulp.task('sassLint', function() {
    return gulp.src(['./assets/sass/**/*.s+(a|c)ss', '!./assets/sass/_grid.scss'])
        .pipe(sassLint())
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
});

// gulp.task('sass:watch', function () {
//     gulp.watch('./sass/**/*.scss', ['sass']);
//   });

gulp.task('watch', function() {
    gulp.watch([srcFolder+'/**/*'], ['build', 'restart']);
    gulp.watch(['./assets/sass/**/*.scss'], ['sass']);
});

gulp.task('default', function (cb) {
    livereload.listen();  
    run('sass', 'build', 'watch', 'run', cb);
}); //'watch-yml', 'build', 'build', 