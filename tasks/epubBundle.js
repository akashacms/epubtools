/**
 * epubBundle
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
 
var util = require('util');
var epubber = require('../epubber');

module.exports = function(grunt) {
    grunt.registerTask('epubBundle', function() {
        var dirName = grunt.config.get('epubtools.dirName');
        var epubFileName = grunt.config.get('epubtools.bookYaml.epub');
        var done = this.async();
        epubber.bundleEPUB(dirName, epubFileName)
        .then(() => { done(); })
        .catch(err => { done(err); });
    });
};
