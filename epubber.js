/**
 * epubber
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
 
var archiver  = require('archiver');
var async     = require('async');
var path      = require('path');
var util      = require('util');
var fs        = require('fs');
var xmldom    = require('xmldom');

var containerXmlText;
var containerXml;
var opfXmlText;
var opfXml;

exports.bundleEPUB = function(dirName, epubFileName, done) {
    
    // util.log(dirName +' '+ epubFileName);
    
    // read container.xml -- extract OPF file name
    // read OPF file
    // write mimetype file
    // write container.xml
    // write OPF file
    // for each entry in OPF - write that file
    // when done, finalize
    
    var opfFileName;
    
    readContainerXml(dirName)
    .then(containerXml => {
        var rootfiles = containerXml.getElementsByTagName("rootfile");
        // util.log(util.inspect(rootfile));
        var rootfile;
        for (var rfnum = 0; rfnum < rootfiles.length; rfnum++) {
            var elem = rootfiles.item(rfnum);
            if (elem.nodeName.toUpperCase() === 'rootfile'.toUpperCase()) rootfile = elem;
        }
        if (!rootfile) throw new Error('No rootfile element in container.xml');
        opfFileName = rootfile.getAttribute('full-path');
        // util.log(opfFileName);
        return readOPF(dirName, opfFileName);
    })
    .then(opfXml => {
        return archiveFiles(dirName, epubFileName, opfXml, opfFileName);
    })
    .then(() => {
        done();
    })
    .catch(err => {
        done(err);
    });
};


function readContainerXml(dirName, done) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path.join(dirName, "META-INF", "container.xml"), 'utf8',
            function(err, data) {
                if (err) return reject(err);
                
                containerXmlText = data;
                // containerXml = jsdom.jsdom(containerXmlText, {});
                containerXml = new xmldom.DOMParser().parseFromString(containerXmlText, 'text/xml');
                resolve(containerXml);
            });
    });
}

function readOPF(dirName, opfName) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path.join(dirName, opfName), 'utf8',
            function(err, data) {
                if (err) return reject(err);
                
                opfXmlText = data;
                // util.log(opfXmlText);
                
                opfXml = new xmldom.DOMParser().parseFromString(opfXmlText, 'text/xml');
                
                resolve(opfXml);
            });
    });
}

function archiveFiles(dirName, epubFileName, opfXml, opfFileName) {
    
    return new Promise(function(resolve, reject) {
        var archive = archiver('zip');
        
        var output = fs.createWriteStream(epubFileName);
                
        output.on('close', function() {
            // logger.info(archive.pointer() + ' total bytes');
            // logger.info('archiver has been finalized and the output file descriptor has closed.');
            resolve();
        });
        
        archive.on('error', function(err) {
            // logger.info('*********** BundleEPUB ERROR '+ err);
            reject(err);
        });
        
        archive.pipe(output);
        
        // The mimetype file must be the first entry, and must not be compressed
        archive.append(
            fs.createReadStream(path.join(dirName, "mimetype")),
            { name: "mimetype", store: true });
        archive.append(
            fs.createReadStream(path.join(dirName, "META-INF", "container.xml")),
            { name: path.join("META-INF", "container.xml") });
        archive.append(
            fs.createReadStream(path.join(dirName, opfFileName)),
            { name: opfFileName });
        
        var manifests = opfXml.getElementsByTagName("manifest");
        var manifest;
        for (var mnum = 0; mnum < manifests.length; mnum++) {
            var elem = manifests.item(mnum);
            if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()) manifest = elem;
        }
        if (manifest) {
            for (elem = manifest.firstChild; elem; elem = elem.nextSibling) {
                if (elem.nodeName.toUpperCase() === 'item'.toUpperCase()) {
                    var itemHref = elem.getAttribute('href');
                    archive.append(
                        fs.createReadStream(path.join(dirName, itemHref)),
                        { name: itemHref }
                    );
                }
            }
        }
        
        archive.finalize();

    });

}