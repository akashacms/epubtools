
const archiver  = require('archiver');
const xmldom    = require('@xmldom/xmldom');
const utils     = require('./utils');
const fs        = require('fs');
const fsp       = require('fs/promises');
const path      = require('path');
const metadata  = require('./metadata');
const manifest  = require('./manifest');
const opf       = require('./opf');
const checkEPUB = require('./checkEPUB');
const configurator = require('./Configuration');

exports.bundleEPUB = async function(config) {
    // read container.xml -- extract OPF file name
    // read OPF file
    // write mimetype file
    // write container.xml
    // write OPF file
    // for each entry in OPF - write that file
    // when done, finalize

    config.opfManifest = await manifest.from_fs(config);
    await checkEPUB.checkEPUBConfig(config);
    await archiveFiles(config);
};

exports.doPackageCommand = async function(configFN) {
    const bookConfig = await configurator.readConfig(configFN);
    await bookConfig.readTOCData();
    await exports.bundleEPUB(bookConfig);
};

async function archiveFiles(config) {

    // console.log(`archiveFiles`);
    const rendered = config.renderedFullPath;
    const epubFileName = path.join(config.configDirPath, config.epubFileName);
    const opfFileName = config.bookOPF;
    // console.log(`archiveFiles reading OPF config.renderedFullPath ${config.renderedFullPath} opfFileName ${opfFileName}`);

    // Don't readOPF but instead use the constructed OPFXML object below.
    /* const { 
        opfXmlText, opfXml 
    } = await metadata.readOPF(config.renderedFullPath, opfFileName);  */
    
    // console.log(`archiveFiles rendered ${rendered} epubFileName ${epubFileName} opfFileName ${opfFileName}`);

    const opfDirName = path.dirname(opfFileName);

    return new Promise(async (resolve, reject) => {
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

            // The mimetype file must be the first entry, it must have the
            // textual content shown here, and it must not be compressed
            // console.log(`reading ${path.join(rendered, "mimetype")} into archive`);
            archive.append(
                "application/epub+zip",
                { name: "mimetype", store: true });

            // Previously this function ran the functions to regenerate these
            // meta files.  It was decided it made more sense for this function
            // to simply package the files, and to provide a different command to
            // generate the meta files.
            //
            // The reasoning is that another tool might be generating correct meta files
            // and how can the archive function have a clearer ide of what should
            // be in the meta files?

            let container_xml = path.join("META-INF", "container.xml");

            archive.append(
                fs.createReadStream(path.join(rendered, container_xml)),
                { name: container_xml }
            );

            archive.append(
                fs.createReadStream(path.join(rendered, opfFileName)),
                { name: opfFileName }
            );

            if (config.doGenerateNCX) {
                archive.append(
                    fs.createReadStream(path.join(rendered, config.sourceBookNCXHREF)),
                    { name: config.sourceBookNCXHREF }
                );
            }

            const OPFXML = await opf.readOpf(path.join(rendered, opfFileName));

            var manifests = OPFXML.getElementsByTagName("manifest");
            var manifest;
            for (let elem of utils.nodeListIterator(manifests)) {
                if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()) manifest = elem;
            }
            if (manifest) {
                var items = manifest.getElementsByTagName('item');
                for (let item of utils.nodeListIterator(items)) {
                    if (item.nodeName.toUpperCase() === 'item'.toUpperCase()) {
                        var itemHref = item.getAttribute('href');
                        
                        // Don't archive these files because they've already
                        // been added earlier
                        let normalizedPath = path.normalize(path.join(opfDirName, itemHref));
                        if (itemHref === "mimetype"
                         || itemHref === opfFileName
                         || itemHref === container_xml
                         || (config.doGenerateNCX && normalizedPath === config.sourceBookNCXHREF)) {
                            // Skip these special files
                            // console.log(`skipping ${itemHref}`);
                            continue;
                        }

                        // console.log(`packaging ${itemHref} - ${normalizedPath}`);
                        
                        archive.append(
                            fs.createReadStream(path.join(rendered, opfDirName, itemHref)),
                            { name: normalizedPath }
                        );
                    }
                }
            }
            
            archive.finalize();

        } catch(e) { reject(e); }
    });

}

async function mkContainerXmlFile(config) {
    
    // util.log('createContainerXmlFile '+ rendered +' '+ util.inspect(bookYaml));
    
    if (!config.bookOPF && config.bookOPF === '' && !config.containerRootfiles) {
        throw new Error(`No OPF file specified in ${config.projectName}`);
    }

    var containerXml = new xmldom.DOMParser().parseFromString(
        `<?xml 
                version="1.0" 
                encoding="utf-8" 
                standalone="no"?>
        <container 
                xmlns="urn:oasis:names:tc:opendocument:xmlns:container" 
                version="1.0">
    	<rootfiles> </rootfiles>
        </container>
    `, 'text/xml');
    	
    	
    //	<%
    //    rootfiles.forEach(function(rf) {
    //    %>
    //    <rootfile full-path="<%= rf.path %>" media-type="<%= rf.type %>"/><%
    //    });
    //    %>
    	
    var rootfiles = containerXml.getElementsByTagName("rootfiles");
    var rfs;
    // util.log(util.inspect(rootfile));
    for (var rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        let elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfiles'.toUpperCase()) rfs = elem;
    }

    const addElem = (rfs, path, _mime) => {
        let elem = containerXml.createElement('rootfile');
        let mime = _mime ? _mime : 'application/oebps-package+xml';
        if (mime === 'application/oebps-package+xml') addedOPF = true;
        elem.setAttribute('full-path', path);
        elem.setAttribute('media-type', mime);
        rfs.appendChild(elem);
    }

    if (rfs) {
        if (config.bookOPF && config.bookOPF !== '') {
            addElem(rfs, config.bookOPF, undefined);
        }
        if (config.containerRootfiles) {
            for (let rootfile of config.containerRootfiles) {
                if (config.bookOPF 
                && config.bookOPF !== '' 
                && config.bookOPF !== rootfile.fullpath) {
                    addElem(rfs, rootfile.fullpath, rootfile.mime);
                }
            }
        }
    }

    return new xmldom.XMLSerializer().serializeToString(containerXml);
};

// DONE First, test the mkmeta function to make sure the meta files are created correctly
// DONE Second, in archiveFiles the functions should only read files rather than create them
// TODO Third, in akasharender-epub remove the doMeta function and command
// TODO Fourth, is it possible to organize these around Classes that have Methods?

async function doMeta(config) {
    // console.log(`doMeta renderedFullPath ${config.renderedFullPath}`);
    // await fs.mkdirs(config.renderedFullPath);
    await fsp.mkdir(config.renderedFullPath, { recursive: true });

    await fsp.writeFile(path.join(config.renderedFullPath, "mimetype"), "application/epub+zip", 'utf8');

    let container_xml = path.join("META-INF", "container.xml");
    let container_xml_full = path.join(config.renderedFullPath, container_xml);
    // await fs.mkdirs(path.dirname(container_xml_full));
    await fsp.mkdir(path.dirname(container_xml_full), { recursive: true });
    let CONTAINERXML = await mkContainerXmlFile(config);
    await fsp.writeFile(container_xml_full, CONTAINERXML, 'utf8');

    const OPFXML = await opf.makeOpfXml(config);
    const OPFTXT = new xmldom.XMLSerializer().serializeToString(OPFXML);
    await fsp.writeFile(path.join(config.renderedFullPath, config.bookOPF), OPFTXT, 'utf8');

    if (config.doGenerateNCX) {
        const NCXXML = await opf.makeNCXXML(config);
        const ncx = new xmldom.XMLSerializer().serializeToString(NCXXML);
        await fsp.writeFile(path.join(config.renderedFullPath, config.sourceBookNCXHREF), ncx, 'utf8');
    }
}
module.exports.doMeta = doMeta;

async function doMkMetaCommand(configFN) {
    const bookConfig = await configurator.readConfig(configFN);
    await bookConfig.check();
    bookConfig.opfManifest = await manifest.from_fs(bookConfig);
    await module.exports.doMeta(bookConfig);
}
module.exports.doMkMetaCommand = doMkMetaCommand;
