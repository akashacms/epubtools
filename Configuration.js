
const yaml      = require('js-yaml');
const epubuild  = require('./index');
const uuid      = require('uuid');
const fs        = require('fs-extra');
const path      = require('path');
const util      = require('util');
const manifest  = require('./manifest');

const _config_yamlText = Symbol('yamlText');
const _config_yamlParsed = Symbol('yamlParsed');
const _config_configFN = Symbol('configFN');

module.exports.Configuration = class Configuration {

    constructor(yamlText) {
        this[_config_yamlText] = yamlText;
        this[_config_yamlParsed] = yaml.safeLoad(yamlText);
        if (!this[_config_yamlParsed]) {
            this[_config_yamlParsed] = {
                source: {
                    toc: {},
                    manifest: new manifest.Manifest()
                },
                bookmeta: {
                    titles: [],
                    languages: [],
                    identifiers: [],
                    published: {},
                    creators: [],
                    subjects: []
                },
                cover: {
                    coverHtml: {}
                }, 
                destination: {
                    ncx: {}
                }
            };
        } else {
            this[_config_yamlParsed].source.manifest
                = new manifest.Manifest(this[_config_yamlParsed].source.manifest);
        }
        // console.log(`Configuration constructor ${typeof this[_config_yamlParsed].source.manifest} ${this[_config_yamlParsed].source.manifest instanceof manifest.Manifest}`);
        this[_config_configFN] = undefined;
    }

    get configFileName()   { return this[_config_configFN]; }
    set configFileName(FN) { return this[_config_configFN] = FN; }

    /**
     * Return the pathname containing the configuration file.
     */
    get configDirPath() {
        return path.dirname(this.configFileName);
    }

    get epubFileName() { return this[_config_yamlParsed].epub; }
    set epubFileName(newEPUBFN) { this[_config_yamlParsed].epub = newEPUBFN; }

    get projectName() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].name
                ? this[_config_yamlParsed].name
                : "";
    }
    set projectName(newName) { this[_config_yamlParsed].name = newName; }

    get sourceBookroot() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.bookroot
                ? this[_config_yamlParsed].source.bookroot
                : undefined; 
    }
    set sourceBookroot(newBookroot) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        this[_config_yamlParsed].source.bookroot = newBookroot;
    }

    /**
     * Return the full path for the Root directory.  In
     * the config file, the Root directory is specified relative
     * to the config file.  But some callers require the full path.
     */
    get sourceBookFullPath() {
        return path.join(this.configDirPath, this.sourceBookroot);
    }

    get destRenderRoot() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.renderRoot
                ? this[_config_yamlParsed].source.renderRoot
                : undefined;
    }
    set destRenderRoot(newRenderRoot) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        this[_config_yamlParsed].source.renderRoot = newRenderRoot;
    }

    get manifest() {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.manifest) {
            this[_config_yamlParsed].source.manifest = new manifest.Manifest();
        }
        // console.log(`Configuration get manifest ${typeof this[_config_yamlParsed].source.manifest} ${this[_config_yamlParsed].source.manifest instanceof manifest.Manifest}`);
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.manifest
                ? this[_config_yamlParsed].source.manifest
                : undefined;
    }
    set manifest(newManifest) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!(newManifest instanceof manifest.Manifest)) {
            throw new Error(`New manifest must be of type Manifest`);
        }
        this[_config_yamlParsed].source.manifest = newManifest;
    }

    get sourceBookOPF() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.opf
                ? this[_config_yamlParsed].source.opf
                : undefined; 
    }
    set sourceBookOPF(newBookOPF) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        this[_config_yamlParsed].source.opf = newBookOPF;
    }

    /**
     * Compute the full pathname to the OPF file.  In the config
     * file sourceBookOPF is relative to the location of
     * the config file.  However some callers will require
     * the full pathname.
     */
    get sourceBookOPFFullPath() {
        return path.join(this.configDirPath, this.sourceBookOPF);
    }

    /**
     * Compute the path within the EPUB file for the OPF.
     * Assume that sourceBookroot is something like
     *       accessible_epub_3
     * While sourceBookOPF is something like
     *       accessible_epub_3/EPUB/package.opf
     */
    get epubPathOPF() {
        let ret = this.sourceBookOPF.substr(this.sourceBookroot.length + 1);
        // console.log(`epubPathOPF sourceBookroot ${this.sourceBookroot} sourceBookOPF ${this.sourceBookOPF} ret ${ret}`);
        return ret;
    }

    get sourceBookNCXID() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.ncx
                ? this[_config_yamlParsed].source.ncx.id
                : undefined; 
    }
    set sourceBookNCXID(newNCXID) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.ncx) {
            this[_config_yamlParsed].source.ncx = {};
        }
        this[_config_yamlParsed].source.ncx.id = newNCXID;
    }

    get sourceBookNCXHREF() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.ncx
                ? this[_config_yamlParsed].source.ncx.href
                : undefined; 
    }
    set sourceBookNCXHREF(newNCXHREF) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.ncx) {
            this[_config_yamlParsed].source.ncx = {};
        }
        this[_config_yamlParsed].source.ncx.href = newNCXHREF;
    }

    get sourceBookTOCID() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.toc
                ? this[_config_yamlParsed].source.toc.id
                : undefined; 
    }
    set sourceBookTOCID(newTOCID) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.toc) {
            this[_config_yamlParsed].source.toc = {};
        }
        this[_config_yamlParsed].source.toc.id = newTOCID;
    }

    get sourceBookTOCHREF() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.toc
                ? this[_config_yamlParsed].source.toc.href
                : undefined; 
    }
    set sourceBookTOCHREF(newTOCHREF) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.toc) {
            this[_config_yamlParsed].source.toc = {};
        }
        this[_config_yamlParsed].source.toc.href = newTOCHREF;
    }

    get bookMetaTitles() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.titles
                ? this[_config_yamlParsed].bookmeta.titles
                : "";
    }
    set bookMetaTitles(newBookTitles) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        if (!this[_config_yamlParsed].bookmeta.titles) {
            this[_config_yamlParsed].bookmeta.titles = [];
        }
        this[_config_yamlParsed].bookmeta.titles = newBookTitles;
    }

    /**
     * The primary language for this book.
     */
    get bookMetaPubLanguage() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.languages
                ? this[_config_yamlParsed].bookmeta.languages
                : "";
    }
    /**
     * The primary language for this book.
     */
    set bookMetaPubLanguage(newBookPubLanguage) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.languages = newBookPubLanguage;
    }

    get bookMetaCreators() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.creators
                ? this[_config_yamlParsed].bookmeta.creators
                : [];
    }
    set bookMetaCreators(newCreators) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.creators = newCreators;
    }

    get bookMetaContributors() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.contributors
                ? this[_config_yamlParsed].bookmeta.contributors
                : [];
    }
    set bookMetaContributors(newContributors) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.contributors = newContributors;
    }

    get bookMetaSubjects() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.subjects
                ? this[_config_yamlParsed].bookmeta.subjects
                : [];
    }
    set bookMetaSubjects(newSubjects) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.subjects = newSubjects;
    }

    get bookMetaIdentifiers() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.identifiers
                ? this[_config_yamlParsed].bookmeta.identifiers
                : [];
    }
    set bookMetaIdentifiers(newIdentifiers) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.identifiers = newIdentifiers;
    }

    get bookMetaSourceType() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.source
                ? this[_config_yamlParsed].bookmeta.source.type
                : "";
    }
    set bookMetaSourceType(newType) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        if (!this[_config_yamlParsed].bookmeta.source) {
            this[_config_yamlParsed].bookmeta.source = {};
        }
        this[_config_yamlParsed].bookmeta.source.type = newType;
    }

    get bookMetaSourceID() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.source
                ? this[_config_yamlParsed].bookmeta.source.string
                : "";
    }
    set bookMetaSourceID(newID) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        if (!this[_config_yamlParsed].bookmeta.source) {
            this[_config_yamlParsed].bookmeta.source = {};
        }
        this[_config_yamlParsed].bookmeta.source.string = newID;
    }

    get bookMetaPublisher() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.publisher
                ? this[_config_yamlParsed].bookmeta.publisher
                : "";
    }
    set bookMetaPublisher(newBookPublisher) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.publisher = newBookPublisher;
    }

    get bookMetaPublicationDate() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.publicationDate
                ? this[_config_yamlParsed].bookmeta.publicationDate
                : "";
    }
    set bookMetaPublicationDate(newBookPublicationDate) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        // Do this solely to validate the format
        let ndate = new Date(newBookPublicationDate);
        this[_config_yamlParsed].bookmeta.publicationDate 
                = newBookPublicationDate;
    }

    get bookMetaModifiedDate() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.modified
                ? this[_config_yamlParsed].bookmeta.modified
                : "";
    }
    set bookMetaModifiedDate(newBookModifiedDate) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        // Do this solely to validate the format
        let ndate = new Date(newBookModifiedDate);
        this[_config_yamlParsed].bookmeta.modified 
                = newBookModifiedDate;
    }

    get bookMetaDescription() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.description
                ? this[_config_yamlParsed].bookmeta.description
                : "";
    }
    set bookMetaDescription(newBookDescription) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.description = newBookDescription;
    }

    get bookMetaFormat() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.format
                ? this[_config_yamlParsed].bookmeta.format
                : "";
    }
    set bookMetaFormat(newBookFormat) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.format = newBookFormat;
    }

    get bookMetaRelation() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.relation
                ? this[_config_yamlParsed].bookmeta.relation
                : "";
    }
    set bookMetaRelation(newBookRelation) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.relation = newBookRelation;
    }

    get bookMetaCoverage() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.coverage
                ? this[_config_yamlParsed].bookmeta.coverage
                : "";
    }
    set bookMetaCoverage(newBookCoverage) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.coverage = newBookCoverage;
    }

    get bookMetaRights() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookmeta
             && this[_config_yamlParsed].bookmeta.rights
                ? this[_config_yamlParsed].bookmeta.rights
                : "";
    }
    set bookMetaRights(newBookRights) {
        if (!this[_config_yamlParsed].bookmeta) {
            this[_config_yamlParsed].bookmeta = {};
        }
        this[_config_yamlParsed].bookmeta.rights = newBookRights;
    }

    async save() {
        if (!this.configFileName) throw new Error("No file name has been set for project");
        await fs.writeFile(this.configFileName, 
            yaml.safeDump(this[_config_yamlParsed], {
                indent: 4
            }), 'utf8');
    }

}

module.exports.readConfig = async function(fn) {
    const yamlText = await fs.readFile(fn, 'utf8');
    let config = new exports.Configuration(yamlText);
    config.configFileName = fn;
    return config;
}