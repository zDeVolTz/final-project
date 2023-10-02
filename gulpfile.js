import {deleteAsync} from 'del';
import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import csso from 'gulp-csso';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import htmlmin from 'gulp-htmlmin';
import ghpages from 'gh-pages';
import gulpGit from 'gulp-git';
import prompt from 'gulp-prompt';
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

gulp.task("publish", () => {
    return gulp.src(".")
    .pipe(gulpGit.add())
    .pipe(prompt.prompt({
        type: 'input',
        name: 'commitMessage',
        message: 'Введите комментарий для коммита:'
    }, function(res) {
        return gulp.src('.')
            .pipe(gulpGit.commit(res.commitMessage));
    }));
})


gulp.task("gh", gulp.series("publish"))
gulp.task("start", gulp.series("del", "css", "html", "copy", "watch"))
gulp.task("build", gulp.series("del", "css", "html", "copy"))