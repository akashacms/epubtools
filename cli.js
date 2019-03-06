#!/usr/bin/env node

const program   = require('commander');
const epubtools = require('./index');
const configurator = require('./Configuration');
const bundleEPUB = require('./bundleEPUB');
const renderEPUB = require('./renderEPUB');
const util = require('util');
const fs = require('fs-extra');
const manifest = require('./manifest');

process.title = 'epubuilder';
program.version('0.4.0');

program
    .command('package <configFN>')
    .description('Package an EPUB3 file from a directory')
    .action(async (configFN) => {

        try {
            const bookConfig = await configurator.readConfig(configFN);
            await bundleEPUB.bundleEPUB(bookConfig);
        } catch (e) {
            console.error(`package command ERRORED ${e.stack}`);
        }

/*
        PLAN:

        Find the example EPUB3 files from the EPUB3 team 
        Use those to validate the package command 
        Duplicate over code from epubtools

        Q: Is "rendered" required?  It is the directory containing the rendered files.  Shouldn't this be in the configuration?
*/
    });

program
    .command('render <configFN>')
    .description('Render document files in the input directory to render directory')
    .action(async (configFN) => {
        try {
            const bookConfig = await configurator.readConfig(configFN);
            renderEPUB.setconfig(bookConfig);
            await fs.mkdirs(bookConfig.bookRenderDestFullPath);
            await renderEPUB.copyAssets(bookConfig);
            await renderEPUB.renderProject();
        } catch (e) {
            console.error(`package command ERRORED ${e.stack}`);
        }
    });

// TODO COMMAND: merge config1 config2 config3 mergedDir
//    The idea is each config represents one volume
//    The merged result would have container.xml with multiple rootfile entries
//    Each rootfile is the OPF corresponding to the config
//    ??? 

// program
//     .command('mimetype <bookYaml>')
//     .description('Create the mimetype file')
//     .action(async (bookYamlFN) => {
//         try {
//             const bookConfig = await configurator.readConfig(bookYamlFN);
//             await bookConfig.mimetype();
//         } catch (e) {
//             console.error(`package mimetype ERRORED ${e.stack}`);
//         }
//     });

program
    .command('unpack <epubFN> <unpackTo>')
    .description('Unpack an EPUB file into destination directory')
    .action(async (epubFN, unpackTo) => {
        try {
            throw new Error(`unpack does not recognize EPUB FILE NAME, and instead uses a directory "unpackTo"`);
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
            console.error(`package mimetype ERRORED ${e.stack}`);
        }
    });

program
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
    .command('scanfiles <configFN>')
    .description('Scan files in bookroot directory specified in config')
    .action(async (configFN) => {
        try {
            const config = await configurator.readConfig(configFN);
            await manifest.scan(config);
            await config.save();
        } catch (e) {
            console.error(`scanfiles ERRORED ${e.stack}`);
        }
    });

program
    .command('toc <configFN>')
    .description('Read the Table Of Contents for the book described in the config')
    .action(async (configFN) => {
        try {
            const config = await configurator.readConfig(configFN);
            console.log(util.inspect(await manifest.tocData(config)));
        } catch (e) {
            console.error(`toc ERRORED ${e.stack}`);
        }
    });




program.parse(process.argv);
