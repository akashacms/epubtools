
const archiver  = require('archiver');
const xmldom    = require('xmldom');
const utils     = require('./utils');
const fs        = require('fs-extra');
const path      = require('path');
const globfs    = require('globfs');
const metadata  = require('./metadata');
const manifest  = require('./manifest');
const opf       = require('./opf');
const checkEPUB = require('./checkEPUB');
const akrender  = require('./renderEPUB');

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

            // The mimetype file must be the first entry, and must not be compressed
            // console.log(`reading ${path.join(rendered, "mimetype")} into archive`);
            archive.append(
                "application/epub+zip",
                { name: "mimetype", store: true });

            let container_xml = path.join("META-INF", "container.xml");
            archive.append(
                await mkContainerXmlFile(config),
                { name: container_xml });

            // Create the OPF and optionally NCX objects

            const OPFXML = await opf.makeOpfXml(config);
            archive.append(
                new xmldom.XMLSerializer().serializeToString(OPFXML),
                { name: opfFileName });

            if (config.doGenerateNCX) {
                const NCXXML = await opf.makeNCXXML(config);
                archive.append(
                    new xmldom.XMLSerializer().serializeToString(NCXXML),
                    { name: config.sourceBookNCXHREF });
            }
            
            // This reads from the generated OPF object we just created.
            // Previously this used opfXml that was read from the disk, but
            // we don't want to depend on an OPF file that exists in
            // the rendered output directory.  Instead we have a perfectly good
            // OPF that was just created.
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
