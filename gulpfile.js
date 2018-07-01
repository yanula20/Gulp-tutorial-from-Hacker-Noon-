
//---------------------------------------------------------------------
// Basic Description of build system work flow:
// default task calls 'watch' task, 'watch' has a dependency 'serve'
// 'serve' has dependency 'inject' whose completion is a forced wait
// 'inject' has dependency 'copy' whose completion is a forced wait
// 'copy' deletes tmp files then copies src files to tmp and finishes
// then 'inject' fires/finishes
// 'serve' fires fires/finishes and allows 'watch' to wait for changes
// to 'inject'
//---------------------------------------------------------------------


//---------------------------------------------------------------------
// Plugins
//---------------------------------------------------------------------

var gulp = require('gulp');
var inject = require('gulp-inject');
var webserver = require('gulp-webserver');
var clean = require('gulp-clean');
var htmlclean = require('gulp-htmlclean');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del');

//---------------------------------------------------------------------
// Paths
//---------------------------------------------------------------------

var paths = {
  src: 'src/**/*',
  srcHTML: 'src/**/*.html',
  srcCSS: 'src/**/*.css',
  srcJS: 'src/**/*.js',

  tmp: 'tmp',
  tmpIndex: 'tmp/index.html',
  tmpCSS: 'tmp/**/*.css',
  tmpJS: 'tmp/**/*.js',

  dist: 'dist',
  distIndex: 'dist/index.html',
  distCSS: 'dist/**/*.css',
  distJS: 'dist/**/*.js'
};

//---------------------------------------------------------------------
// Copy files from src directory to dist directory
//---------------------------------------------------------------------

//-- TASK 1: the Default task whose command is npm run gulp--//
gulp.task('default', ['watch'], function() {
  console.log('Hello World!!');
});

//-- TASK 2: copy html src files to the tmp folder --//

gulp.task('deleteHTML', function() {
    return gulp.src(paths.tmpIndex, {read: false})
        .pipe(clean());
});

gulp.task('html', ['deleteHTML'], function() {
  return gulp.src(paths.srcHTML)
        .pipe(gulp.dest(paths.tmp));
});

//-- TASK 3: copy css src files to the tmp folder --//

gulp.task('deleteCSS', function() {
    return gulp.src(paths.tmpCSS, {read: false})
        .pipe(clean());
});


gulp.task('css', ['deleteCSS'], function() {
    return gulp.src(paths.srcCSS)
          .pipe(gulp.dest(paths.tmp));
});

//-- TASK 4: copy js src files to the tmp folder --//

gulp.task('deleteJS', function() {
    return gulp.src(paths.tmpJS, {read: false})
        .pipe(clean());
});


gulp.task('js', ['deleteJS'], function() {
    return gulp.src(paths.srcJS)
          .pipe(gulp.dest(paths.tmp));
});

//-- TASK 5: tasks 1, 2, and 3 are combined, src files are copied --//
//-- to tmp after they are deleted first --//
gulp.task('copy', ['html', 'css', 'js']);


//---------------------------------------------------------------------
// Index.html is injected with js and css links - inject after copy
//---------------------------------------------------------------------

//-- TASK 6: tmp folder's index.html is injected with js and css links --//
gulp.task('inject', ['copy'], function () {
  var css = gulp.src(paths.tmpCSS);
  var js = gulp.src(paths.tmpJS);
  return gulp.src(paths.tmpIndex)
    .pipe(inject( css, { relative:true } ))
    .pipe(inject( js, { relative:true } ))
    .pipe(gulp.dest(paths.tmp));
});

//---------------------------------------------------------------------
//Development Server - serve after inject
//---------------------------------------------------------------------

//-- TASK 7: Bare-metal must have etc/hosts w/ 192.168.33.17 identified --//
gulp.task('serve', ['inject'], function () {
  return gulp.src(paths.tmp)
    .pipe(webserver({
      // host: '0.0.0.0',
      host: '192.168.33.17',
      port: 3000,
      livereload: true
    }));
});


//---------------------------------------------------------------------
// Watching, intiate a livereload - default calls watch > after server
//---------------------------------------------------------------------

//-- TASK 8: wait for changes in the src directory --//
gulp.task('watch', ['serve'], function() {
  gulp.watch(paths.src, ['inject']);
});

//---------------------------------------------------------------------
// Build Dist folder for production
//---------------------------------------------------------------------

//-- TASK 9: Create build for dist folder production

//-- html clean gets rid of comments --//
gulp.task('html:dist', function () {
  return gulp.src(paths.srcHTML)
    .pipe(htmlclean())
    .pipe(gulp.dest(paths.dist));
});

//-- minifies (strips spaces, comments, deletes ";" of every selector --//
//-- and concatenates CSS files --//
gulp.task('css:dist', function () {
  return gulp.src(paths.srcCSS)
    .pipe(concat('style.min.css'))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('js:dist', function () {
  return gulp.src(paths.srcJS)
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('copy:dist', ['html:dist', 'css:dist', 'js:dist']);

gulp.task('inject:dist', ['copy:dist'], function () {
  var css = gulp.src(paths.distCSS);
  var js = gulp.src(paths.distJS);
  return gulp.src(paths.distIndex)
    .pipe(inject( css, { relative:true } ))
    .pipe(inject( js, { relative:true } ))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('build', ['inject:dist']);

//---------------------------------------------------------------------
// Push to gitHub for live server deployment
// Clean up - delete tmp and dist folders to start a new project
// while using the smae gulp task runners
//---------------------------------------------------------------------

//-- TASK 9: Delete tmp and dist directories
gulp.task('clean', function () {
  del([paths.tmp, paths.dist]);
});
