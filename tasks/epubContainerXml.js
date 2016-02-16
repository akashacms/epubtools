/**
 *
 *
 * Copyright 2015 David Herron
 *
 * This file is part of AkashaCMS-epub (http://akashacms.com/).
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

var fs   = require('fs');
var path = require('path');
var epubber = require('../epubber');

module.exports = function(grunt) {
    grunt.registerTask('epubContainerXml', function() {
        var done = this.async();
        var rendered = grunt.config.get('epubtools.renderTo');
        var bookYaml = grunt.config.get('epubtools.bookYaml');
        epubber.yamlCheck(bookYaml)
        .then(bookYaml => { return epubber.createContainerXmlFile(rendered, bookYaml); })
        .then(() => { done(); })
        .catch(err => { done(err); });
    });
};