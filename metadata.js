
const xmldom    = require('xmldom');
const fs        = require('fs-extra');
const path      = require('path');

exports.readContainerXml = async function(epubDir) {
    const data = await fs.readFile(
                    path.join(epubDir, "META-INF", "container.xml"), 
                    'utf8');
    return {
        containerXmlText: data,
        containerXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
    };
    
}

exports.findOpfFileName = function(containerXml) {
    var rootfiles = containerXml.getElementsByTagName("rootfile");
    // console.log(util.inspect(rootfile));
    var rootfile;
    for (var rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        var elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfile'.toUpperCase()) rootfile = elem;
    }
    if (!rootfile) throw new Error('No rootfile element in container.xml');
    return rootfile.getAttribute('full-path');
}

exports.readOPF = async function(epubDir, opfName) {
    const file2read = path.join(epubDir, opfName);
    console.log(`readOPF ${file2read}`);
    const data = await fs.readFile(file2read, 'utf8');
    return {
        opfXmlText: data,
        opfXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
    };
}
