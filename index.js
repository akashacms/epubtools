
const configurator = require('./Configuration');
const metadata = require('./metadata');
const manifest = require('./manifest');
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

    let containerXmlData = await metadata.readContainerXml(epubDir);
    let opfFN;
    let opfXml;
    if (containerXmlData) {
        let roots = metadata.findRootfiles(containerXml);
        if (roots && roots.length >= 1) {
            // This supports reading the first OPF in the container.xml
            config.containerRootfiles = roots;
            opfFN = roots[0].fullpath;
            let opfData = await metadata.readOPF(epubDir, opfFN);
            opfXml = opfData ? opfData.opfXml : undefined;
        }
    }

    // The META-INF directory can contain other files besides container.xml 
    // Namely:
    //    encryption.xml - describes any encryption used and the access key
    //    manifest.xml - An alternate manifest besides the OPF
    //    metadata.xml - An alternate source for metadata besides the OPF
    //    rights.xml - DRM support unknown how to deal with this
    //    signatures.xml - Contains digital signature objects
    // None of these are supported in the following code
    //
    // As noted above, in container.xml only the first of the rootfiles items
    // are utilized for metadata and manifest content.

    let config = await exports.createEmptyProject(projectFN);
    
    config.bookroot = epubDir;
    // config.destRenderRoot = ??
    config.epubFileName = `${epubDir}.epub`;
    if (opfFN) config.bookOPF = opfFN;
    // config.projectName = ??

    // config.sourceBookTOCID = ??
    // config.sourceBookTOCHREF = ??

    // TODO scan files into manifest.  DONE For each have a flag whether seen in OPF, initialize FALSE
    config.opfManifest = await manifest.from_fs(config.bookroot);

    if (opfXml) {
        config.opfTitles = opf.titles(opfXml);
        config.opfIdentifiers = opf.identifiers(opfXml);
        config.opfLanguages = opf.languages(opfXml);
        config.opfCreators = opf.creators(opfXml, 'dc:creator');
        config.opfContributors = opf.creators(opfXml, 'dc:contributor');
        config.opfPublicationDate = opf.publicationDate(opfXml);
        config.opfSubjects = opf.subjects(opfXml);
        config.opfDescription = opf.description(opfXml);
        config.opfModifiedDate = opf.modifiedDate(opfXml);
        config.opfFormat = opf.format(opfXml);
        config.opfPublisher = opf.publisher(opfXml);
        config.opfRelation = opf.relation(opfXml);
        config.opfCoverage = opf.coverage(opfXml);
        config.opfRights = opf.rights(opfXml);

        let opfManifest = opf.manifest(config, opfXml);
        config.opfManifest.checkItemsFromOPF(opfManifest);

        // TODO for this, set the "seen in OPF" flag to true
        // TODO while looking in OPF manifest, check the file is in the file system throwing error if not
    } else {
        config.opfTitles = [];
        config.opfIdentifiers = [];
        config.opfLanguages = [];
        config.opfCreators = [];
        config.opfContributors = [];
        config.opfPublicationDate = "";
        config.opfSubjects = [];
        config.opfDescription = "";
        config.opfModifiedDate = "";
        config.opfFormat = "";
        config.opfPublisher = "";
        config.opfRelation = "";
        config.opfCoverage = "";
        config.opfRights = "";
    }

    // TODO Look through manifest throwing warning for any not seen in OPF
    for (let mItem of config.opfManifest) {
        if (!mItem.seen_in_opf) {
            console.log(`createProjectFromEPUBDir WARNING Found Manifest item not seen in OPF ${util.inspect(mItem)}`);
        }
    }

    // TODO default from titles config.projectName = 

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