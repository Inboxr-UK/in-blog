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
const imagemin = require('gulp-imagemin');
const minify = require('gulp-minify');
 
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


 
gulp.task('scripts', function() {
    gulp.src(['./assets/scripts/**/*'])
        .pipe(sourcemaps.init())
        .pipe(minify())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./site/themes/inboxr/scripts'))
});
 
gulp.task('images', function() {
    return gulp.src('./assets/images/*')
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest('./site/themes/inboxr/images'))
});

gulp.task('watch', function() {
    gulp.watch([srcFolder+'/**/*'], ['build', 'restart']);
    gulp.watch(['./assets/sass/**/*.scss'], ['sass']);
    gulp.watch(['./assets/images/**/*'], ['images']);
    gulp.watch(['./assets/scripts/**/*'], ['images']);
});

gulp.task('default', function (cb) {
    livereload.listen();  
    run('sass', 'images', 'scripts', 'build', 'watch', 'run', cb);
}); //'watch-yml', 'build', 'build', 