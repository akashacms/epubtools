
const util      = require('util');
const utils     = require('./utils');
const path      = require('path');
const xmldom    = require('xmldom');
const manifest  = require('./manifest');
const Manifest  = manifest.Manifest;

exports.findMetadataInOPF = function(OPFXML) {
    for (let elem of utils.nodeList2Array(
        OPFXML.getElementsByTagName("metadata")
    ).concat(
        utils.nodeList2Array(OPFXML.getElementsByTagName("opf:metadata"))
    )) {
        if (elem.nodeName.toUpperCase() === 'metadata'.toUpperCase()
         || elem.nodeName.toUpperCase() === 'opf:metadata'.toUpperCase()) {
            return elem;
        }
    }
};

exports.findManifestInOPF = function(OPFXML) {
    for (let elem of utils.nodeList2Array(
        OPFXML.getElementsByTagName("manifest")
    ).concat(
        utils.nodeList2Array(OPFXML.getElementsByTagName("opf:manifest"))
    )) {
        if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()
        || elem.nodeName.toUpperCase() === 'opf:manifest'.toUpperCase()) {
            return elem;
        }
    }
};

exports.findSpineInOPF = function(OPFXML) {
    var spine;
    for (let elem of utils.nodeList2Array(
        OPFXML.getElementsByTagName("spine")
    ).concat(
        utils.nodeList2Array(OPFXML.getElementsByTagName("opf:spine"))
    )) {
        if (elem.nodeName.toUpperCase() === 'spine'.toUpperCase()
        || elem.nodeName.toUpperCase() === 'opf:spine'.toUpperCase()) {
            return elem;
        }
    }
};

exports.refines = function(metadata, id) {
    const ret = [];
    for (let meta of utils.nodeListIterator(
        metadata.getElementsByTagName('meta')
    )) {
        let refines = meta.getAttribute('refines');
        if (refines && refines === `#${id}`) {
            ret.push(meta);
        }
    }
    return ret;
}

exports.titles = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (let title of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:title')
    )) {
        ret.push({
            id: title.getAttribute('id'),
            title: title.textContent
        });
    }
    for (let title of ret) {
        const refines = exports.refines(metadata, title.id);
        if (refines && refines.length > 0) {
            for (let refine of refines) {
                let property = refine.getAttribute('property');
                if (property === 'title-type') {
                    ret.titleType = refine.textContent;
                } else if (property === 'display-seq') {
                    ret.displaySequence = refine.textContent;
                } else if (property === 'file-as') {
                    ret.fileAs = refine.textContent;
                }
            }
        }
    }
    return ret;
};

exports.identifiers = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (let identifier of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:identifier')
    )) {
        let idIdentifier = identifier.getAttribute('id');
        let isUnique = idIdentifier && idIdentifier === 'epub-unique-identifier'
                ? true : false;
        let newIdentifier = {
            unique: isUnique,
            id: idIdentifier,
            string: identifier.textContent
        };

        if (idIdentifier) {
            let refines = exports.refines(metadata, idIdentifier);
            for (let refine of refines) {
                let prop = refine.getAttribute('property');
                if (prop === 'identifier-type') {
                    newIdentifier.identifierTypeScheme = refine.getAttribute('scheme');
                    newIdentifier.identifierType = refine.textContent;
                }
            }
        }

        ret.push(newIdentifier);
    }
    return ret;
};

exports.languages = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (let language of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:language')
    )) {
        ret.push({
            id: language.getAttribute('id'),
            langcode: language.textContent
        });
    }
    return ret;
};

exports.creators = function(OPFXML, tag) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (let creator of utils.nodeListIterator(
        metadata.getElementsByTagName(tag)
    )) {
        let item = {
            id: creator.getAttribute('id'),
            name: creator.textContent
        };
        if (item.id) {
            let refines = exports.refines(metadata, item.id);
            for (let refine of refines) {
                let property = refine.getAttribute('property');
                if (property && property === 'role') {
                    item.role = refine.textContent;
                    item.roleSchema = refine.getAttribute('schema');
                }
                if (property && property === 'file-as') {
                    item.fileAs = refine.textContent;
                }
            }
        }
        ret.push(item);
    }
    return ret;
};

exports.publicationDate = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let date of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:date')
    )) {
        return date.textContent;
    }
    return "";
};

exports.modifiedDate = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let meta of utils.nodeListIterator(
        metadata.getElementsByTagName('meta')
    )) {
        const property = meta.getAttribute('property');
        if (property && property === 'dcterms:modified') {
            return meta.textContent;
        }
    }
    return "";
};

exports.subjects = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (let subject of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:subject')
    )) {
        ret.push(subject.textContent);
    }
    return ret;
};

exports.description = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let description of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:description')
    )) {
        return description.textContent;
    }
    return "";
};

exports.format = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let format of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:format')
    )) {
        return format.textContent;
    }
    return "";
};

exports.publisher = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let publisher of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:publisher')
    )) {
        return publisher.textContent;
    }
    return "";
};

exports.relation = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let relation of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:relation')
    )) {
        return relation.textContent;
    }
    return "";
};

exports.coverage = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let coverage of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:coverage')
    )) {
        return coverage.textContent;
    }
    return "";
};

exports.rights = function(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (let rights of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:rights')
    )) {
        return rights.textContent;
    }
    return "";
};

exports.manifest = function(config, OPFXML) {
    const manifest = exports.findManifestInOPF(OPFXML);
    const ret = new Manifest();
    for (let item of utils.nodeList2Array(
        OPFXML.getElementsByTagName("item")
    ).concat(
        utils.nodeList2Array(OPFXML.getElementsByTagName("opf:item"))
    )) {
        let datum = {
            id: item.getAttribute('id'),
            mime: item.getAttribute('media-type'),
            mimeoverride: "",
            basedir: config.sourceBookroot,
            path: item.getAttribute('href'),
            dirname: path.dirname(item.getAttribute('href')),
            filename: path.basename(item.getAttribute('href')),
            suppressOPF: false,
            in_spine: false,
            spine_order: false
        };
        let properties = item.getAttribute('properties');
        if (properties && properties.indexOf('nav') >= 0) {
            datum.is_nav = true;
        } else {
            datum.is_nav = false;
        }
        if (properties && properties.indexOf('cover-image') >= 0) {
            datum.is_cover_image = true;
        } else {
            datum.is_cover_image = false;
        }
        if (properties && properties.indexOf('mathml') >= 0) {
            datum.is_mathml = true;
        } else {
            datum.is_mathml = false;
        }
        if (properties && properties.indexOf('scripted') >= 0) {
            datum.is_scripted = true;
        } else {
            datum.is_scripted = false;
        }
        if (properties && properties.indexOf('svg') >= 0) {
            datum.is_svg = true;
        } else {
            datum.is_svg = false;
        }
        if (properties && properties.indexOf('remote-resources') >= 0) {
            datum.is_remote_resources = true;
        } else {
            datum.is_remote_resources = false;
        }
        if (properties && properties.indexOf('switch') >= 0) {
            datum.is_switch = true;
        } else {
            datum.is_switch = false;
        }
        ret.addItem(datum);
    }
    // NOTE: This ignores the possibility of 'toc="NCX"'
    const spine = exports.findSpineInOPF(OPFXML);
    let spine_order = 0;
    for (let itemref of utils.nodeListIterator(
        spine.getElementsByTagName('itemref')
    )) {
        let idref = spine.getAttribute('idref');
        for (let datum of ret) {
            if (datum.id === idref) {
                datum.in_spine = true;
                datum.spine_order = spine_order++;
                let linear = spine.getAttribute('linear');
                if (linear && linear === 'no') {
                    datum.linear = 'no';
                }
            }
        }
    }
    return ret;
};

// exports.makeOpfXml = async function(bookYaml, manifest, opfspine) {

exports.makeOpfXml = async function(config) {
    
    // TODO this will require different templates for EPUB versions

    var OPFXML = new xmldom.DOMParser().parseFromString(
        `<?xml version="1.0" encoding="utf-8" standalone="no"?>
        <package
                xmlns="http://www.idpf.org/2007/opf" 
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:dcterms="http://purl.org/dc/terms/" 
                version="3.0"
                unique-identifier="epub-unique-identifier">
            <metadata> </metadata>
            <manifest> </manifest>
            <spine>    </spine>
        </package>
        `, 'text/xml');
        
    const metadata = exports.findMetadataInOPF(OPFXML);
    const manifestElem = exports.findManifestInOPF(OPFXML);
    var spine = exports.findSpineInOPF(OPFXML);
    var elem;
        
    // Check for required parameters
    if (typeof config.bookMetaTitle === 'undefined'
     || config.bookMetaTitle === null) {
        throw new Error('no title');
    }
    if (typeof config.bookMetaPubLanguage === 'undefined'
     || config.bookMetaPubLanguage === null) {
        throw new Error('no pubLanguage');
    }
    if (typeof config.published.date == 'undefined' // TODO
     || config.published.date === null) {
        throw new Error('no dates');
    }

    // Identifiers
    if (typeof config.bookMetaIdentifiers !== 'undefined'
     && config.bookMetaIdentifiers !== null) {
        for (let identifier of config.bookMetaIdentifiers) {
            
            elem = OPFXML.createElementNS(
                    'http://purl.org/dc/elements/1.1/', 
                    'dc:identifier');
            if (typeof identifier.unique !== 'undefined'
             && identifier.unique !== null) {
                elem.setAttribute('id', 'epub-unique-identifier');
            }
            if (typeof identifier.type && identifier.type === "urn") {
                elem.appendChild(OPFXML.createTextNode(identifier.string));
                metadata.appendChild(elem);
            } else if (typeof identifier.type && identifier.type === "isbn") {
                elem.appendChild(
                        OPFXML.createTextNode(`urn:isbn:${identifier.string}`));
                metadata.appendChild(elem);
            } else if (typeof identifier.type && identifier.type === "uuid") {
                elem.appendChild(
                        OPFXML.createTextNode(`urn:uuid:${identifier.string}`));
                metadata.appendChild(elem);
            } else {
                throw new Error(`identifier with no type ${util.inspect(identifier)}`);
            }
            // TODO Format for other ID formats like ISBN

            if (identifier.identifierType && identifier.identifierTypeScheme) {
                elem = OPFXML.createElementNS(
                    'http://purl.org/dc/elements/1.1/',
                    'meta');
                elem.setAttribute('refines', `#${identifier.id}`);
                elem.setAttribute('property', 'identifier-type');
                elem.setAttribute('scheme', identifier.identifierTypeScheme);
                elem.appendChild(OPFXML.createTextNode(identifier.identifierType));
                metadata.appendChild(elem);
            }
        }
    }
    
    // <dc:source><%= source %></dc:source>
    if (config.bookMetaSourceType && config.bookMetaSourceID) {
        elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", 'dc:source');
        if (config.bookMetaSourceType === "urn") {
            elem.appendChild(OPFXML.createTextNode(config.bookMetaSourceID));
            metadata.appendChild(elem);
        } else if (config.bookMetaSourceType === "isbn") {
            elem.appendChild(
                    OPFXML.createTextNode(`urn:isbn:${config.bookMetaSourceID}`));
            metadata.appendChild(elem);
        } else if (config.bookMetaSourceType === "uuid") {
            elem.appendChild(
                    OPFXML.createTextNode(`urn:uuid:${config.bookMetaSourceID}`));
            metadata.appendChild(elem);
        } else {
            throw new Error(`bookMetaSourceType with no type ${util.inspect(config.bookMetaSourceType)}`);
        }
    }
    
    // Book title
    // <dc:title id="pub-title"><%= title %></dc:title>


    if (typeof config.bookMetaTitles !== undefined
     && config.bookMetaTitles) {
        for (let title of config.bookMetaTitles) {
            elem = OPFXML.createElementNS(
                    'http://purl.org/dc/elements/1.1/',
                    'dc:title');
            elem.setAttribute('id', title.id);
            elem.appendChild(OPFXML.createTextNode(title.title));
            metadata.appendChild(elem);
            if (title.titleType) {
                elem = OPFXML.createElementNS(
                        'http://purl.org/dc/elements/1.1/',
                        'meta');
                elem.setAttribute('refines', `#${title.id}`);
                elem.setAttribute('property', 'title-type');
                elem.appendChild(OPFXML.createTextNode(title.titleType));
                metadata.appendChild(elem);
            }
            if (title.displaySequence) {
                elem = OPFXML.createElementNS(
                        'http://purl.org/dc/elements/1.1/',
                        'meta');
                elem.setAttribute('refines', `#${title.id}`);
                elem.setAttribute('property', 'display-seq');
                elem.appendChild(OPFXML.createTextNode(title.displaySequence));
                metadata.appendChild(elem);
            }
            if (title.fileAs) {
                elem = OPFXML.createElementNS(
                        'http://purl.org/dc/elements/1.1/',
                        'meta');
                elem.setAttribute('refines', `#${title.id}`);
                elem.setAttribute('property', 'file-as');
                elem.appendChild(OPFXML.createTextNode(title.fileAs));
                metadata.appendChild(elem);
            }
        }
    }

    // Book languages
    // <dc:language><%= language %></dc:language>
    // 
    // In this design there will be a primary language, 
    // called bookMetaPubLanguage, and then an array of additional
    // languages, called bookMetaOtherLanguages
    //
    if (typeof config.bookMetaPubLanguage !== undefined
     && config.bookMetaPubLanguage) {
        for (let language of config.bookMetaPubLanguage) {
            elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:language');
            if (language.id) {
                elem.setAttribute('id', language.id);
            }
            elem.appendChild(OPFXML.createTextNode(language.langcode));
            metadata.appendChild(elem);
        }
    }

    // <dc:creator id="<%= creator.id %>"<%
    //        %> ><%= creator.name %></dc:creator><%
    //        if (creator.role) { %>
    //            <meta refines="#<%= creator.id %>" property="role" scheme="marc:relators"><%= creator.role %></meta>
    //        <% }

    const mkCreatorContributor = function(OPFXML, tag, obj) {
        const elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", tag);
        elem.setAttribute('id', obj.id);
        elem.appendChild(OPFXML.createTextNode(obj.name));
        // <meta refines="#<%= creator.id %>" property="role" scheme="marc:relators"><%= creator.role %></meta>
        if (obj.role) {
            var metaelem = OPFXML.createElement('meta');
            metaelem.setAttribute('refines', "#"+ obj.id);
            metaelem.setAttribute('property', "role");
            metaelem.setAttribute('schema', "marc:relators");
            metaelem.appendChild(OPFXML.createTextNode(obj.role));
            elem.appendChild(metaelem);
        }
        if (obj.fileAs) {
            var metaelem = OPFXML.createElement('meta');
            metaelem.setAttribute('refines', "#"+ obj.id);
            metaelem.setAttribute('property', "file-as");
            metaelem.appendChild(OPFXML.createTextNode(obj.fileAs));
            elem.appendChild(metaelem);
        }
        return elem;
    };

    if (config.bookMetaCreators) {
        for (let creator of config.bookMetaCreators) {
            elem = mkCreatorContributor(OPFXML, 'dc:creator', creator);
            metadata.appendChild(elem);
        }
    }
    
    // <dc:contributor id="<%= contributor.id %>"<%
    //        if (contributor.fileAs) { %> opf:file-as="<%= contributor.fileAs %>"<% }
    //        if (contributor.role) { %> opf:role="<%= contributor.role %>"<% }
    //        %> ><%= contributor.name %></dc:contributor>
    if (config.bookMetaContributors) {
        for (let contributor of config.bookMetaContributors) {
            elem = mkCreatorContributor(OPFXML, 'dc:contributor', contributor);
            metadata.appendChild(elem);
        }
    }
    
    // <dc:date><%= date %></dc:date>
    if (typeof config.bookMetaPublicationDate !== 'undefined'
     && config.bookMetaPublicationDate) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'dc:date');
        let date = utils.w3cdate(new Date(config.bookMetaPublicationDate));
        elem.appendChild(OPFXML.createTextNode(date));
        metadata.appendChild(elem);
    }
    
    // <dc:subject><%= subject %></dc:subject>
    for (let subject of config.bookMetaSubjects) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'dc:subject');
        elem.appendChild(OPFXML.createTextNode(subject));
        metadata.appendChild(elem);
    }
    
    // <dc:description><%= description %></dc:description>
    if (typeof config.bookMetaDescription !== 'undefined' 
     && config.bookMetaDescription) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'description');
        elem.appendChild(OPFXML.createTextNode(config.description));
        metadata.appendChild(elem);
    }
    
    // <meta property="dcterms:modified"><%= modified %>
    if (typeof config.bookMetaModifiedDate !== 'undefined'
     && config.bookMetaModifiedDate) {
        elem = OPFXML.createElement('meta');
        elem.setAttribute('property', "dcterms:modified");
        let mdate = new Date(config.bookMetaModifiedDate);
        if (mdate) {
            let date = w3cdate(mdate);
            elem.appendChild(OPFXML.createTextNode(date));
            metadata.appendChild(elem);
        }
    }
    
    // <dc:format><%= format %></dc:format>
    if (typeof config.bookMetaFormat !== 'undefined'
     && config.bookMetaFormat) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'dc:format');
        elem.appendChild(OPFXML.createTextNode(config.bookMetaFormat));
        metadata.appendChild(elem);
    }
    
    // <dc:publisher><%= publisher %></dc:publisher>
    if (typeof config.bookMetaPublisher !== 'undefined'
     && config.bookMetaPublisher) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:publisher');
        elem.appendChild(OPFXML.createTextNode(config.bookMetaPublisher));
        metadata.appendChild(elem);
    }
    
    // <dc:relation><%= relation %></dc:relation>
    if (typeof config.bookMetaRelation !== 'undefined'
     && config.bookMetaRelation) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:relation');
        elem.appendChild(OPFXML.createTextNode(config.bookMetaRelation));
        metadata.appendChild(elem);
    }
    
    // <dc:coverage><%= coverage %></dc:coverage>
    if (typeof config.bookMetaCoverage !== 'undefined'
     && config.bookMetaCoverage) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:coverage');
        elem.appendChild(OPFXML.createTextNode(config.bookMetaCoverage));
        metadata.appendChild(elem);
    }
    
    // <dc:rights><%= rights %></dc:rights>
    if (typeof config.bookMetaRights !== 'undefined'
     && config.bookMetaRights) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:rights');
        elem.appendChild(OPFXML.createTextNode(config.bookMetaRights));
        metadata.appendChild(elem);
    }
    
    // <item id="<%= item.id %>" <%
    //    if (item.properties) { %> properties="<%= item.properties %>" <% }
    //   %>href="<%= item.href %>" media-type="<%= item.type %>"/>

    const set_property = function(item, value) {
        let properties = item.getAttribute('properties');
        if (!properties) properties = "";
        if (properties === "") properties = value;
        else properties += ' ' + value;
        item.setAttribute('properties', properties);
    }

    var spine = [];
    for (let item of config.manifest) {
        if (item.in_spine) spine.push(item);
        elem = OPFXML.createElement('item');
        elem.setAttribute('id', item.id);
        if (item.is_nav) set_property(item, 'nav');
        if (item.is_cover_image) set_property(item, 'cover-image');
        if (item.is_mathml) set_property(item, 'mathml');
        if (item.is_scripted) set_property(item, 'scripted');
        if (item.is_svg) set_property(item, 'svg');
        if (item.is_remote_resources) set_property(item, 'remote-resources');
        if (item.is_switch) set_property(item, 'switch');
        elem.setAttribute('href', item.href);
        elem.setAttribute('media-type', item.type);
        manifestElem.appendChild(elem);
    }
    
    // if (bookYaml.ncx.id) { spine.setAttribute('toc', bookYaml.ncx.id); }
    
    // <itemref idref="<%= item.idref %>" <%
    //    if (item.linear) { %>linear="<%= item.linear %>" <% }
    //    %> /> <%
    spine = spine.sort((a, b) => {
        if (a.spine_order < b.spine_order) return -1;
        else if (a.spine_order === b.spine_order) return 0;
        else return 1;
    });
    for (let itemref of spine) {
        elem = OPFXML.createElement('itemref');
        elem.setAttribute('idref', itemref.idref);
        if (itemref.linear) { elem.setAttribute('linear', itemref.linear); }
        spine.appendChild(elem);
    }
    
    return OPFXML;
}
