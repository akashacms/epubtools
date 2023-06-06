
// import path from 'path';
// import util from 'util';
// import { promises as fs } from 'fs';

import { Configuration, readConfig } from './Configuration.js';
export { Configuration, readConfig } from './Configuration.js';

export {
    bundleEPUB, doPackageCommand, doMeta, doMkMetaCommand
} from './bundleEPUB.js';

export { checkEPUBConfig } from './checkEPUB.js';

export {
    Manifest, ManifestItem, spineItems,
    spineTitles, tocData, from_fs
} from './manifest.js';

export {
    readContainerXml, findRootfiles, findOpfFileName,
    readOPF, readXHTML
} from './metadata.js';

export {
    findMetadataInOPF, findManifestInOPF,
    findSpineInOPF, refines, titles, identifiers,
    languages, creators, publicationDate, subjects,
    description, format, publisher, relation, coverage,
    rights, manifest, readOpf, makeOpfXml, readTocNCX,
    makeNCXXML, modifiedDate
} from './opf.js';

export async function openProject(projectFileName) {
    const bookConfig = await readConfig(projectFileName);
    bookConfig.configFileName = projectFileName;
    return bookConfig;
}

export async function createEmptyProject(fn) {
    const config = new Configuration("");
    config.configFileName = fn;
    return config;
}

/* -- This function was never tested

export async function createProjectFromEPUBDir(epubDir, projectFN) {

    let stats = await fs.stat(epubDir);
    if (!stats.isDirectory()) {
        throw new Error(`import requires an unpacked EPUB directory structure, got ${epubDir}`);
    }

    let containerXmlData = await readContainerXml(epubDir);
    let opfFN;
    let opfXml;
    if (containerXmlData) {
        let roots = findRootfiles(containerXmlData);
        if (roots && roots.length >= 1) {
            // This supports reading the first OPF in the container.xml
            config.containerRootfiles = roots;
            opfFN = roots[0].fullpath;
            let opfData = await readOPF(epubDir, opfFN);
            opfXml = opfData ? opfData.opfXml : undefined;
        } else {
            config.containerRootfiles = [];
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
    
    config.renderedPath = epubDir;
    // config.destRenderRoot = ??
    config.epubFileName = `${epubDir}.epub`;
    if (opfFN) config.bookOPF = opfFN;
    // config.projectName = ??

    // config.sourceBookTOCID = ??
    // config.sourceBookTOCHREF = ??

    // TODO scan files into manifest.  DONE For each have a flag whether seen in OPF, initialize FALSE
    config.opfManifest = await from_fs(config.renderedFullPath);

    if (opfXml) {
        config.opfTitles = titles(opfXml);
        config.opfIdentifiers = identifiers(opfXml);
        config.opfLanguages = languages(opfXml);
        config.opfCreators = creators(opfXml, 'dc:creator');
        config.opfContributors = creators(opfXml, 'dc:contributor');
        config.opfPublicationDate = publicationDate(opfXml);
        config.opfSubjects = subjects(opfXml);
        config.opfDescription = description(opfXml);
        config.opfModifiedDate = modifiedDate(opfXml);
        config.opfFormat = format(opfXml);
        config.opfPublisher = publisher(opfXml);
        config.opfRelation = relation(opfXml);
        config.opfCoverage = coverage(opfXml);
        config.opfRights = rights(opfXml);

        let opfManifest = manifest(config, opfXml);
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
    *--/

    await config.save();
};
*/
