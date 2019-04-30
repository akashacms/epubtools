#!/usr/bin/env node

const program   = require('commander');
const epubtools = require('./index');
const configurator = require('./Configuration');
const bundleEPUB = require('./bundleEPUB');
const renderEPUB = require('./renderEPUB');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const manifest = require('./manifest');
const unzip = require('unzipper');
const textStatistics = require('text-statistics');
const globfs = require('globfs');

process.title = 'epubuilder';
program.version('0.4.0');

program
    .command('package <configFN>')
    .description('Package an EPUB3 file from a directory')
    .action(async (configFN) => {

        try {
            const bookConfig = await configurator.readConfig(configFN);
            await bookConfig.readTOCData();
            await bundleEPUB.bundleEPUB(bookConfig);
        } catch (e) {
            console.error(`package command ERRORED ${e.stack}`);
        }

    });

program
    .command('render <configFN>')
    .description('Render document files in the input directory to render directory')
    .action(async (configFN) => {
        try {
            const bookConfig = await configurator.readConfig(configFN);
            // MOOT, done in readConfig renderEPUB.setconfig(bookConfig);
            await fs.mkdirs(bookConfig.bookRenderDestFullPath);
            await renderEPUB.copyAssets(bookConfig);
            await renderEPUB.renderProject();
        } catch (e) {
            console.error(`package command ERRORED ${e.stack}`);
        }
    });

program
    .command('unpack <epubFN> <unpackTo>')
    .description('Unpack an EPUB file into destination directory')
    .action(async (epubFN, unpackTo) => {
        try {
            await fs.mkdirs(unpackTo); 
            await new Promise((resolve, reject) => {
                let didresolve = false;
                const doresolve = () => { 
                    if (!didresolve) {
                        didresolve = true;
                        resolve();
                    }
                };
                var unzipExtractor = unzip.Extract({ path: unpackTo });
                unzipExtractor.on('error', err => { reject(err); });
                unzipExtractor.on('close', doresolve);
                unzipExtractor.on('end', doresolve);
                fs.createReadStream(epubFN).pipe(unzipExtractor);
            });
        } catch (e) {
            console.error(`unpack ERRORED ${e.stack}`);
        }
    });

// This needs to have an interactive terminal wizard?
// The idea will be -- 
//     * EPUB as input
//     * User chooses directory for source files
//     * User chooses directory for output
//     * Extract to source directory
//     * Consult existing OPF to get metadata into .epubtools file
program // TODO
    .command('import <epubDir> <projectFN>')
    .description('Generate an ".epubtools" configuration file from an EPUB')
    .action(async (epubDir, projectFN) => {
        try {
            // 1. Detect if it is a directory, error if not
            // 2. Find and read the OPF, generating a Config file
            // 3. Scan the directory to fill in the manifest
            await epubtools.createProjectFromEPUBDir(epubDir, projectFN);
        } catch (e) {
            console.error(`import ${epubDir} ERRORED ${e.stack}`);
        }
    });

program
    .command('toc <configFN>')
    .description('Read the Table Of Contents for the book described in the config')
    .action(async (configFN) => {
        try {
            const config = await configurator.readConfig(configFN);
            printToc(await manifest.tocData(config), 0);
            // console.log(util.inspect(await manifest.tocData(config)));
        } catch (e) {
            console.error(`toc ERRORED ${e.stack}`);
        }
    });

function printToc(toc, indent) {
    for (let item of toc) {
        console.log(`${mkindent(indent)}${item.id} ${item.href} ${item.text}`);
        if (item.children.length > 0) {
            printToc(item.children, indent + 4);
        }
    }
}

function mkindent(indent) {
    let ret = '';
    for (let i = 0; i < indent; i++) {
        ret += ' ';
    }
    return ret;
}

program
    .command('stats <configFN>')
    .description('Print text statistics for the EPUB')
    .action(async (configFN) => {
        try {
            const config = await configurator.readConfig(configFN);
            new Promise((resolve, reject) => {
                globfs.operate(config.bookRenderDestFullPath,
                         [ "**/*.xhtml" ], (basedir, fpath, fini) => {
                    fs.readFile(path.join(basedir, fpath), 'utf8', (err, text) => {
                        if (err) return fini(err);
                        
                        var stats = textStatistics(text);
                        
                        console.log('******** '+ fpath);
                        console.log();
                        console.log('fleschKincaidReadingEase          '+ stats.fleschKincaidReadingEase());
                        console.log('fleschKincaidGradeLevel           '+ stats.fleschKincaidGradeLevel());
                        console.log('gunningFogScore                   '+ stats.gunningFogScore());
                        console.log('colemanLiauIndex                  '+ stats.colemanLiauIndex());
                        console.log('smogIndex                         '+ stats.smogIndex());
                        console.log('automatedReadabilityIndex         '+ stats.automatedReadabilityIndex());
                        console.log('textLength                        '+ stats.textLength());
                        console.log('letterCount                       '+ stats.letterCount());
                        console.log('wordCount                         '+ stats.wordCount());
                        console.log('sentenceCount                     '+ stats.sentenceCount());
                        console.log('averageWordsPerSentence           '+ stats.averageWordsPerSentence());
                        console.log('averageSyllablesPerWord           '+ stats.averageSyllablesPerWord());
                        console.log('wordsWithThreeSyllables           '+ stats.wordsWithThreeSyllables());
                        console.log('percentageWordsWithThreeSyllables '+ stats.percentageWordsWithThreeSyllables());
                        // console.log('syllableCount                     '+ stats.syllableCount());
                        console.log();
                        
                        fini();
                    });
                },
                err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (e) {
            console.error(`stats ERRORED ${e.stack}`);
        }
    });

program
    .command('words <configFN>')
    .description('Print word count statistics for rendered HTML file in a directory')
    .action(async (configFN) => {
        try {
            const config = await configurator.readConfig(configFN);
            new Promise((resolve, reject) => {
                globfs.operate(config.bookRenderDestFullPath,
                         [ "**/*.xhtml" ], (basedir, fpath, fini) => {
                    fs.readFile(path.join(basedir, fpath), 'utf8', (err, text) => {
                        if (err) return fini(err);
                        
                        var stats = textStatistics(text);
                        
                        console.log(fpath +' '+ stats.textLength() +' '+ stats.letterCount() +' '+ stats.wordCount() +' '+ stats.sentenceCount()
                        +' '+ stats.averageWordsPerSentence() +' '+ stats.averageSyllablesPerWord()
                        +' '+ stats.wordsWithThreeSyllables() +' '+ stats.percentageWordsWithThreeSyllables());
                        
                        fini();
                    });
                },
                err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (e) {
            console.error(`stats ERRORED ${e.stack}`);
        }
    });

/*

TODO

sourcefiles -- list out the files in source directory/ies

program
    .command('check <rendered>')
    .description('Check an EPUB directory for valid HTML')
    .action(rendered => {
        epubber.checkEPUBfiles(rendered)
        .catch(err => { console.error(err.stack); });
    });

program
    .command('tohtml <convertYaml>')
    .description('Convert EPUB to HTML')
    .action(convertYaml => {
        epubber.convert2html(convertYaml)
        .catch(err => { console.error(err.stack); });
    });

Also - topdf

*/


program.parse(process.argv);
