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
import GulpCleanCss from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import lighthouse from 'lighthouse';
import* as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { URL } from 'url';
import puppeteer from 'puppeteer';
const sass = gulpSass(dartSass);
const del = await deleteAsync;



gulp.task('css', () => {
   return gulp.src("./src/sass/*.scss")
        .pipe(sass())
        .pipe(postcss([ autoprefixer() ]))
        .pipe(gulp.dest("./src/styles"))
        .pipe(sourcemaps.init())
        .pipe(GulpCleanCss())
        .pipe(csso())
        .pipe(sourcemaps.write("./"))
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

gulp.task("add", () => {
    return gulp.src(".")
    .pipe(gulpGit.add())
})

gulp.task("commit", () => {
    return gulp.src(".")
    .pipe(prompt.prompt({
        type: 'input',
        name: 'commitMessage',
        message: 'Введите комментарий для коммита:'
    }, function(res) {
        return gulp.src('.')
            .pipe(gulpGit.commit(res.commitMessage));
    }));
})

gulp.task("push", (done) => {
    gulpGit.push(null, null, function(err) {
        if (err) {
            done(err);
        } else {
            done();
        }
    });
});

gulp.task("gh-pages", () => {
    return new Promise((resolve, reject) => {
        ghpages.publish('src', function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
})


  
let result = [];

gulp.task('lighthouseR', async () => {
    var array = fs.readFileSync("URLs.csv").toString().split("\n");
    const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] })
    
      const mobileOptions = { 
        logLevel: "info",
        output: "csv",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        audits: [
            "first-meaningful-paint",
            "first-cpu-idle",
            "byte-efficiency/uses-optimized-images",
        ],
        port: chrome.port,
        emulatedFormFactor: 'mobile', 
    };
    
    const desktopOptions = { 
        logLevel: "info",
        output: "csv",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        audits: [
            "first-meaningful-paint",
            "first-cpu-idle",
            "byte-efficiency/uses-optimized-images",
        ],
        port: chrome.port,
        emulatedFormFactor: 'desktop',
    };
    
    for (let i = 0; i < array.length; i++) {
    
      for (let x = 0; x < 2; x++) {
        if (x == 0) {
            const runnerResult = await lighthouse(array[i], mobileOptions); 
            result.push("URL : " + runnerResult.lhr.finalUrl);
            if (runnerResult.lhr.categories.performance.score) {
                result.push("Mobile Performance : " + runnerResult.lhr.categories.performance.score * 100)
            } else {
                result.push("NA")
            }
        
            if (runnerResult.lhr.categories.accessibility.score) {
                result.push("Mobile Accessibility : " + runnerResult.lhr.categories.accessibility.score * 100)
            } else {
                result.push("NA");
            }
        
            if (runnerResult.lhr.categories["best-practices"].score) {
                result.push("Mobile Best Practices : " + runnerResult.lhr.categories["best-practices"].score * 100)
            } else {
                result.push("NA");
            }
            if (runnerResult.lhr.categories.seo.score) {
                result.push("Mobile SEO : " + runnerResult.lhr.categories.seo.score * 100)
            } else {
                result.push("NA");
            }
        }
        
        else {
            const runnerResultDesktop = await lighthouse(array[i], desktopOptions); 
            if (runnerResultDesktop.lhr.categories.performance.score) {
                result.push("Desktop Performance : " +runnerResultDesktop.lhr.categories.performance.score * 100)
            } else {
                result.push("NA")
            }
        
            if (runnerResultDesktop.lhr.categories.accessibility.score) {
                result.push("Desktop Accessibility : " + runnerResultDesktop.lhr.categories.accessibility.score * 100)
            } else {
                result.push("NA");
            }
        
            if (runnerResultDesktop.lhr.categories["best-practices"].score) {
                result.push("Desktop Best Practices : " + runnerResultDesktop.lhr.categories["best-practices"].score * 100)
            } else {
                result.push("NA");
            }
        
            if (runnerResultDesktop.lhr.categories.seo.score) {
                result.push("Desktop SEO : " + runnerResultDesktop.lhr.categories.seo.score * 100)
            } else {
                result.push("NA");
            }
            }
       
      }
    }

    function convertArrayToCSV(array) {
        let csv = '';
        for (let i = 0; i < array.length; i++) {
            csv += array[i] + '\n';
        }
        return csv;
    }
    
    const csvData = convertArrayToCSV(result);
    
    const bufferData = Buffer.from(csvData, 'utf-8');
    
    fs.writeFileSync('lhreport.csv', bufferData);
    await chrome.kill();
  });
  
  

  
  gulp.task('URLs', async (done) => {
    const baseUrl = 'http://127.0.0.1:5500';
    const startPath = '/src/pages';

    const visitedUrls = new Set();
    const linksToVisit = [startPath];
    const filePath = 'URLs.csv';
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    async function scrapeSite() {
    while (linksToVisit.length > 0) {
        const currentPath = linksToVisit.pop();
        const currentUrl = new URL(currentPath, baseUrl).href;
        if (!visitedUrls.has(currentUrl)) {
        visitedUrls.add(currentUrl);
        try {
            const response = await fetch(currentUrl);

            if (response.status === 200) {
            const html = await response.text();
            const $ = cheerio.load(html);

            $('a').each((index, element) => {
                const link = $(element).attr('href');
                if (link && !link.startsWith('#') && !link.startsWith('http')) {
                const absoluteLink = new URL(link, currentUrl).href;
                if (
                    !visitedUrls.has(absoluteLink) &&
                    !linksToVisit.includes(absoluteLink) &&
                    (absoluteLink.startsWith(baseUrl + '/src/') || absoluteLink.startsWith(baseUrl + '/src/pages/'))
                ) {
                    linksToVisit.push(absoluteLink);
                    const newData = absoluteLink; 
                    if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, newData, 'utf-8');
                    } else {
                    fs.appendFileSync(filePath, '\n' + newData, 'utf-8');
                    }
                }
                }
            });
            }
        } catch (error) {
            console.error(`Ошибка при запросе ${currentUrl}: ${error.message}`);
        }
        }
    }
        let fileContents = '';
        if (fs.existsSync(filePath)) {
        fileContents = fs.readFileSync(filePath, 'utf-8');
        }
        const modifiedData = fileContents.replace(/src/g, 'build');
        fs.appendFileSync(filePath, '\n' + modifiedData, 'utf-8');
    }

    await scrapeSite();
    done();
});



gulp.task('report', gulp.series('URLs','lighthouseR'));

gulp.task("gh", gulp.series("add","commit","push","gh-pages"))
gulp.task("start", gulp.series("del", "css", "html", "copy", "watch"))
gulp.task("build", gulp.series("del", "css", "html", "copy"))