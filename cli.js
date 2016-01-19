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
    .command('package <dirName> <bookYaml>')
    .description('Package an EPUB3 file from a directory')
    .action((dirName, bookYamlFN) => {
        epubber.readYaml(bookYamlFN)
        .then(bookYaml => { return epubber.yamlCheck(bookYaml); })
        .then(bookYaml => { return epubber.bundleEPUB(dirName, bookYaml.epub); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('extract <epubFileName> <dirName>')
    .description('Extract an EPUB3 file to a directory')
    .action((epubFileName, dirName) => {
        epubber.unpack(epubFileName, dirName)
        .catch(err => { console.error(err.stack); });
    });
    
program
    .command('mimetype <dirName>')
    .description('Create an EPUB3 mimetype file in a directory')
    .action(dirName => {
        epubber.createMimetypeFile(dirName)
        .catch(err => { console.error(err.stack); });
    });

program
    .command('containerxml <dirName> <bookYaml>')
    .description('Create an EPUB3 container.xml file in a directory')
    .action((dirName, bookYamlFN) => {
        epubber.readYaml(bookYamlFN)
        .then(bookYaml => { return epubber.yamlCheck(bookYaml); })
        .then(bookYaml => { return epubber.createContainerXmlFile(dirName, bookYaml); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('makemeta <dirName> <bookYaml>')
    .description('Create OPF and NCX files in a directory')
    .action((dirName, bookYamlFN) => {
        epubber.readYaml(bookYamlFN)
        .then(bookYaml => { return epubber.yamlCheck(bookYaml); })
        .then(bookYaml => { return epubber.makeOPFNCX(dirName, bookYaml); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('check <dirName>')
    .description('Check an EPUB directory for valid HTML')
    .action(dirName => {
        epubber.checkEPUBfiles(dirName)
        .catch(err => { console.error(err.stack); });
    });

program.parse(process.argv);
