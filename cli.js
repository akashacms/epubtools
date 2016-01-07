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
var yaml      = require('js-yaml');
var fs        = require('fs');
            
'use strict';

process.title = 'epubtools';

program
   .version('0.0.1');

program
    .command('package <dirName> <epubFileName>')
    .description('Package an EPUB3 file from a directory')
    .action((dirName, epubFileName) => {
        epubber.bundleEPUB(dirName, epubFileName, err => {
            if (err) {
                // console.error(err);
                console.error(err.stack);
            }
        });
    });

program
    .command('mimetype <dirName>')
    .description('Create an EPUB3 mimetype file in a directory')
    .action(dirName => {
        epubber.createMimetypeFile(dirName, err => {
            if (err) {
                // console.error(err);
                console.error(err.stack);
            }
        });
    });

program
    .command('containerxml <dirName> <bookYaml>')
    .description('Create an EPUB3 container.xml file in a directory')
    .action((dirName, bookYamlFN) => {
        readYaml(bookYamlFN)
        .then(bookYaml => {
            return new Promise((resolve, reject) => {
                epubber.yamlCheck(bookYaml, err => {
                    if (err) reject(err);
                    else epubber.createContainerXmlFile(dirName, bookYaml, err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        })
        .catch(err => {
            // console.error(err);
            console.error(err.stack);
        });
    });

program
    .command('makemeta <dirName> <bookYaml>')
    .description('Create OPF and NCX files in a directory')
    .action((dirName, bookYamlFN) => {
        readYaml(bookYamlFN)
        .then(bookYaml => {
            return new Promise((resolve, reject) => {
                epubber.yamlCheck(bookYaml, err => {
                    if (err) reject(err);
                    else epubber.makeOPFNCX(dirName, bookYaml, err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        })
        .catch(err => {
            // console.error(err);
            console.error(err.stack);
        });
    });



function readYaml(bookYaml) {
    return new Promise((resolve, reject) => {
        fs.readFile(bookYaml, 'utf8', (err, yamlText) => {
            if (err) reject(err);
            else resolve(yaml.safeLoad(yamlText));
        });
    });
}


program.parse(process.argv);
