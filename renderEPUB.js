
const akasha        = require('akasharender');
const akfilez       = require('akasharender/filez');
const fs            = require('fs-extra');
const path          = require('path');
const util          = require('util');

let akconfig;

module.exports.unsetconfig = function() { akconfig = undefined; };


module.exports.setconfig = function(config) {
    const epubdir = config.sourceBookFullPath;
    const renderTo = config.bookRenderDestFullPath;
    if (akconfig) module.exports.unsetconfig();
    akconfig = new akasha.Configuration();
    akconfig
        .use(require('@akashacms/plugins-epub'))
        /* .use(require('akashacms-footnotes')) */
        /* .use(require('akashacms-embeddables')) */;
    
    akconfig.addDocumentsDir(epubdir);
    if (config.layoutsDir) akconfig.addLayoutsDir(config.layoutsDir);
    if (config.partialsDir) akconfig.addPartialsDir(config.partialsDir);
    
    akconfig.setMahabhutaConfig({
        recognizeSelfClosing: true,
        recognizeCDATA: true,
        xmlMode: true
    });

    akconfig.setRenderDestination(renderTo);

    akconfig.prepare();

    console.log(`AkashaEPUB setconfig `, epubdir, renderTo, akconfig);
};

module.exports.renderTo = function(renderTo) {
    if (akconfig) {
        akconfig.setRenderDestination(renderTo);
    }
};

module.exports.partialsdir = function(dirnm) {
    if (akconfig) {
        akconfig.addPartialsDir(dirnm);
    }
};

module.exports.layoutsdir = function(dirnm) {
    if (akconfig) {
        akconfig.addLayoutsDir(dirnm);
    }
};

module.exports.stylesheet = function(cssfn) {
    if (akconfig) {
        akconfig.addStylesheet({ href: cssfn });
    }
};

module.exports.renderProject = async function() {
    console.log(`AkashaEPUB-Config renderProject`);
    return await akasha.render(akconfig); 
}

async function renderFile(documentPath) {

    let found = await akfilez.findRendersTo(akconfig.documentDirs, documentPath);

    console.log(`Akasha renderFile looking for ${util.inspect(akconfig.documentDirs)} / ${documentPath} found `, found);

    let result = await akasha.renderDocument(
                akconfig,
                found.foundDir,
                found.foundPathWithinDir,
                akconfig.renderTo,
                found.foundMountedOn,
                {});

    return result;
}
