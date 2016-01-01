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
            
'use strict';

process.title = 'epubtools';

program
   .version('0.0.1');

program
    .command('package <dirName> <epubFileName>')
    .description('Package an EPUB3 file from a directory')
    .action((dirName, epubFileName) => {
        epubber.bundleEPUB(dirName, epubFileName);
    });



program.parse(process.argv);
