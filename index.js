
const configurator = require('./Configuration');
const metadata = require('./metadata');
const opf = require('./opf');
const path = require('path');
const util = require('util');
const fs = require('fs-extra');


module.exports.openProject = async function(projectFileName) {
    const bookConfig = await configurator.readConfig(projectFileName);
    bookConfig.configFileName = projectFileName;
    return bookConfig;
};

module.exports.createEmptyProject = async function(fn) {
    let config = new configurator.Configuration("");
    config.configFileName = fn;
    return config;
};

module.exports.createProjectFromEPUBDir = async function(epubDir, projectFN) {

    let stats = await fs.stat(epubDir);
    if (!stats.isDirectory()) {
        throw new Error(`import requires an unpacked EPUB directory structure, got ${epubDir}`);
    }

    let { containerXml } = await metadata.readContainerXml(epubDir);
    let opfFN = metadata.findOpfFileName(containerXml);
    let { opfXml } = await metadata.readOPF(epubDir, opfFN);
    let config = await exports.createEmptyProject(projectFN);
    
    config.sourceBookroot = epubDir;
    // config.destRenderRoot = ??
    config.epubFileName = `${epubDir}.epub`;
    config.sourceBookOPF = opfFN;
    // config.projectName = ??

    // config.sourceBookTOCID = ??
    // config.sourceBookTOCHREF = ??

    config.bookMetaTitles = opf.titles(opfXml);
    config.bookMetaIdentifiers = opf.identifiers(opfXml);
    config.bookMetaPubLanguage = opf.languages(opfXml);
    config.bookMetaCreators = opf.creators(opfXml, 'dc:creator');
    config.bookMetaContributors = opf.creators(opfXml, 'dc:contributor');
    config.bookMetaPublicationDate = opf.publicationDate(opfXml);
    config.bookMetaSubjects = opf.subjects(opfXml);
    config.bookMetaDescription = opf.description(opfXml);
    config.bookMetaModifiedDate = opf.modifiedDate(opfXml);
    config.bookMetaFormat = opf.format(opfXml);
    config.bookMetaPublisher = opf.publisher(opfXml);
    config.bookMetaRelation = opf.relation(opfXml);
    config.bookMetaCoverage = opf.coverage(opfXml);
    config.bookMetaRights = opf.rights(opfXml);
    config.manifest = opf.manifest(config, opfXml);

    // Fill in the configuration details from the OPF

    /*
    in GUI app -- an import screen managed by the router
        - Contains a selection box to find the EPUB file 
        - Auto-determines the directory to unpack to, allowing user to select different directory 
        - Auto-determines the configuration file name, allowing user to select different file name 
        - Runs the unpack process 
        - Generates the configuration file from the OPF 
    */

    await config.save();
};