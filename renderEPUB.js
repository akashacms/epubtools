
const fs            = require('fs-extra');
const path          = require('path');
const util          = require('util');

let akconfig;

module.exports.unsetconfig = function() { akconfig = undefined; };


module.exports.setconfig = function(config) {
    const epubdir = config.sourceBookFullPath;
    const renderTo = config.bookRenderDestFullPath;
    // console.log(`setconfig dirpath ${config.configDirPath} epubdir ${epubdir} renderTo ${renderTo}`);
    if (akconfig) {
        console.log(`setconfig already saw akconfig - unsetconfig`);
        module.exports.unsetconfig();
    }
    akconfig = config.akConfig = new akasha.Configuration();
    config.akConfig
        .use(require('@akashacms/plugins-epub'))
        .use(require('akashacms-dlassets'), {
            // TODO support configuring this directory from book config
            // NOTE that if this is left out then dlassets
            //      defaults to not caching external images
            // NOTE a book is unlikely to have many external images
            // NOTE __dirname does not have the correct value for use
            //      in this context.  The user should instead choose
            //      the cache directory
            // cachedir: path.join(__dirname, 'dlassets-cache')
        })
        /* .use(require('akashacms-footnotes')) */
        /* .use(require('akashacms-embeddables')) */;
    
        config.akConfig.addDocumentsDir(epubdir);
    if (config.assetsDir) config.akConfig.addAssetsDir(config.assetsDir);
    if (config.layoutsDir) config.akConfig.addLayoutsDir(config.layoutsDir);
    if (config.partialsDir) config.akConfig.addPartialsDir(config.partialsDir);
    
    config.akConfig.setMahabhutaConfig({
        recognizeSelfClosing: true,
        recognizeCDATA: true,
        xmlMode: true
    });

    config.akConfig.setRenderDestination(renderTo);

    config.akConfig.prepare();

    // console.log(`AkashaEPUB setconfig `, epubdir, renderTo, akconfig);
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

module.exports.copyAssets = async function() {
    return await akconfig.copyAssets();
}

module.exports.renderProject = async function() {
    // console.log(`AkashaEPUB-Config renderProject`);
    return await akasha.render(akconfig); 
}

async function renderFile(documentPath) {

    let found = await akfilez.findRendersTo(akconfig.documentDirs, documentPath);

    // console.log(`Akasha renderFile looking for ${util.inspect(akconfig.documentDirs)} / ${documentPath} found `, found);

    let result = await akasha.renderDocument(
                akconfig,
                found.foundDir,
                found.foundPathWithinDir,
                akconfig.renderTo,
                found.foundMountedOn,
                {});

    return result;
}
