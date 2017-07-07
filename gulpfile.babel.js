import gulp       from 'gulp';
import clean      from 'del';
import bump       from 'gulp-bump';
import compass    from 'gulp-compass';
import concat     from 'gulp-concat';
import connect    from 'gulp-connect';
import gulpif     from 'gulp-if';
import image      from 'gulp-image';
import sourcemaps from 'gulp-sourcemaps';
import uglify     from 'gulp-uglify';

import babel      from 'babelify';
import register   from 'babel-register';
import browserify from 'browserify';

import sequence   from 'run-sequence';

import source     from 'vinyl-source-stream';
import buffer     from 'vinyl-buffer';

import watchify   from 'watchify';


const DEVELOPER   = 0;
const STAGING     = 1;
const PRODUCTION  = 2;
const PHASE       = Array.of('development','staging','production');

var   ENV         = DEVELOPER;

var   sourcePath  = './src/';
var   deployPath  = './builds/'+PHASE[ENV]+'/';

var   bundler;
var   browser;

var   bumper      = '';
var   version     = '';

function compile(watch) {
  browser = browserify(sourcePath+'app.js');
  bundler = watchify(browser, {debug: true}).transform(babel, {presets: ["es2015", "react"]});

  if(ENV === PRODUCTION)
    browser.on('log', function(msg) {console.log('Production build done:'+msg); exitBundler();});

  function rebundle() {
    bundler.bundle()
      .on('error', function (err) { console.error(err); this.emit('end');})
      .pipe( source('bundle.js') )
      .pipe( buffer() )
      .pipe( gulpif(ENV !== DEVELOPER, uglify()) )
      .pipe( gulpif(ENV === DEVELOPER,sourcemaps.init({ loadMaps: true }) ))
      .pipe( gulpif(ENV === DEVELOPER,sourcemaps.write("./") ))
      .pipe( gulp.dest(deployPath+'js/') )
      .pipe( gulpif(ENV === DEVELOPER,connect.reload()) );
  }

  if(watch) {
    bundler.on('update', () => { console.log('-> bundling...'); rebundle(); });
  }

  rebundle();
}

function exitBundler() {
  bundler.close()
}

function watch() {
  return compile(true);
}

gulp.task('build', () => {return compile(); });
gulp.task('watchify', () => {return watch(); });
gulp.task('watch', function() {
  gulp.watch([sourcePath+'img/**/*.gif',sourcePath+'img/**/*.jpg',sourcePath+'img/**/*.png',sourcePath+'img/**/*.svg'], ['image']);
  gulp.watch(sourcePath+'sass/**/*.scss', ['compass']);
  gulp.watch(sourcePath+'**/*.html', ['html']);
});

gulp.task('html', function() {
  return gulp.src(sourcePath+'**/*.html')
    .pipe(gulp.dest(deployPath))
    .pipe(gulpif(ENV === DEVELOPER,connect.reload()));
});

gulp.task('image', function () {
  gulp.src([sourcePath+'img/**/*.gif',sourcePath+'img/**/*.jpg',sourcePath+'img/**/*.png',sourcePath+'img/**/*.svg'])
    .pipe(image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      jpegRecompress: false,
      jpegoptim: true,
      mozjpeg: true,
      guetzli: false,
      gifsicle: true,
      svgo: true,
      concurrent: 10
    }))
    .pipe(gulp.dest(deployPath+'img/'))
    .pipe(gulpif(ENV === DEVELOPER,connect.reload()));
});

gulp.task('compass',['image'], function() {
  gulp.src(sourcePath+'sass/**/*.scss')
    .pipe(compass({
      sass: sourcePath+'sass/',
      image: deployPath+'img/',
      style: ENV === DEVELOPER ? 'expanded' : 'compressed'
    }))
    .on('error', function (err) { console.error(err);})
    .pipe(gulp.dest(deployPath + 'css/'))
    .pipe(gulpif(ENV === DEVELOPER,connect.reload()));
});

gulp.task('connect', function() {
  connect.server({
    debug: false,
    fallback: deployPath+'index.html',
    host: 'localhost',
    https: false,
    index: true,
    livereload: true,
    name: 'Dev Server',
    port:8080,
    root: deployPath
    //middleware: function(connect, opt) {return []};
  });
});

gulp.task('clean-deploy', function() {
  clean([deployPath+'**/*']);
});

gulp.task('deploy-staging', function() {
  gulp.src(sourcePath+'**/*')
    .pipe(gulp.dest(deployPath));
});

gulp.task('bump', function(){
  if(bumper!=='') {
    if(bumper==='version') {
      gulp.src(['./package.json'])
        .pipe(bump({version:version}))
        .pipe(gulp.dest('./'));
    } else if(bumper==='type') {
      gulp.src(['./package.json'])
        .pipe(bump({type:version}))
        .pipe(gulp.dest('./'));
    }
  }
});

gulp.task('default', function() {
  if(process.argv) {
    let idx = process.argv.indexOf('--env');
    if(idx>-1) {
      let arg = process.argv[idx+1].toLowerCase().trim().substr(0,1);
      if(arg==='s') {
        ENV = STAGING;
        sourcePath = './builds/'+PHASE[DEVELOPER]+'/';
      } else if(arg==='p')
        ENV = PRODUCTION;
      
      deployPath = './builds/'+PHASE[ENV]+'/';
    }
    idx = process.argv.indexOf('--bump');
    if(idx>-1) {
      let arg = process.argv[idx+1].toLowerCase().trim();
      if(arg==='patch') {
        bumper = 'type';
        version = 'patch';
      } else if(arg==='minor') {
        bumper = 'type';
        version = 'minor';
      } else if(arg==='major') {
        bumper = 'type';
        version = 'major';
      } else if(arg.substr(0,1)==='v') {
        let version = arg.replace(/[^0-9.]/g, '').split('.');
        if(version.length===3) {
          bumper = 'version';
          version = version.join('.');
        }
      }
    }
  }

  console.log('ENV = '+PHASE[ENV]);
  console.log('Source-path: '+sourcePath+'\r\nDeploy-path: '+deployPath);

  switch(ENV) {
    case DEVELOPER:
      gulp.start(['bump','watchify','image','compass','html','watch','connect']);
      break;
    case STAGING:
      sequence(
        'bump',
        'clean-deploy',
        'deploy-staging'
      );
      break;
    case PRODUCTION:
      sequence(
        'bump',
        'clean-deploy',
        ['watchify','image','compass','html']
      );
      break;
    default: 
      break;
  }
});
