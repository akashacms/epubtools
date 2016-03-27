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

'use strict';

var archiver  = require('archiver');
var unzip     = require('node-unzip-2');
var async     = require('async');
var path      = require('path');
var util      = require('util');
// var fs        = require('fs');
var fs        = require('fs-extra');
var url       = require('url');
var xmldom    = require('xmldom');
var jsdom     = require('jsdom');
var globfs    = require('globfs');
var mime      = require('mime');
var uuid      = require('uuid');
var sprintf   = require("sprintf-js").sprintf,
    vsprintf  = require("sprintf-js").vsprintf;
var yaml      = require('js-yaml');
var textStatistics = require('text-statistics');

const log   = require('debug')('epubtools:epubber');
const error = require('debug')('epubtools:error');

// DOESN'T BELONG
// var ejs       = require('ejs');
// var yfm       = require('yfm');
// var md        = require('markdown-it')({
//  html:         true,         // Enable html tags in source
//  xhtmlOut:     false,        // Use '/' to close single tags (<br />)
//  breaks:       false,        // Convert '\n' in paragraphs into <br>
//  // langPrefix:   'language-',  // CSS language prefix for fenced blocks
//  linkify:      true,         // Autoconvert url-like texts to links
//  typographer:  true,         // Enable smartypants and other sweet transforms
//
//  // Highlighter function. Should return escaped html,
//  // or '' if input not changed
//  highlight: function (/*str, , lang*/) { return ''; }
// });

exports.readYaml = function(bookYaml) {
    log('readYaml '+ bookYaml);
    return new Promise((resolve, reject) => {
        fs.readFile(bookYaml, 'utf8', (err, yamlText) => {
            if (err) { error(err); reject(err); }
            else resolve(yaml.safeLoad(yamlText));
        });
    });
};

exports.yamlCheck = function(bookYaml) {
    
    return new Promise((resolve, reject) => {
        try {
            if (!bookYaml.opf) return reject(new Error('no OPF file specified'));
        
            if (!bookYaml.identifiers) {
                return reject(new Error('no UUID .. suggest \
                  identifiers: [ { unique: true, idstring: "urn:uuid"'+ uuid.v1() +' } ] \
                '));
            } else {
                var uniqueCount = 0;
                bookYaml.identifiers.forEach(identifier => {
                    if (typeof identifier.unique !== 'undefined' && identifier.unique !== null) uniqueCount++;
                });
                if (uniqueCount !== 1) return reject(new Error("There can be only one - unique identifier, that is, found="+ uniqueCount));
            }
            
            var rightnow = w3cdate(new Date());
            if (!bookYaml.published) bookYaml.published = {};
            if (!bookYaml.published || !bookYaml.published.date) {
                return reject(new Error('no published.date suggest '+ rightnow));
            }
            bookYaml.published.modified = rightnow;
            
            if (!bookYaml.toc || !bookYaml.toc.href) {
                return reject(new Error('No toc entry'));
            }
            
            // util.log(util.inspect(bookYaml));
            
            resolve(bookYaml);
        } catch (err) { reject(err); }
    });
};

exports.printTextStats = function(rendered) {
    return new Promise((resolve, reject) => {
        globfs.operate(rendered, [ "**/*.html" ], (basedir, fpath, fini) => {
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
};

exports.printWordCountStats = function(rendered) {
    return new Promise((resolve, reject) => {
        globfs.operate(rendered, [ "**/*.html" ], (basedir, fpath, fini) => {
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
};

// TODO Finish this
exports.convert2html = function(fnyaml) {
    log('convert2html');
    
    // Start an empty HTML file
    // Pick up .opf file
    // Consult manifest object, and each item element
    //     Read the referenced file
    //     Extract the stuff from its body tag
    //     Append that body tag into the HTML file
    //     Append HTML for page break
    // Once last file is processed, write HTML file to disk
    

    return exports.readYaml(fnyaml)
    .then(convertYaml => {
        log(util.inspect(convertYaml));
        return new Promise((resolve, reject) => {
            fs.mkdirs(convertYaml.output.dir, err => {
                if (err) reject(err);
                else resolve(convertYaml);
            });
        });
    })
    .then(convertYaml => {
        return readContainerXml(convertYaml.rendered)  
        .then(containerXmlData => {
            convertYaml.containerXmlText = containerXmlData.containerXmlText;
            convertYaml.containerXml     = containerXmlData.containerXml;
            convertYaml.opfFileName      = findOpfFileName(containerXmlData.containerXml);
            return convertYaml;
        })
        .catch(err => { error(err); throw err; });
    })
    .then(convertYaml  => {
        return readOPF(convertYaml.rendered, convertYaml.opfFileName)
        .then(opfXmlData => {
            convertYaml.opfXmlData = opfXmlData;
            convertYaml.opfXmlText = opfXmlData.opfXmlText;
            convertYaml.opfXml     = opfXmlData.opfXml;
            return convertYaml;
        })
        .catch(err => { error(err); throw err; });
    })
    .then(convertYaml => {
        // Create empty HTML file
        return new Promise((resolve, reject) => {
            jsdom.env(`<!DOCTYPE html>
            <html>
            <head>
            <style>
            @media print {
                div.page-break {page-break-after: always;}
            }
            </style>
            </head>
            <body></body>
            </html>
            `, ['http://code.jquery.com/jquery.js'],
            (err, window) => {
                if (err) { error(err); return reject(err); }
                convertYaml.outputJSwindow = window;
                resolve(convertYaml);
            });
        });
    })
    .then(convertYaml => {
        if (convertYaml.title)
            convertYaml.outputJSwindow.$(`<title>${convertYaml.title}</title>`).prependTo("head");
        if (convertYaml.stylesheet) {
            convertYaml.outputJSwindow.$(`<link rel="stylesheet" href="${convertYaml.stylesheet}" type="text/css" />`).appendTo("head");
            return new Promise((resolve, reject) => {
                fs.copy(path.join(convertYaml.rendered, convertYaml.stylesheet),
                        path.join(convertYaml.output.dir, convertYaml.stylesheet),
                err => {
                    if (err) reject(err);
                    else resolve(convertYaml);
                });
            });
        }
        else return convertYaml;
    })
    .then(convertYaml => {
        // Step through manifest items, appending to the HTML
        // log(data.outputJSwindow.$().html());
        return concatHTML(convertYaml.rendered,
                          convertYaml.opfXml,
                          convertYaml.opfFileName,
                          convertYaml.outputJSwindow,
                          convertYaml.output.dir)
        .then(foo  => { return convertYaml; })
        .catch(err => { error(err); throw err; });
    })
    .then(convertYaml => {
        // Generate the HTML
        // log(util.inspect(convertYaml));
        convertYaml.outputJSwindow.$("script").remove();
        convertYaml.outputHtml = require("jsdom").serializeDocument(convertYaml.outputJSwindow.document);
        // data.outputHtml = data.outputJSwindow.$().html();
        return convertYaml;
    })
    .then(convertYaml => {
        // Write the HTML file
        return new Promise((resolve, reject) => {
            // log(convertYaml.outputHtml);
            fs.writeFile(path.join(convertYaml.output.dir, convertYaml.output.fname),
                         convertYaml.outputHtml, 'utf8',
            err => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};

exports.createMimetypeFile = function(rendered) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(rendered, "mimetype"), "application/epub+zip", "utf8", err => {
            if (err) reject(err);
            else resolve();
        });
    });
};

exports.makeMetaInfDir = function(rendered) {
    return new Promise((resolve, reject) => {
        fs.mkdirs(path.join(rendered, "META-INF"), err => {
            if (err) reject(err);
            else resolve();
        });
    });
};

exports.createContainerXmlFile = function(rendered, bookYaml) {
    
    // util.log('createContainerXmlFile '+ rendered +' '+ util.inspect(bookYaml));
    
    var containerXml = new xmldom.DOMParser().parseFromString('<?xml version="1.0" encoding="utf-8" standalone="no"?> \
        <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"> \
    	<rootfiles> </rootfiles> \
        </container>', 'text/xml');
    	
    	
    //	<%
    //    rootfiles.forEach(function(rf) {
    //    %>
    //    <rootfile full-path="<%= rf.path %>" media-type="<%= rf.type %>"/><%
    //    });
    //    %>
    	
    var rootfiles = containerXml.getElementsByTagName("rootfiles");
    var rfs;
    var elem;
    // util.log(util.inspect(rootfile));
    for (var rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfiles'.toUpperCase()) rfs = elem;
    }
    
    elem = containerXml.createElement('rootfile');
    elem.setAttribute('full-path', bookYaml.opf);
    elem.setAttribute('media-type', 'application/oebps-package+xml');
    rfs.appendChild(elem);
    
    return exports.makeMetaInfDir(rendered)
    .then(() => {
        return new Promise((resolve, reject) => {
            fs.writeFile(path.join(rendered, "META-INF", "container.xml"),
                         new xmldom.XMLSerializer().serializeToString(containerXml), "utf8",
                         err => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};

exports.unpack = function(epubFileName, unpackTo) {
    // unzip the EPUB into the directory
    // util.log('unpack '+ epubFileName +' '+ unpackTo);
    
    return new Promise((resolve, reject) => {
        fs.mkdirs(unpackTo, err => {
            if (err) return reject(err);
            
            var unzipExtractor = unzip.Extract({ path: unpackTo });
            unzipExtractor.on('error', err => { reject(err); });
            unzipExtractor.on('close', () => { resolve(); });
        
            fs.createReadStream(epubFileName).pipe(unzipExtractor);
        });
    });
};

exports.makeOPFNCX = function(rendered, bookYaml) {
    return new Promise((resolve, reject) => {
           
        // read the designated TOC file (toc.html)
            
        var manifest = [];
        var opfspine = [];
        var chapters;
        var tocHtml;
        var OPFXML;
        var NCXXML;
        
        readTOC(rendered, bookYaml.toc.href)
        .then(_tocHtml => {
            tocHtml = _tocHtml;
            return scanTocHtml(tocHtml, bookYaml.toc.id, bookYaml.toc.href, bookYaml.ncx, manifest, opfspine, bookYaml);
        })
        .then(tocData => {
            chapters = tocData.chapters;
            return assetsManifest(rendered, bookYaml, manifest);
        })
        .then(() => {
            return makeOpfXml(bookYaml, manifest, opfspine);
        })
        .then(_OPFXML => {
            OPFXML = _OPFXML;
            return new Promise((resolve, reject) => {
                fs.writeFile(path.join(rendered, bookYaml.opf), new xmldom.XMLSerializer().serializeToString(OPFXML), 'utf8', err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        })
        .then(() => {
            return makeNCXXML(rendered, bookYaml, chapters);
        })
        .then(_NCXXML => {
            NCXXML = _NCXXML;
            return new Promise((resolve, reject) => {
                fs.writeFile(path.join(rendered, bookYaml.ncx.href), new xmldom.XMLSerializer().serializeToString(NCXXML), 'utf8', err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        })
        .then(()   => { resolve();    })
        .catch(err => { reject(err); });
    });
};

exports.checkEPUBfiles = function(rendered) {
    
    // For each HTML file
    //    Check <a>, <style> and <link> URL for these problems
    //         Link starts with '/'
    //         Relative link is bad
    return checkHtmlProblems(rendered);
};

exports.bundleEPUB = function(rendered, epubFileName) {
    return new Promise((resolve, reject) => {
    
        // util.log(rendered +' '+ epubFileName);
        
        // read container.xml -- extract OPF file name
        // read OPF file
        // write mimetype file
        // write container.xml
        // write OPF file
        // for each entry in OPF - write that file
        // when done, finalize
        
            
        var containerXmlText;
        var containerXml;
        var opfFileName;
        var opfXmlText;
        var opfXml;
    
        readContainerXml(rendered)
        .then(containerXmlData => {
            containerXmlText = containerXmlData.containerXmlText;
            containerXml     = containerXmlData.containerXml;
            return findOpfFileName(containerXml);
        })
        .then(_opfFileName  => {
            opfFileName = _opfFileName;
            return readOPF(rendered, opfFileName);
        })
        .then(opfXmlData => {
            opfXmlText = opfXmlData.opfXmlText;
            opfXml = opfXmlData.opfXml;
            return archiveFiles(rendered, epubFileName, opfXml, opfFileName);
        })
        .then(()   => { resolve();    })
        .catch(err => { reject(err); });
    });
};

function readContainerXml(rendered) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(rendered, "META-INF", "container.xml"), 'utf8',
            (err, data) => {
                if (err) return reject(err);
                resolve({
                    containerXmlText: data,
                    containerXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
                });
            });
    });
}

function findOpfFileName(containerXml) {
    var rootfiles = containerXml.getElementsByTagName("rootfile");
    // util.log(util.inspect(rootfile));
    var rootfile;
    for (var rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        var elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfile'.toUpperCase()) rootfile = elem;
    }
    if (!rootfile) throw new Error('No rootfile element in container.xml');
    return rootfile.getAttribute('full-path');
}

function readOPF(rendered, opfName) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(rendered, opfName), 'utf8',
            (err, data) => {
                if (err) return reject(err);
                resolve({
                    opfXmlText: data,
                    opfXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
                });
            });
    });
}

function concatHTML(rendered, opfXml, opfFileName, outputJSwindow, outputDir) {
    
    return new Promise((resolve, reject) => {
        
        try {
            var manifests = opfXml.getElementsByTagName("manifest");
            var manifest;
            for (let elem of nodeListIterator(manifests)) {
                if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()) manifest = elem;
            }
            if (manifest) {
                
                // First, create an array of the file names to use
                var itemHrefs = [];
                var items = manifest.getElementsByTagName('item');
                for (let item of nodeListIterator(items)) {
                    if (item.nodeName.toUpperCase() === 'item'.toUpperCase()) {
                        let itemHref = item.getAttribute('href');
                        let mediaType = item.getAttribute('media-type');
                        
                        if (itemHref === "mimetype"
                         || itemHref === opfFileName
                         || itemHref === path.join("META-INF", "container.xml")
                         || mediaType !== "application/xhtml+xml") {
                            // Skip these special files
                            continue;
                        }
                        itemHrefs.push(itemHref);
                    }
                }
                
                // Then step through that array doing these things
                //    * read the named file
                //    * remove the script tag added by jsdom
                //    * copy any referenced images, fixing the img src= attribute
                //    * append the <body> of file to the output window
                async.eachSeries(itemHrefs,
                (itemHref, done) => {
                    
                    let itemFileName = path.join(rendered, itemHref);
                    fs.readFile(itemFileName, 'utf8',
                    (err, text) => {
                        if (err) return done(err);
                        
                        log('readFile '+ itemHref);
                        jsdom.env(
                        text, ['http://code.jquery.com/jquery.js'],
                        (err, window) => {
                            if (err) { error(err); return done(err); }
                            // Remove the script tag added by jsdom
                            window.$('body script.jsdom[src*="jquery"]').remove();
                            window.$('img').each(function(index) {
                                // an img src=path/to/file.jpg becomes just src=files.jpg on output
                                let imgsrc = window.$(this).attr('src');
                                log('copying '+ imgsrc +' to '+ path.join(outputDir, path.basename(imgsrc)));
                                let itemDirName = path.dirname(itemFileName);
                                // have to do copySync here because of the difficulty
                                // of handling this as an asynchronous operation
                                fs.copySync(path.join(itemDirName, imgsrc),
                                            path.join(outputDir, path.basename(imgsrc)));
                                window.$(this).attr('src', path.basename(imgsrc));
                            });
                            let bodyText = window.$("body").html();
                            outputJSwindow.$(bodyText).appendTo('body');
                            outputJSwindow.$('<div class="page-break"></div>').appendTo('body');
                            log('processed '+ itemHref);
                            done();
                        });
                    });
                },
                err => {
                    if (err) reject(err);
                    else resolve();
                });
            
            } else {
                reject(new Error(`no manifest in ${opfFileName}`));
            }
        } catch(err) { reject(err); }
    });
}

function archiveFiles(rendered, epubFileName, opfXml, opfFileName) {
    
    return new Promise((resolve, reject) => {
        try {
            var archive = archiver('zip');
            
            var output = fs.createWriteStream(epubFileName);
                    
            output.on('close', () => {
                // logger.info(archive.pointer() + ' total bytes');
                // logger.info('archiver has been finalized and the output file descriptor has closed.');
                resolve();
            });
            
            archive.on('error', err => {
                // logger.info('*********** BundleEPUB ERROR '+ err);
                reject(err);
            });
            
            archive.pipe(output);
            
            // The mimetype file must be the first entry, and must not be compressed
            archive.append(
                fs.createReadStream(path.join(rendered, "mimetype")),
                { name: "mimetype", store: true });
            archive.append(
                fs.createReadStream(path.join(rendered, "META-INF", "container.xml")),
                { name: path.join("META-INF", "container.xml") });
            archive.append(
                fs.createReadStream(path.join(rendered, opfFileName)),
                { name: opfFileName });
            
            var manifests = opfXml.getElementsByTagName("manifest");
            var manifest;
            for (let elem of nodeListIterator(manifests)) {
                if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()) manifest = elem;
            }
            if (manifest) {
                var items = manifest.getElementsByTagName('item');
                for (let item of nodeListIterator(items)) {
                    if (item.nodeName.toUpperCase() === 'item'.toUpperCase()) {
                        var itemHref = item.getAttribute('href');
                        
                        if (itemHref === "mimetype"
                         || itemHref === opfFileName
                         || itemHref === path.join("META-INF", "container.xml")) {
                            // Skip these special files
                            continue;
                        }
                        
                        archive.append(
                            fs.createReadStream(path.join(rendered, itemHref)),
                            { name: itemHref }
                        );
                    }
                }
            }
            
            archive.finalize();

        } catch(e) { reject(e); }
    });

}

// read the designated TOC file (toc.html)
function readTOC(rendered, tocHref) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(rendered, tocHref), 'utf8',
            (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
    });
}

function scanTocHtml(tocHtml, tocId, tocHref, ncx, manifest, opfspine, bookYaml) {
    
    return new Promise((resolve, reject) => {
        try {
            var doc = jsdom.jsdom(tocHtml, {});
            
            var navs = doc.getElementsByTagName("nav");
            var thenav;
            for (let nav of nodeListIterator(navs)) {
                if (nav.id === tocId) {
                    thenav = nav;
                    break;
                }
            }
            if (!thenav) {
                return reject(new Error('no <nav id="'+ tocId +'">'));
            }
            // logger.info('found nav');
            
            var topol;
            for (let navchild = 0; navchild < thenav.childNodes.length; navchild++) {
                if (thenav.childNodes[navchild].nodeName
                 && thenav.childNodes[navchild].nodeName.toUpperCase() === 'ol'.toUpperCase()
                 && thenav.childNodes[navchild].hasAttributes()
                 && thenav.childNodes[navchild].getAttribute('start')
                 && thenav.childNodes[navchild].getAttribute('type')) {
                    topol = thenav.childNodes[navchild];
                    break;
                }
            }
            if (!topol) {
                return reject(new Error('no <nav><ol type= start=></ol></nav>'));
            }
            // logger.info('found topol');
            
            
            // cover image/file manifest and opfspine entries
            
            manifest.push({
                id: bookYaml.cover.idImage,
                properties: "cover-image",
                href: rewriteURL({ rendered_url: bookYaml.opf }, bookYaml.cover.src, false),
                type: bookYaml.cover.type
            });
            
            if (bookYaml.cover.coverHtml) {
                manifest.push({
                    id: bookYaml.cover.coverHtml.id,
                    href: rewriteURL({ rendered_url: bookYaml.opf }, bookYaml.cover.coverHtml.href, false),
                    type: "application/xhtml+xml"
                });
                opfspine.push({
                    idref: bookYaml.cover.coverHtml.id,
                    linear: "yes"
                });
            }
            
            // Add specific manifest and opfspine entries for TOC and NCX files
            
            manifest.push({
                id: tocId,
                properties: "nav",
                type: "application/xhtml+xml",
                href: tocHref
            });
            opfspine.push({
                idref: tocId,
                linear: "yes"
            });
            // logger.trace('_scanForBookMetadata '+ util.inspect(config.akashacmsEPUB.manifest));
            if (ncx) {
                manifest.push({
                    id: ncx.id,
                    type: "application/x-dtbncx+xml",
                    href: ncx.href
                });
            }
            
            // Scan the nested tree of ol's to capture data for .manifest .opfspine and .chapters
            var spineorder = 0;
            var scanOL = function(ol) {
                // logger.info('scanOL ol.length='+ ol.childNodes.length);
                var chaps = [];
                for (let olchild of nodeListIterator(ol.childNodes)) {
                    // logger.info('olchild.nodeName '+ olchild.nodeName);
                    if (olchild.nodeName && olchild.nodeName.toUpperCase() === 'li'.toUpperCase()) {
                        var section; // section refers to chapters or subchapters
                        var subchapters;
                        section = undefined;
                        subchapters = undefined;
                        for (let childno = 0; childno < olchild.childNodes.length; childno++) {
                            // logger.info('olchild.childNodes[childno].nodeName '+ olchild.childNodes[childno].nodeName);
                            if (olchild.childNodes[childno].nodeName
                             && olchild.childNodes[childno].nodeName.toUpperCase() === 'ol'.toUpperCase()) {
                                subchapters = scanOL(olchild.childNodes[childno]);
                            } else if (olchild.childNodes[childno].nodeName
                                    && olchild.childNodes[childno].nodeName.toUpperCase() === 'a'.toUpperCase()) {
                                let anchor = olchild.childNodes[childno];
                                
                                let href = anchor.getAttribute('href');
                                let hrefP = url.parse(href);
                                
                                // Detect any files that are already in manifest
                                // Only add to manifest stuff which isn't already there
                                let inManifest = false;
                                for (let mi = 0; mi < manifest.length; mi++) {
                                    let item = manifest[mi];
                                    if (item.href === hrefP.pathname) {
                                        inManifest = true;
                                    }
                                }
                                
                                if (!inManifest) manifest.push({
                                    id: anchor.getAttribute('id'),
                                    type: "application/xhtml+xml",
                                    href: anchor.getAttribute('href')
                                });
                                
                                opfspine.push({
                                    idref: anchor.getAttribute('id'),
                                    linear: "yes"
                                });
                                
                                section = {
                                    id: anchor.getAttribute('id'),
                                    title: anchor.textContent,
                                    href: anchor.getAttribute('href'),
                                    type: "application/xhtml+xml",
                                    navclass: "book",
                                    spineorder: ++spineorder
                                };
                            }
                        }
                        if (!section) {
                            console.error('<li> has no <a> children in TOC='+ tocHref);
                        } else {
                            if (subchapters) section.subchapters = subchapters;
                            chaps.push(section);
                        }
                    }
                }
                // logger.info(util.inspect(chaps));
                return chaps;
            }
            var chapters = scanOL(topol);
            
            // logger.info(util.inspect(config.akashacmsEPUB.chapters));
            
            resolve({
                manifest: manifest,
                opfspine: opfspine,
                chapters: chapters
            });
        } catch(err) { reject(err); }
    });
}

function assetsManifest(rendered, bookYaml, manifest) {
    
    
    return new Promise((resolve, reject) => {
            
        // There had formerly been a list of allowed file extensions in globfs.operate
        //
        // Turns out to have been too restrictive because those who wanted to
        // include other kinds of files weren't free to do so.
        //
        // The purpose here is to add manifest entries for files that aren't documents
        // and aren't already in the manifest for any other reason.
        
        var assetNum = 0;
        globfs.operate(rendered, [ "**/*" ], (basedir, fpath, fini) => {
                
            // logger.trace('asset file '+ path.join(basedir, fpath));
            
            fs.stat(path.join(basedir, fpath), (err, stats) => {
                if (err || !stats) {
                    // Shouldn't get this, because globfs will only give us
                    // files which exist
                    // logger.error('ERROR '+ basedir +' '+ fpath +' '+ err);
                    fini();
                } else if (stats.isDirectory()) {
                    // Skip directories
                    // logger.trace('isDirectory '+ basedir +' '+ fpath);
                    fini();
                } else if (fpath === "mimetype"
                        || fpath === bookYaml.opf
                        || fpath === path.join("META-INF", "container.xml")) {
                    // Skip these special files
                    fini();
                } else {
                    // Detect any files that are already in manifest
                    // Only add to manifest stuff which isn't already there
                    var inManifest = false;
                    manifest.forEach(item => {
                        if (item.href === fpath) {
                            inManifest = true;
                        }
                    });
                    if (!inManifest) {
                        // We're not using the mime library for some
                        // file extensions because it gives
                        // incorrect values for the .otf and .ttf files
                        
                        // logger.trace('assetManifestEntries '+ basedir +' '+ fpath);
                        var mimetype;
                        if (fpath.match(/\.ttf$/i)) mimetype = "application/vnd.ms-opentype";
                        else if (fpath.match(/\.otf$/i)) mimetype = "application/vnd.ms-opentype";
                        else if (fpath.match(/\.js$/i)) mimetype = "application/javascript";
                        else if (fpath.match(/\.css/i)) mimetype = "text/css";
                        else mimetype = mime.lookup(fpath);
                        
                        manifest.push({
                            id: "asset" + assetNum++,
                            type: mimetype,
                            href: rewriteURL({ rendered_url: bookYaml.opf }, fpath, false)
                        });
                    }
                    fini();
                }
            });
        },
        err => {
            if (err) reject(err);
            else resolve();
        });
            
    });
}

function makeOpfXml(bookYaml, manifest, opfspine) {
    
    return new Promise((resolve, reject) => {
            
        var OPFXML = new xmldom.DOMParser().parseFromString('<?xml version="1.0" encoding="utf-8" standalone="no"?> \
            <package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" \
        	xmlns:dcterms="http://purl.org/dc/terms/" version="3.0" \
        	unique-identifier="epub-unique-identifier"> \
        	<metadata> </metadata> \
        	<manifest> </manifest> \
        	<spine>    </spine> \
        	</package> \
        	', 'text/xml');
        	
        var metadata;
        var manifestElem;
        var spine;
        var elem;
        	
        var metadatas = OPFXML.getElementsByTagName("metadata");
        for (let elem of nodeListIterator(metadatas)) {
            if (elem.nodeName.toUpperCase() === 'metadata'.toUpperCase()) metadata = elem;
        }
        var manifests = OPFXML.getElementsByTagName("manifest");
        for (let elem of nodeListIterator(manifests)) {
            if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()) manifestElem = elem;
        }
        var spines = OPFXML.getElementsByTagName("spine");
        for (let elem of nodeListIterator(spines)) {
            if (elem.nodeName.toUpperCase() === 'spine'.toUpperCase()) spine = elem;
        }

        // Check for required parameters
        if (typeof bookYaml.title === 'undefined' || bookYaml.title === null) {
            reject(new Error('no title'));
        }
        if (typeof bookYaml.languages === 'undefined' || bookYaml.languages === null) {
            reject(new Error('no languages'));
        }
        if (typeof bookYaml.published.date == 'undefined' || bookYaml.published.date === null) {
            reject(new Error('no dates'));
        }
        
        if (typeof bookYaml.identifiers !== 'undefined' && bookYaml.identifiers !== null) {
            bookYaml.identifiers.forEach((identifier) => {
                elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:identifier');
                if (typeof identifier.unique !== 'undefined' && identifier.unique !== null) {
                    elem.setAttribute('id', "epub-unique-identifier");
                }
                if (typeof identifier.urn && identifier.urn != null) {
                    elem.appendChild(OPFXML.createTextNode(identifier.urn));
                    metadata.appendChild(elem);
                } else if (typeof identifier.uuid && identifier.uuid != null) {
                    elem.appendChild(OPFXML.createTextNode("urn:uuid:"+identifier.uuid));
                    metadata.appendChild(elem);
                }
                // TODO Format for other ID formats like ISBN
            });
        }
        
		// <dc:title id="pub-title"><%= title %></dc:title>
        elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:title');
        elem.setAttribute('id', 'pub-title');
        elem.appendChild(OPFXML.createTextNode(bookYaml.title));
        metadata.appendChild(elem);
        
        // <dc:subject><%= subject %></dc:subject>
        bookYaml.subjects.forEach((subject) => {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:subject');
            elem.appendChild(OPFXML.createTextNode(subject));
            metadata.appendChild(elem);
        });
        
        // <dc:description><%= description %></dc:description>
        if (typeof bookYaml.description !== 'undefined' && bookYaml.description) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'description');
            elem.appendChild(OPFXML.createTextNode(bookYaml.description));
            metadata.appendChild(elem);
        }
        
        // <dc:date><%= date %></dc:date>
        if (typeof bookYaml.published.date !== 'undefined' && bookYaml.published.date) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:date');
            let date = w3cdate(new Date(bookYaml.published.date));
            elem.appendChild(OPFXML.createTextNode(date));
            metadata.appendChild(elem);
        }
        
        // <meta property="dcterms:modified"><%= modified %>
        if (typeof bookYaml.published.modified !== 'undefined' && bookYaml.published.modified) {
            elem = OPFXML.createElement('meta');
            elem.setAttribute('property', "dcterms:modified");
            let mdate = new Date(bookYaml.published.modified);
            if (mdate) {
                let date = w3cdate(mdate);
                elem.appendChild(OPFXML.createTextNode(date));
                metadata.appendChild(elem);
            }
        }
        
        // <dc:format><%= format %></dc:format>
        if (typeof bookYaml.format !== 'undefined' && bookYaml.format) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:format');
            elem.appendChild(OPFXML.createTextNode(bookYaml.format));
            metadata.appendChild(elem);
        }
        
        // <dc:language><%= language %></dc:language>
        bookYaml.languages.forEach(language => {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:language');
            elem.appendChild(OPFXML.createTextNode(language));
            metadata.appendChild(elem);
        });
        
        // <dc:source><%= source %></dc:source>
        if (bookYaml.source) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:source');
            elem.appendChild(OPFXML.createTextNode(bookYaml.source));
            metadata.appendChild(elem);
        }
        
        // <dc:creator id="<%= creator.id %>"<%
        //        %> ><%= creator.name %></dc:creator><%
        //        if (creator.role) { %>
        //            <meta refines="#<%= creator.id %>" property="role" scheme="marc:relators"><%= creator.role %></meta>
        //        <% }
        if (bookYaml.creators) {
            bookYaml.creators.forEach((creator) => {
                elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:creator');
                elem.setAttribute('id', creator.id);
                elem.appendChild(OPFXML.createTextNode(creator.name));
                // <meta refines="#<%= creator.id %>" property="role" scheme="marc:relators"><%= creator.role %></meta>
                if (creator.role) {
                    var metaelem = OPFXML.createElement('meta');
                    metaelem.setAttribute('refines', "#"+ creator.id);
                    metaelem.setAttribute('property', "role");
                    metaelem.setAttribute('proschemeperty', "marc:relators");
                    metaelem.appendChild(OPFXML.createTextNode(creator.role));
                    elem.appendChild(metaelem);
                }
                metadata.appendChild(elem);
            });
        }
        
        // <dc:contributor id="<%= contributor.id %>"<%
        //        if (contributor.fileAs) { %> opf:file-as="<%= contributor.fileAs %>"<% }
        //        if (contributor.role) { %> opf:role="<%= contributor.role %>"<% }
        //        %> ><%= contributor.name %></dc:contributor>
        if (bookYaml.contributors) {
            bookYaml.contributors.forEach((contributor) => {
                elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:contributor');
                elem.setAttribute('id', contributor.id);
                if (contributor.fileAs) {
                    elem.setAttribute('opf:file-as', contributor.fileAs);
                }
                if (contributor.role) {
                    elem.setAttribute('opf:role', contributor.role);
                }
                elem.appendChild(OPFXML.createTextNode(contributor.name));
                metadata.appendChild(elem);
            });
        }
        
        // <dc:publisher><%= publisher %></dc:publisher>
        if (typeof bookYaml.publisher !== 'undefined' && bookYaml.publisher) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:publisher');
            elem.appendChild(OPFXML.createTextNode(bookYaml.publisher));
            metadata.appendChild(elem);
        }
        
        // <dc:relation><%= relation %></dc:relation>
        if (typeof bookYaml.relation !== 'undefined' && bookYaml.relation) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:relation');
            elem.appendChild(OPFXML.createTextNode(bookYaml.relation));
            metadata.appendChild(elem);
        }
        
        // <dc:coverage><%= coverage %></dc:coverage>
        if (typeof bookYaml.coverage !== 'undefined' && bookYaml.coverage) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:coverage');
            elem.appendChild(OPFXML.createTextNode(bookYaml.coverage));
            metadata.appendChild(elem);
        }
        
        // <dc:rights><%= rights %></dc:rights>
        if (typeof bookYaml.rights !== 'undefined' && bookYaml.rights) {
            elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:rights');
            elem.appendChild(OPFXML.createTextNode(bookYaml.rights));
            metadata.appendChild(elem);
        }
        
        // <item id="<%= item.id %>" <%
        //    if (item.properties) { %> properties="<%= item.properties %>" <% }
        //   %>href="<%= item.href %>" media-type="<%= item.type %>"/>
        manifest.forEach(item => {
            elem = OPFXML.createElement('item');
            elem.setAttribute('id', item.id);
            if (item.properties) { elem.setAttribute('properties', item.properties); }
            elem.setAttribute('href', item.href);
            elem.setAttribute('media-type', item.type);
            manifestElem.appendChild(elem);
        });
        
	    if (bookYaml.ncx.id) { spine.setAttribute('toc', bookYaml.ncx.id); }
	    
    	// <itemref idref="<%= item.idref %>" <%
    	//    if (item.linear) { %>linear="<%= item.linear %>" <% }
    	//    %> /> <%
    	opfspine.forEach(function(item) {
            elem = OPFXML.createElement('itemref');
            elem.setAttribute('idref', item.idref);
    	    if (item.linear) { elem.setAttribute('linear', item.linear); }
            spine.appendChild(elem);
    	});
        
        resolve(OPFXML);
    });
}

function makeNCXXML(rendered, bookYaml, chapters) {
    return new Promise((resolve, reject) => {
        try {
            
            var NCXXML = new xmldom.DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?> \
                <ncx version="2005-1" xml:lang="en" xmlns="http://www.daisy.org/z3986/2005/ncx/"> \
                  <head> </head> \
                  <docTitle> <text></text> </docTitle> \
                  <docAuthor> <text></text> </docAuthor> \
                  <navMap> </navMap> \
                </ncx>', 'text/xml');
                
            var headElem;
            var docTitleElem;
            var docTitleText;
            var docAuthorElem;
            var docAuthorText;
            var navMapElem;
            var elem;
            
            var heads = NCXXML.getElementsByTagName("head");
            // util.log(util.inspect(rootfile));
            for (let elem of nodeListIterator(heads)) {
                if (elem.nodeName.toUpperCase() === 'head'.toUpperCase()) headElem = elem;
            }
            
            var docTitles = NCXXML.getElementsByTagName("docTitle");
            // util.log(util.inspect(rootfile));
            for (let elem of nodeListIterator(docTitles)) {
                if (elem.nodeName.toUpperCase() === 'docTitle'.toUpperCase()) docTitleElem = elem;
            }
            var docTitleTexts = docTitleElem.getElementsByTagName("text");
            for (let elem of nodeListIterator(docTitleTexts)) {
                if (elem.nodeName.toUpperCase() === 'text'.toUpperCase()) docTitleText = elem;
            }
            
            var docAuthors = NCXXML.getElementsByTagName("docAuthor");
            // util.log(util.inspect(rootfile));
            for (let elem of nodeListIterator(docAuthors)) {
                if (elem.nodeName.toUpperCase() === 'docAuthor'.toUpperCase()) docAuthorElem = elem;
            }
            var docAuthorTexts = docAuthorElem.getElementsByTagName("text");
            for (let elem of nodeListIterator(docAuthorTexts)) {
                if (elem.nodeName.toUpperCase() === 'text'.toUpperCase()) docAuthorText = elem;
            }
            
            var navMaps = NCXXML.getElementsByTagName("navMap");
            // util.log(util.inspect(rootfile));
            for (let elem of nodeListIterator(navMaps)) {
                if (elem.nodeName.toUpperCase() === 'navMap'.toUpperCase()) navMapElem = elem;
            }
            
            var uniqueID;
            bookYaml.identifiers.forEach(function(identifier) {
                if (typeof identifier.unique !== 'undefined' && identifier.unique !== null) uniqueID = identifier;
            });
            if (!uniqueID) reject(new Error("No Identifier"));
            
            // <meta name="dtb:uid" content="<%= uniqueID.ncxidentifier %>"/>
            // <meta name="dtb:uid" content="<%= uniqueID.idstring %>"/>
            if (uniqueID.ncxidentifier) {
                elem = NCXXML.createElement('meta');
                elem.setAttribute('name', "dtb:uid");
                elem.setAttribute('content', uniqueID.ncxidentifier);
                headElem.appendChild(elem);
            } else {
                elem = NCXXML.createElement('meta');
                elem.setAttribute('name', "dtb:uid");
                elem.setAttribute('content', uniqueID.idstring);
                headElem.appendChild(elem);
            }
            
            // <meta name="dtb:depth" content="1"/> <!-- 1 or higher -->
            elem = NCXXML.createElement('meta');
            elem.setAttribute('name', "dtb:depth");
            elem.setAttribute('content', "1");
            headElem.appendChild(elem);
            
            // <meta name="dtb:totalPageCount" content="0"/> <!-- must be 0 -->
            elem = NCXXML.createElement('meta');
            elem.setAttribute('name', "dtb:totalPageCount");
            elem.setAttribute('content', "0");
            headElem.appendChild(elem);
            
            // <meta name="dtb:maxPageNumber" content="0"/> <!-- must be 0 -->
            elem = NCXXML.createElement('meta');
            elem.setAttribute('name', "dtb:maxPageNumber");
            elem.setAttribute('content', "0");
            headElem.appendChild(elem);
            
            docTitleText.appendChild(NCXXML.createTextNode(bookYaml.title));
            docAuthorText.appendChild(NCXXML.createTextNode(bookYaml.creators[0].nameReversed));
            
            // <navPoint class="<%= chapter.navclass %>" id="<%= chapter.id %>" playOrder="<%= chapter.spineorder %>">
            //     <navLabel><text><%= chapter.title %></text></navLabel>
            //     <content src="<%= chapter.href %>" />
            //     <%
            //     if (chapter.hasOwnProperty("subchapters") && chapter.subchapters) {
            //         chapter.subchapters.forEach(function(subchapter) {
            //             %>
            //             <%- partial('toc-navpoint.ncx.ejs', { chapter: subchapter }) %>
            //             <%
            //         });
            //     }
            //     %>
            // </navPoint>
            
            // console.log(util.inspect(chapters));
            
            var navPointForChapter = function(chapter) {
                var navPoint = NCXXML.createElement('navPoint');
                navPoint.setAttribute('class', chapter.navclass);
                navPoint.setAttribute('id', chapter.id);
                navPoint.setAttribute('playOrder', chapter.spineorder);
                
                var navLabel = NCXXML.createElement('navLabel');
                var navLabelText = NCXXML.createElement('text');
                navLabelText.appendChild(NCXXML.createTextNode(chapter.title));
                navLabel.appendChild(navLabelText);
                navPoint.appendChild(navLabel);
                
                var content = NCXXML.createElement('content');
                content.setAttribute('src', chapter.href);
                navPoint.appendChild(content);
                
                return navPoint;
            };
    
            var handleNavChapters = function(appendTo, chapters) {
                chapters.forEach(chapter => {
                    var navPoint = navPointForChapter(chapter);
                    appendTo.appendChild(navPoint);
                    if (chapter.hasOwnProperty("subchapters") && chapter.subchapters) {
                        handleNavChapters(navPoint, chapter.subchapters);
                    }
                });
            };
            
            handleNavChapters(navMapElem, chapters);
        
            resolve(NCXXML);
        } catch(e) { reject(e); }
    });
}

function checkHtmlProblems(rendered) {
    return new Promise((resolve, reject) => {
        globfs.operate(rendered, [ "**/*.html" ], (basedir, fpath, fini) => {
                
            // logger.trace('asset file '+ path.join(basedir, fpath));
            
            fs.stat(path.join(basedir, fpath), (err, stats) => {
                if (err || !stats) {
                    // Shouldn't get this, because globfs will only give us
                    // files which exist
                    // logger.error('ERROR '+ basedir +' '+ fpath +' '+ err);
                    fini();
                } else if (stats.isDirectory()) {
                    // Skip directories
                    // logger.trace('isDirectory '+ basedir +' '+ fpath);
                    fini();
                } else {
                    checkHtmlProblemsForFile(basedir, fpath)
                    .then(() => { fini(); })
                    .catch(err => { fini(err); });
                }
            });
        },
        err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function checkHtmlProblemsForFile(basedir, fpath) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(basedir, fpath), 'utf8', (err, html) => {
            if (err) return reject(err);
            
            // util.log('... '+ fpath);
            
            var doc = jsdom.jsdom(html, {});
            
            var links = doc.getElementsByTagName("a");
            for (let link of nodeListIterator(links)) {
                var href = link.getAttribute('href');
                var urlp = url.parse(href);
                // we only need to concern ourselves with local links
                if (! urlp.protocol && !urlp.slashes && !urlp.host && urlp.pathname) {
                    if (urlp.pathname.startsWith('/')) {
                        console.error('Internal link cannot be absolute '+ fpath +' url='+ href);
                    }
                }
            }
            
            var imgs = doc.getElementsByTagName("img");
            for (let img of nodeListIterator(imgs)) {
                var src = img.getAttribute('src');
                var srcp = url.parse(src);
                if (srcp.protocol || srcp.slashes || srcp.host) {
                    console.error('Cannot link to external images '+ fpath +' src='+ src);
                } else {
                    if (srcp.pathname.startsWith('/')) {
                        console.error('Internal image source cannot be absolute '+ fpath +' src='+ src);
                    }
                }
            }
            
            resolve();
        });
    });
}

function rewriteURL(metadata, sourceURL, allowExternal) {
	var urlSource = url.parse(sourceURL, true, true);
	if (urlSource.protocol || urlSource.slashes) {
        if (!allowExternal) {
            throw new Error("Got external URL when not allowed " + sourceURL);
        } else return sourceURL;
    } else {
		var pRenderedUrl;
		var ret;
        if (urlSource.pathname && urlSource.pathname.match(/^\//)) { // absolute URL
            var prefix = computeRelativePrefixToRoot(metadata.rendered_url);
            // logger.trace('absolute - prefix for '+ metadata.rendered_url +' == '+ prefix);
            ret = path.normalize(prefix+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        } else {
            ret = sourceURL; //   path.normalize(docdir+'/'+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        }
    }
}

function computeRelativePrefixToRoot(source) {
    var prefix = '';
    for (var parent = path.dirname(source); parent !== '.'; parent = path.dirname(parent)) {
        prefix += '../';
    }
    return prefix === '' ? './' : prefix;
}


function w3cdate(date) {
    return sprintf("%04d-%02d-%02dT%02d:%02d:%02dZ",
           date.getUTCFullYear(),
          (date.getUTCMonth() + 1),
           date.getUTCDate(),
          (date.getUTCHours()),
          (date.getUTCMinutes() + 1),
          (date.getUTCSeconds() + 1)
    );
};

function nodeListIterator(nodeList) {
    nodeList[Symbol.iterator] = function() {
        return {
            next: function() {
                if (this._index < nodeList.length) {
                    var ret = nodeList.item(this._index);
                    this._index++;
                    return { value: ret, done: false };
                } else {
                    return { done: true };
                }
            },
            _index: 0
        };
    };
    return nodeList;
}
