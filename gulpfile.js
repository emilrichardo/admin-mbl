// Require the modules.
require('dotenv').config();
var gulp = require("gulp");
var minimist = require("minimist");
var config = require("./config.json");

var options = minimist(process.argv.slice(2));

// Global Variables
global.config = config;

console.log('\x1b[32m', 'Starting Gulp!!');

const autoPrefixTasks = require("./gulp-tasks/autoprefix")(gulp);
const cleanTasks = require("./gulp-tasks/clean")(gulp);
const copyTasks = require("./gulp-tasks/copy")(gulp);
const cssTasks = require("./gulp-tasks/css")(gulp);
const scssTasks = require("./gulp-tasks/scss")(gulp);
const uglifyTasks = require("./gulp-tasks/uglify")(gulp);

gulp.task("dist-clean", gulp.parallel(cleanTasks.css, cleanTasks.js));

gulp.task("monitor", gulp.parallel(scssTasks.watch));

gulp.task("dist-js", gulp.series(cleanTasks.js, copyTasks.js, uglifyTasks.js));

gulp.task(
  "sass-compile",
  gulp.parallel(scssTasks.main, scssTasks.core, scssTasks.pages, scssTasks.plugins, scssTasks.themes, scssTasks.style)
);

gulp.task("sass-compile-rtl", scssTasks.rtl);

gulp.task("dist-css", gulp.series(cleanTasks.css, "sass-compile", autoPrefixTasks.css, cssTasks.css_comb, cssTasks.css_min));

gulp.task(
  "dist-css-rtl",
  gulp.series(
    cleanTasks.css_rtl,
    "sass-compile",
    "sass-compile-rtl",
    cssTasks.css_rtl,
    autoPrefixTasks.css_rtl,
    cssTasks.css_rtl_comb,
    cssTasks.css_rtl_min
  )
);

gulp.task("dist", gulp.parallel("dist-css", "dist-js"));

gulp.task("default", gulp.parallel("dist-css", "dist-js"));


// Task to deploy assets to S3
/* usage: No parameter will publish all assets in the app-assets folder,
Example: gulp deploy
or you can pass the --path parameter to specify any folder in app-assets
Examples: 
gulp deploy --path css
gulp deploy --path fonts
*/
const { upload, clean } = require('gulp-s3-publish');
var aws = require('aws-sdk'); 

aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_BUCKET_REGION,
});

const client = new aws.S3();
const uploadOpts = {
  bucket: process.env.S3_BUCKET,
  uploadPath: 'mlmv1/production',
  putObjectParams: {
    ACL: 'public-read'
  }
};
const cleanOpts = {
  bucket: process.env.S3_BUCKET,
  uploadPath: 'mlmv1/production'
};
 
let paths = ['css','css-rtl','data','fonts','images','js','vendors'];
let src_path = '';

src_path = options.path != undefined && paths.includes(options.path) ? options.path + '/' : '';
src_path += '**/*';

gulp.task('deploy', () => {
  return gulp.src('./app-assets/'+src_path)
    .pipe(upload(client, uploadOpts))
});

