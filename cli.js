#!/usr/bin/env node

/**
 * cli
 *
 * Copyright 2015 David Herron
 *
 * This file is part of epubtools (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var program   = require('commander');
var epubber   = require('./epubber');
var util      = require('util');
var fs        = require('fs');
            
'use strict';

process.title = 'epubtools';
program.version('0.0.1');

program
    .command('package <rendered> <bookYaml>')
    .description('Package an EPUB3 file from a directory')
    .action((rendered, bookYamlFN) => {
        epubber.readYaml(bookYamlFN)
        .then(bookYaml => { return epubber.yamlCheck(bookYaml); })
        .then(bookYaml => { return epubber.bundleEPUB(rendered, bookYaml.epub); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('extract <epubFileName> <dirName>')
    .description('Extract an EPUB3 file to a directory')
    .action((epubFileName, dirName) => {
        epubber.unpack(epubFileName, dirName)
        .catch(err => { console.error(err.stack); });
    });

/* program
    .command('copy <srcdir> <destdir> [exts..]')
    .description('Copy stuff from one directory to another')
    .action((srcdir, destdir) => {
        // TODO Need to get extensions from command line
        epubber.copyStuff(srcdir, destdir)
        .catch(err => { console.error(err.stack); });
    }); */
    
/* DOESN't BELONG program
    .command('rendermarkdown <docsdir> <renderTo>')
    .description('Render Markdown files in one directory to another')
    .action((docsdir, renderTo) => {
        epubber.renderMarkdown(docsdir, renderTo)
        .catch(err => { console.error(err.stack); });
    }); */

program
    .command('stats <rendered>')
    .description('Print text statistics for rendered HTML file in a directory')
    .action(rendered => {
        epubber.printTextStats(rendered)
        .catch(err => { console.error(err.stack); });
    });

program
    .command('words <rendered>')
    .description('Print word count statistics for rendered HTML file in a directory')
    .action(rendered => {
        epubber.printWordCountStats(rendered)
        .catch(err => { console.error(err.stack); });
    });

program
    .command('mimetype <rendered>')
    .description('Create an EPUB3 mimetype file in a directory')
    .action(rendered => {
        epubber.createMimetypeFile(rendered)
        .catch(err => { console.error(err.stack); });
    });

program
    .command('containerxml <rendered> <bookYaml>')
    .description('Create an EPUB3 container.xml file in a directory')
    .action((rendered, bookYamlFN) => {
        epubber.readYaml(bookYamlFN)
        .then(bookYaml => { return epubber.yamlCheck(bookYaml); })
        .then(bookYaml => { return epubber.createContainerXmlFile(rendered, bookYaml); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('makemeta <rendered> <bookYaml>')
    .description('Create OPF and NCX files in a directory')
    .action((rendered, bookYamlFN) => {
        epubber.readYaml(bookYamlFN)
        .then(bookYaml => { return epubber.yamlCheck(bookYaml); })
        .then(bookYaml => { return epubber.makeOPFNCX(rendered, bookYaml); })
        .catch(err => { console.error(err.stack); });
    });

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

program.parse(process.argv);
