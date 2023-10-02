import {deleteAsync} from 'del';
import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import csso from 'gulp-csso';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import htmlmin from 'gulp-htmlmin';
const sass = gulpSass(dartSass);
const del = await deleteAsync;


gulp.task('css', () => {
   return gulp.src("./src/sass/*.scss")
        .pipe(sass())
        .pipe(postcss([ autoprefixer() ]))
        .pipe(gulp.dest("./src/styles"))
        .pipe(csso())
        .pipe(gulp.dest("./build/styles"))
})

gulp.task('html', () => {
    return gulp.src('./src/**/*.html')
        .pipe(htmlmin( { collapseWhitespace: true } ))
        .pipe(gulp.dest("build"))
})

gulp.task('del', () => {
    return del("build");
})

gulp.task('copy', async () => {
    await gulp.src("./src/fonts/**/*")
        .pipe(gulp.dest("build/fonts"));

    await gulp.src("./src/images/**/*")
        .pipe(gulp.dest("build/images"));
});

gulp.task('watch', () => {
    gulp.watch('./src/**/*.scss', gulp.series('css'));
    gulp.watch('./src/**/*.html', gulp.series('html'));
})

gulp.task("start", gulp.series("del", "css", "html", "copy", "watch"))
gulp.task("build", gulp.series("del", "css", "html", "copy"))