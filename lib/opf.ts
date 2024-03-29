
import util from 'node:util';
import path from 'node:path';
import { promises as fsp /*, default as fs */ } from 'node:fs';
import * as utils from './utils.js';
import xmldom from '@xmldom/xmldom';
import { Manifest, ManifestItem, tocData as manifest_tocData } from './manifest';
import { Configuration } from './Configuration.js';

export function findMetadataInOPF(OPFXML) {
    for (const elem of utils.nodeList2Array(OPFXML.getElementsByTagName("metadata")).concat(utils.nodeList2Array(OPFXML.getElementsByTagName("opf:metadata")))) {
        if (elem.nodeName.toUpperCase() === 'metadata'.toUpperCase()
         || elem.nodeName.toUpperCase() === 'opf:metadata'.toUpperCase()) {
            return elem;
        }
    }
    return undefined;
}

export function findManifestInOPF(OPFXML) {
    for (const elem of utils.nodeList2Array(OPFXML.getElementsByTagName("manifest")).concat(utils.nodeList2Array(OPFXML.getElementsByTagName("opf:manifest")))) {
        if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()
        || elem.nodeName.toUpperCase() === 'opf:manifest'.toUpperCase()) {
            return elem;
        }
    }
    return undefined;
}

export function findSpineInOPF(OPFXML) {
    for (const elem of utils.nodeList2Array(OPFXML.getElementsByTagName("spine")).concat(utils.nodeList2Array(OPFXML.getElementsByTagName("opf:spine")))) {
        if (elem.nodeName.toUpperCase() === 'spine'.toUpperCase()
        || elem.nodeName.toUpperCase() === 'opf:spine'.toUpperCase()) {
            return elem;
        }
    }
    return undefined;
}

export function refines(metadata, id) {
    const ret = [];
    for (const meta of utils.nodeList2Array(metadata.getElementsByTagName("meta")).concat(utils.nodeList2Array(metadata.getElementsByTagName("opf:meta")))) {
        const refines = meta.getAttribute('refines');
        if (refines && refines === `#${id}`) {
            ret.push(meta);
        }
    }
    return ret;
}

export function titles(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (const title of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:title')
    )) {
        ret.push({
            id: title.getAttribute('id'),
            title: title.textContent
        });
    }
    for (const title of ret) {
        const refines = exports.refines(metadata, title.id);
        if (refines && refines.length > 0) {
            for (const refine of refines) {
                const property = refine.getAttribute('property');
                if (property === 'title-type') {
                    title.titleType = refine.textContent;
                } else if (property === 'display-seq') {
                    title.displaySequence = refine.textContent;
                } else if (property === 'file-as') {
                    title.fileAs = refine.textContent;
                }
            }
        }
    }
    return ret;
}

export function identifiers(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    // Get the ID indicating Unique Identifier
    const uniqueIDname = OPFXML.documentElement.getAttribute('unique-identifier');
    const ret = [];
    for (const identifier of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:identifier')
    )) {
        const idIdentifier = identifier.getAttribute('id');
        // Properly match that this is the Unique Identifier
        const isUnique = idIdentifier && idIdentifier === uniqueIDname
                ? true : false;
        const newIdentifier = {
            id: undefined,
            type: undefined,
            unique: isUnique,
            string: identifier.textContent,
            identifierTypeScheme: undefined,
            identifierType: undefined
        };
        if (idIdentifier && idIdentifier !== '') {
            newIdentifier.id = idIdentifier;
        }

        // remove prefixes from identifier for identified types 
        if (newIdentifier.string.indexOf('urn:isbn:') === 0) {
            newIdentifier.type = 'isbn';
            newIdentifier.string = newIdentifier.string.slice('urn:isbn:'.length);
        } else if (newIdentifier.string.indexOf('urn:uuid:') === 0) {
            newIdentifier.type = 'uuid';
            newIdentifier.string = newIdentifier.string.slice('urn:uuid:'.length);
        } else if (newIdentifier.string.indexOf('urn:') === 0) {
            newIdentifier.type = 'urn';
        }

        if (idIdentifier) {
            const refines = exports.refines(metadata, idIdentifier);
            for (const refine of refines) {
                const prop = refine.getAttribute('property');
                if (prop === 'identifier-type') {
                    newIdentifier.identifierTypeScheme = refine.getAttribute('scheme');
                    newIdentifier.identifierType = refine.textContent;
                }
            }
        }

        ret.push(newIdentifier);
    }
    // console.log(`identifiers ${util.inspect(ret)}`);
    return ret;
}

export function languages(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (const language of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:language')
    )) {
        ret.push({
            id: language.getAttribute('id'),
            langcode: language.textContent
        });
    }
    return ret;
}

export function creators(OPFXML, tag) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (const creator of utils.nodeListIterator(
        metadata.getElementsByTagName(tag)
    )) {
        let theID = creator.getAttribute('id');
        if (!theID || theID === '') {
            theID = undefined;
        }
        const item = {
            id: undefined,
            name: creator.textContent,
            role: undefined,
            roleSchema: undefined,
            fileAs: undefined

        };
        if (theID) item.id = theID;
        if (item.id) {
            const refines = exports.refines(metadata, item.id);
            for (const refine of refines) {
                const property = refine.getAttribute('property');
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
}

export function publicationDate(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const date of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:date')
    )) {
        return date.textContent;
    }
    return "";
}

export function modifiedDate(OPFXML) {
    // const metadata = exports.findMetadataInOPF(OPFXML);
    for (const meta of utils.nodeList2Array(OPFXML.getElementsByTagName("meta"))
        .concat(utils.nodeList2Array(OPFXML.getElementsByTagName("opf:meta")))) {
        const property = meta.getAttribute('property');
        if (property && property === 'dcterms:modified') {
            return meta.textContent;
        }
    }
    return "";
}

export function subjects(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    const ret = [];
    for (const subject of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:subject')
    )) {
        ret.push(subject.textContent);
    }
    return ret;
}

export function description(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const description of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:description')
    )) {
        return description.textContent;
    }
    return "";
}

export function format(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const format of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:format')
    )) {
        return format.textContent;
    }
    return "";
}

export function publisher(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const publisher of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:publisher')
    )) {
        return publisher.textContent;
    }
    return "";
}

export function relation(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const relation of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:relation')
    )) {
        return relation.textContent;
    }
    return "";
}

export function coverage(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const coverage of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:coverage')
    )) {
        return coverage.textContent;
    }
    return "";
}

export function rights(OPFXML) {
    const metadata = exports.findMetadataInOPF(OPFXML);
    for (const rights of utils.nodeListIterator(
        metadata.getElementsByTagName('dc:rights')
    )) {
        return rights.textContent;
    }
    return "";
}

export function manifest(config, OPFXML) {
    const manifest = exports.findManifestInOPF(OPFXML);
    const ret = new Manifest([]);
    for (const item of utils.nodeList2Array(manifest.getElementsByTagName("item"))
        .concat(utils.nodeList2Array(manifest.getElementsByTagName("opf:item")))) {
        const datum = new ManifestItem({
            id: item.getAttribute('id'),
            mime: item.getAttribute('media-type'),
            mimeoverride: "",
            basedir: config.renderedFullPath,
            path: item.getAttribute('href'),
            dirname: path.dirname(item.getAttribute('href')),
            filename: path.basename(item.getAttribute('href')),
            suppressOPF: false,
            in_spine: false,
            spine_order: false
        });
        const properties = item.getAttribute('properties');
        if (properties) datum.properties = properties;
        if (properties && properties.indexOf('nav') >= 0) {
            datum.is_nav = true;
            config.sourceBookTOCID = datum.id;
            config.sourceBookTOCHREF = datum.path;
        } else {
            datum.is_nav = false;
        }
        if (properties && properties.indexOf('cover-image') >= 0) {
            datum.is_cover_image = true;
            config.sourceBookCoverID = datum.id;
            config.sourceBookCoverHREF = datum.path;
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
    for (const itemref of utils.nodeListIterator(spine.getElementsByTagName('itemref'))) {
        const idref = itemref.getAttribute('idref');
        for (const datum of ret) {
            if (datum.id === idref) {
                datum.in_spine = true;
                datum.spine_order = spine_order++;
                const linear = spine.getAttribute('linear');
                if (linear && linear === 'no') {
                    datum.linear = 'no';
                } else if (linear && linear === 'yes') {
                    datum.linear = 'yes';
                }
            }
        }
    }
    return ret;
}

export async function readOpf(opfFN) {
    const opfTXT = await fsp.readFile(opfFN, 'utf8');
    const OPFXML = new xmldom.DOMParser().parseFromString(opfTXT);
    return OPFXML;
}

// exports.makeOpfXml = async function(bookYaml, manifest, opfspine) {

export async function makeOpfXml(config) {
    
    // TODO this will require different templates for EPUB versions

    const uniqueIDname = "epub-unique-identifier";
    const OPFXML = new xmldom.DOMParser().parseFromString(
        `<?xml version="1.0" encoding="utf-8" standalone="no"?>
        <package
                xmlns="http://www.idpf.org/2007/opf" 
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:dcterms="http://purl.org/dc/terms/" 
                version="3.0"
                unique-identifier="${uniqueIDname}">
            <metadata> </metadata>
            <manifest> </manifest>
            <spine>    </spine>
        </package>
        `, 'text/xml');
        
    const metadata = exports.findMetadataInOPF(OPFXML);
    const manifestElem = exports.findManifestInOPF(OPFXML);
    const spine = exports.findSpineInOPF(OPFXML);
    let elem;
    
    // Check for required parameters
    if (typeof config.opfTitles === 'undefined'
     || config.opfTitles === null
     || config.opfTitles.length <= 0) {
        throw new Error('no title');
    }
    if (typeof config.opfLanguages === 'undefined'
     || config.opfLanguages === null) {
        throw new Error('no pubLanguage');
    }
    if (typeof config.opfPublicationDate == 'undefined' // TODO
     || config.opfPublicationDate === null) {
        throw new Error('no dates');
    }

    // Identifiers
    if (typeof config.opfIdentifiers !== 'undefined'
     && config.opfIdentifiers !== null) {
        for (const identifier of config.opfIdentifiers) {

            // console.log(`opfIdentifiers identifier ${util.inspect(identifier)}`);
            
            elem = OPFXML.createElementNS(
                    'http://purl.org/dc/elements/1.1/', 
                    'dc:identifier');
            if (typeof identifier.unique !== 'undefined'
             && identifier.unique !== null) {
                elem.setAttribute('id', uniqueIDname);
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


    if (typeof config.opfTitles !== undefined
     && config.opfTitles) {
        let titleNum = 0;
        for (const title of config.opfTitles) {
            elem = OPFXML.createElementNS(
                    'http://purl.org/dc/elements/1.1/',
                    'dc:title');
            if (title.id && title.id !== '') elem.setAttribute('id', title.id);
            else elem.setAttribute('id', `title${titleNum++}`);
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
    if (typeof config.opfLanguages !== undefined
     && config.opfLanguages) {
        for (const language of config.opfLanguages) {
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

    let creatorNum = 0;

    const mkCreatorContributor = function(OPFXML, parent, tag, obj) {
        const elem = OPFXML.createElementNS("http://purl.org/dc/elements/1.1/", tag);
        if (!obj.id || obj.id === '') obj.id = `creator${creatorNum++}`;
        elem.setAttribute('id', obj.id);
        elem.appendChild(OPFXML.createTextNode(obj.name));
        // <meta refines="#<%= creator.id %>" property="role" scheme="marc:relators"><%= creator.role %></meta>
        const metaelem = OPFXML.createElement('meta');
        if (obj.role) {
            metaelem.setAttribute('refines', "#"+ obj.id);
            metaelem.setAttribute('property', "role");
            // This attribute is shown in Tools For Change, but
            // EPUBCheck complains if it is present.
            // metaelem.setAttribute('schema', "marc:relators");
            metaelem.appendChild(OPFXML.createTextNode(obj.role));
            parent.appendChild(metaelem);
        }
        if (obj.fileAs) {
            metaelem.setAttribute('refines', "#"+ obj.id);
            metaelem.setAttribute('property', "file-as");
            metaelem.appendChild(OPFXML.createTextNode(obj.fileAs));
            parent.appendChild(metaelem);
        }
        return elem;
    };

    if (config.opfCreators) {
        for (const creator of config.opfCreators) {
            elem = mkCreatorContributor(OPFXML, metadata, 'dc:creator', creator);
            metadata.appendChild(elem);
        }
    }
    
    // <dc:contributor id="<%= contributor.id %>"<%
    //        if (contributor.fileAs) { %> opf:file-as="<%= contributor.fileAs %>"<% }
    //        if (contributor.role) { %> opf:role="<%= contributor.role %>"<% }
    //        %> ><%= contributor.name %></dc:contributor>
    if (config.opfContributors) {
        for (const contributor of config.opfContributors) {
            elem = mkCreatorContributor(OPFXML, metadata, 'dc:contributor', contributor);
            metadata.appendChild(elem);
        }
    }
    
    // <dc:date><%= date %></dc:date>
    if (typeof config.opfPublicationDate !== 'undefined'
     && config.opfPublicationDate) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'dc:date');
        const date = utils.w3cdate(new Date(config.opfPublicationDate));
        elem.appendChild(OPFXML.createTextNode(date));
        metadata.appendChild(elem);
    }

    // <dc:subject><%= subject %></dc:subject>
    for (const subject of config.opfSubjects) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'dc:subject');
        elem.appendChild(OPFXML.createTextNode(subject));
        metadata.appendChild(elem);
    }
    
    // <dc:description><%= description %></dc:description>
    if (typeof config.opfDescription !== 'undefined' 
     && config.opfDescription) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'description');
        elem.appendChild(OPFXML.createTextNode(config.description));
        metadata.appendChild(elem);
    }
    
    // <meta property="dcterms:modified"><%= modified %>
    if (typeof config.opfModifiedDate !== 'undefined'
     && config.opfModifiedDate) {
        elem = OPFXML.createElement('meta');
        elem.setAttribute('property', "dcterms:modified");
        const mdate = new Date(config.opfModifiedDate);
        if (mdate) {
            const date = utils.w3cdate(mdate);
            elem.appendChild(OPFXML.createTextNode(date));
            metadata.appendChild(elem);
        }
    }
    
    // <dc:format><%= format %></dc:format>
    if (typeof config.opfFormat !== 'undefined'
     && config.opfFormat) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/',
                'dc:format');
        elem.appendChild(OPFXML.createTextNode(config.opfFormat));
        metadata.appendChild(elem);
    }
    
    // <dc:publisher><%= publisher %></dc:publisher>
    if (typeof config.opfPublisher !== 'undefined'
     && config.opfPublisher) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:publisher');
        elem.appendChild(OPFXML.createTextNode(config.opfPublisher));
        metadata.appendChild(elem);
    }
    
    // <dc:relation><%= relation %></dc:relation>
    if (typeof config.opfRelation !== 'undefined'
     && config.opfRelation) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:relation');
        elem.appendChild(OPFXML.createTextNode(config.opfRelation));
        metadata.appendChild(elem);
    }
    
    // <dc:coverage><%= coverage %></dc:coverage>
    if (typeof config.opfCoverage !== 'undefined'
     && config.opfCoverage) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:coverage');
        elem.appendChild(OPFXML.createTextNode(config.opfCoverage));
        metadata.appendChild(elem);
    }
    
    // <dc:rights><%= rights %></dc:rights>
    if (typeof config.opfRights !== 'undefined'
     && config.opfRights) {
        elem = OPFXML.createElementNS(
                'http://purl.org/dc/elements/1.1/', 
                'dc:rights');
        elem.appendChild(OPFXML.createTextNode(config.opfRights));
        metadata.appendChild(elem);
    }
    
    // <item id="<%= item.id %>" <%
    //    if (item.properties) { %> properties="<%= item.properties %>" <% }
    //   %>href="<%= item.href %>" media-type="<%= item.type %>"/>


    // console.log(config);

    let spineitems = [];
    let sawNCX = false;
    for (const item of config.opfManifest) {

        const fullRoot = config.renderedFullPath;
        const fullOpfPath  = path.dirname(path.join(fullRoot, config.bookOPF));
        const fullItemPath = path.join(fullRoot, item.path);
        const relativeItemPath = path.relative(fullOpfPath, fullItemPath);

        // console.log(`makeOpfXml item.path ${item.path} fullItemPath ${fullItemPath} relativeItemPath ${relativeItemPath}`)

        let properties = '';

        const set_property = (value) => {
            if (!properties) properties = "";
            if (properties === "") properties = value;
            else properties += ' ' + value;
        }

        if (item.in_spine) spineitems.push(item);
        const elem = OPFXML.createElement('item');
        if (config.doGenerateNCX && relativeItemPath === config.sourceBookNCXHREF) {
            sawNCX = true;
            elem.setAttribute('id', config.sourceBookNCXID);
        } else {
            elem.setAttribute('id', item.id);
        }
        if (item.is_nav) set_property('nav');
        if (item.is_cover_image) set_property('cover-image');
        if (item.is_mathml) set_property('mathml');
        if (item.is_scripted) set_property('scripted');
        if (item.is_svg) set_property('svg');
        if (item.is_remote_resources) set_property('remote-resources');
        if (item.is_switch) set_property('switch');
        if (properties !== '') elem.setAttribute('properties', properties);
        elem.setAttribute('href', relativeItemPath);
        if (config.doGenerateNCX && relativeItemPath === config.sourceBookNCXHREF) {
            elem.setAttribute('media-type', 'application/x-dtbncx+xml');
        } else {
            elem.setAttribute('media-type', item.mime);
        }
        manifestElem.appendChild(elem);
    }

    // Patch in the NCX if it's supposed to be there
    if (config.doGenerateNCX && !sawNCX) {
        const elem = OPFXML.createElement('item');
        elem.setAttribute('id', config.sourceBookNCXID);
        const fullRoot = config.renderedFullPath;
        const fullOpfPath  = path.dirname(path.join(fullRoot, config.bookOPF));
        const fullItemPath = path.join(fullRoot, config.sourceBookNCXHREF);
        const relativeItemPath = path.relative(fullOpfPath, fullItemPath);
        elem.setAttribute('href', relativeItemPath);
        elem.setAttribute('media-type', 'application/x-dtbncx+xml');
        manifestElem.appendChild(elem);
    }

    // If we're supposed to generate an NCX, at this point what we do is
    // add NCX entries to the OPF
    if (config.doGenerateNCX) {
        /* let elem = OPFXML.createElement('item');
        elem.setAttribute('id', config.sourceBookNCXID);
        elem.setAttribute('href', config.sourceBookNCXHREF);
        elem.setAttribute('media-type', 'application/x-dtbncx+xml');
        manifestElem.appendChild(elem); */
        spine.setAttribute('toc', config.sourceBookNCXID);
    }
    
    // <itemref idref="<%= item.idref %>" <%
    //    if (item.linear) { %>linear="<%= item.linear %>" <% }
    //    %> /> <%
    spineitems = spineitems.sort((a, b) => {
        if (a.spine_order < b.spine_order) return -1;
        else if (a.spine_order === b.spine_order) return 0;
        else return 1;
    });
    for (const itemref of spineitems) {
        // console.log(`spine item ${util.inspect(itemref)}`);
        const elem = OPFXML.createElement('itemref');
        elem.setAttribute('idref', itemref.id);
        if (itemref.linear) { elem.setAttribute('linear', itemref.linear); }
        spine.appendChild(elem);
    }
    
    return OPFXML;
}

export async function readTocNCX(tocncxFN) {
    const tocncxTXT = await fsp.readFile(tocncxFN, 'utf8');
    const NCXXML = new xmldom.DOMParser().parseFromString(tocncxTXT);
    return NCXXML;
}

export async function makeNCXXML(config: Configuration) {

    const NCXXML = new xmldom.DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?> \
    <ncx version="2005-1" xml:lang="en" xmlns="http://www.daisy.org/z3986/2005/ncx/"> \
      <head> </head> \
      <docTitle> <text></text> </docTitle> \
      <docAuthor> <text></text> </docAuthor> \
      <navMap> </navMap> \
    </ncx>', 'text/xml');
    
    let headElem;
    let docTitleElem;
    let docTitleText;
    let docAuthorElem;
    let docAuthorText;
    let navMapElem;
    let elem;

    const heads = NCXXML.getElementsByTagName("head");
    // util.log(util.inspect(rootfile));
    for (const elem of utils.nodeListIterator(heads)) {
        if (elem.nodeName.toUpperCase() === 'head'.toUpperCase()) headElem = elem;
    }
    
    const docTitles = NCXXML.getElementsByTagName("docTitle");
    // util.log(util.inspect(rootfile));
    for (const elem of utils.nodeListIterator(docTitles)) {
        if (elem.nodeName.toUpperCase() === 'docTitle'.toUpperCase()) docTitleElem = elem;
    }
    const docTitleTexts = docTitleElem.getElementsByTagName("text");
    for (const elem of utils.nodeListIterator(docTitleTexts)) {
        if (elem.nodeName.toUpperCase() === 'text'.toUpperCase()) docTitleText = elem;
    }
    
    const docAuthors = NCXXML.getElementsByTagName("docAuthor");
    // util.log(util.inspect(rootfile));
    for (const elem of utils.nodeListIterator(docAuthors)) {
        if (elem.nodeName.toUpperCase() === 'docAuthor'.toUpperCase()) docAuthorElem = elem;
    }
    const docAuthorTexts = docAuthorElem.getElementsByTagName("text");
    for (const elem of utils.nodeListIterator(docAuthorTexts)) {
        if (elem.nodeName.toUpperCase() === 'text'.toUpperCase()) docAuthorText = elem;
    }
    
    const navMaps = NCXXML.getElementsByTagName("navMap");
    // util.log(util.inspect(rootfile));
    for (const elem of utils.nodeListIterator(navMaps)) {
        if (elem.nodeName.toUpperCase() === 'navMap'.toUpperCase()) navMapElem = elem;
    }
    

    let uniqueID;
    config.opfIdentifiers.forEach(function(identifier) {
        if (typeof identifier.unique !== 'undefined' && identifier.unique !== null) uniqueID = identifier;
    });
    if (!uniqueID) throw new Error("No Identifier");
    
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
        if (typeof uniqueID.type && uniqueID.type === "urn") {
            elem.setAttribute('content', uniqueID.string);
        } else if (typeof uniqueID.type && uniqueID.type === "isbn") {
            elem.setAttribute('content', `urn:isbn:${uniqueID.string}`);
        } else if (typeof uniqueID.type && uniqueID.type === "uuid") {
            elem.setAttribute('content', `urn:uuid:${uniqueID.string}`);
        } else {
            throw new Error(`identifier with no type ${util.inspect(uniqueID)}`);
        }
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
    
    let sawTitle = false;
    for (const title of config.opfTitles) {
        if (title.type === "main") {
            docTitleText.appendChild(NCXXML.createTextNode(title.title));
            sawTitle = true;
        }
    }
    if (!sawTitle) {
        throw new Error(`makeNCXXML saw no "main" title in ${util.inspect(config.opfTitles)}`);
    }
    if (config.opfCreators.length <= 0) {
        throw new Error(`makeNCXXML no creators in ${util.inspect(config.opfCreators)}`);
    }
    if (config.opfCreators[0].name || config.opfCreators[0].nameReversed) {
        docAuthorText.appendChild(NCXXML.createTextNode(
            config.opfCreators[0].nameReversed
            ? config.opfCreators[0].nameReversed
            : config.opfCreators[0].name));
    }

    const tocdata = await manifest_tocData(config);

    // console.log(tocdata);

    let spineorder = 0;
    const navPointForChapter = function(chapter) {
        const navPoint = NCXXML.createElement('navPoint');
        navPoint.setAttribute('class', 'book');
        navPoint.setAttribute('id', chapter.id);
        navPoint.setAttribute('playOrder', spineorder.toString());
        spineorder++;
        
        const navLabel = NCXXML.createElement('navLabel');
        const navLabelText = NCXXML.createElement('text');
        navLabelText.appendChild(NCXXML.createTextNode(chapter.text));
        navLabel.appendChild(navLabelText);
        navPoint.appendChild(navLabel);
        
        const content = NCXXML.createElement('content');
        content.setAttribute('src', chapter.href);
        navPoint.appendChild(content);
        
        return navPoint;
    };

    const handleNavChapters = function(appendTo, chapters) {
        chapters.forEach(chapter => {
            const navPoint = navPointForChapter(chapter);
            appendTo.appendChild(navPoint);
            if (chapter.hasOwnProperty("children") && chapter.children) {
                handleNavChapters(navPoint, chapter.children);
            }
        });
    };
    
    handleNavChapters(navMapElem, tocdata);
    
    return NCXXML;
}
