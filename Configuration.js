
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
            this[_config_yamlParsed] = {};
        } else {
            this[_config_yamlParsed].opfManifest
                = new manifest.Manifest(this[_config_yamlParsed].opfManifest);
        }
        // console.log(`Configuration constructor ${typeof this[_config_yamlParsed].source.manifest} ${this[_config_yamlParsed].source.manifest instanceof manifest.Manifest}`);
        this[_config_configFN] = undefined;
    }

    /**
     * File name for configuration file.  Appears this is to be
     * the full path name?
     */
    get configFileName()   { return this[_config_configFN]; }
    set configFileName(FN) { return this[_config_configFN] = FN; }

    /**
     * Return the pathname containing the configuration file.
     */
    get configDirPath() {
        return path.dirname(this.configFileName);
    }

    /**
     * Pathname where the packaged EPUB will land, relative to the location
     * of the configuration file.
     */
    get epubFileName() { return this[_config_yamlParsed].epub; }
    set epubFileName(newEPUBFN) { this[_config_yamlParsed].epub = newEPUBFN; }

    /**
     * Human-friendly text string describing this project.  It is not used
     * anywhere else, e.g. it is not the book title.
     */
    get projectName() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].name
                ? this[_config_yamlParsed].name
                : "";
    }
    set projectName(newName) { this[_config_yamlParsed].name = newName; }

    /**
     * Contains data for the META-INF directory
     */
    get containerRootfiles() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].container
             && this[_config_yamlParsed].container.rootfiles
                ? this[_config_yamlParsed].container.rootfiles
                : undefined; 
    }
    set containerRootfiles(newOPFs) {
        if (!this[_config_yamlParsed].container) {
            this[_config_yamlParsed].container = {};
        }
        this[_config_yamlParsed].container.rootfiles = newOPFs;
    }

    /**
     * Directory containing the document files used in this book.
     */
    get bookroot() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookroot
                ? this[_config_yamlParsed].bookroot
                : undefined; 
    }
    set bookroot(newBookroot) {
        this[_config_yamlParsed].bookroot = newBookroot;
    }

    /**
     * Return the full path for the Root directory.  In
     * the config file, the Root directory is specified relative
     * to the config file.  But some callers require the full path.
     */
    get sourceBookFullPath() {
        return path.normalize(path.join(this.configDirPath, this.bookroot ? this.bookroot : ""));
    }

    /**
     * Directory where asset files are stored
     */
    get assetsDir() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].assets
                ? this[_config_yamlParsed].assets
                : undefined; 
    }
    set assetsDir(newAssetsDir) {
        this[_config_yamlParsed].assets = newAssetsDir;
    }

    /**
     * Directory where partial templates are stored
     */
    get partialsDir() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].partialsDir
                ? this[_config_yamlParsed].partialsDir
                : undefined; 
    }
    set partialsDir(newPartialsDir) {
        this[_config_yamlParsed].partialsDir = newPartialsDir;
    }

    /**
     * Directory where layoout templates are stored
     */
    get layoutsDir() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].layoutsDir
                ? this[_config_yamlParsed].layoutsDir
                : undefined; 
    }
    set layoutsDir(newLayoutsDir) {
        this[_config_yamlParsed].layoutsDir = newLayoutsDir;
    }

    /**
     * Directory where the raw files for the EPUB will be rendered.
     */
    get bookRenderDest() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].bookdest
                ? this[_config_yamlParsed].bookdest
                : undefined;
    }
    set bookRenderDest(newRenderRoot) {
        this[_config_yamlParsed].bookdest = newRenderRoot;
    }

    get bookRenderDestFullPath() {
        if (!this.bookRenderDest) throw new Error('No bookRenderDest set');
        return path.normalize(
            path.join(
                this.configDirPath, this.bookRenderDest ? this.bookRenderDest : ""
            )
        );
    }


    get destRenderRoot() {
        throw new Error('DEPRECATED use get bookRenderDest instead');
    }
    set destRenderRoot(newRenderRoot) {
        throw new Error('DEPRECATED use set bookRenderDest instead');
    }

    get opfManifest() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].opf
             && this[_config_yamlParsed].opf.data
             && this[_config_yamlParsed].opf.data.manifest
                ? this[_config_yamlParsed].opf.data.manifest
                : undefined;
    }
    set opfManifest(newManifest) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!(newManifest instanceof manifest.Manifest)) {
            throw new Error(`New manifest must be of type Manifest ${util.inspect(newManifest)}`);
        }
        this[_config_yamlParsed].opf.data.manifest = newManifest;
    }

    get bookOPF() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].opf
                ? this[_config_yamlParsed].opf.fileName
                : undefined; 
    }
    set bookOPF(newBookOPF) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        this[_config_yamlParsed].opf.fileName = newBookOPF;
        this.containerRootfiles = [
            {
                fullpath: newBookOPF,
                mime: "application/oebps-package+xml"
            }
        ];
    }

    /**
     * Compute the full pathname to the OPF file.  In the config
     * file bookOPF is relative to the location of
     * the config file.  However some callers will require
     * the full pathname.
     */
    get bookOPFFullPath() {
        return path.join(this.sourceBookFullPath, this.bookOPF);
    }

    /**
     * Compute the path within the EPUB file for the OPF.
     * Assume that bookroot is something like
     *       accessible_epub_3
     * While bookOPF is something like
     *       accessible_epub_3/EPUB/package.opf
     */
    get epubPathOPF() {
        let ret = this.bookOPF.substr(this.bookroot.length + 1);
        // console.log(`epubPathOPF bookroot ${this.bookroot} bookOPF ${this.bookOPF} ret ${ret}`);
        return ret;
    }

    // Is this useful?
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

    // Is this useful?
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

    get TOCpath() {
        let tochref = this.sourceBookTOCHREF;
        let epubdir = this.sourceBookFullPath;
        return path.join(epubdir, tochref);
    }

    get sourceBookCoverID() { 
        /* if (this[_config_yamlParsed]
         && this[_config_yamlParsed].opf
         && this[_config_yamlParsed].opf.data
         && this[_config_yamlParsed].opf.data.manifest) {
            for (let item of this[_config_yamlParsed].opf.data.manifest) {
                if (item.is_cover_image) {
                    return item.id;
                }
            }
        }
        return undefined; */
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.cover
                ? this[_config_yamlParsed].source.cover.id
                : undefined;
    }
    set sourceBookCoverID(newCoverID) {
        /* if (this[_config_yamlParsed]
            && this[_config_yamlParsed].opf
            && this[_config_yamlParsed].opf.data
            && this[_config_yamlParsed].opf.data.manifest) {
            for (let item of this[_config_yamlParsed].opf.data.manifest) {
                if (item.is_cover_image) {
                    item.id = newCoverID;
                }
            }
        } */
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.cover) {
            this[_config_yamlParsed].source.cover = {};
        }
        this[_config_yamlParsed].source.cover.id = newCoverID;
    }

    get sourceBookCoverHREF() { 
        /* if (this[_config_yamlParsed]
         && this[_config_yamlParsed].opf
         && this[_config_yamlParsed].opf.data
         && this[_config_yamlParsed].opf.data.manifest) {
            for (let item of this[_config_yamlParsed].opf.data.manifest) {
                if (item.is_cover_image) {
                    return item.path;
                }
            }
        }
        return undefined; */
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.cover
                ? this[_config_yamlParsed].source.cover.href
                : undefined;
    }
    set sourceBookCoverHREF(newCoverHREF) {
        /* if (this[_config_yamlParsed]
            && this[_config_yamlParsed].opf
            && this[_config_yamlParsed].opf.data
            && this[_config_yamlParsed].opf.data.manifest) {
            for (let item of this[_config_yamlParsed].opf.data.manifest) {
                if (item.is_cover_image) {
                    item.id = newCoverHREF;
                }
            }
        } */
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.cover) {
            this[_config_yamlParsed].source.cover = {};
        }
        this[_config_yamlParsed].source.cover.href = newCoverHREF;
    }

    get sourceBookCoverHTMLID() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.coverhtml
                ? this[_config_yamlParsed].source.coverhtml.id
                : undefined;
    }
    set sourceBookCoverHTMLID(newCoverID) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.coverhtml) {
            this[_config_yamlParsed].source.coverhtml = {};
        }
        this[_config_yamlParsed].source.coverhtml.id = newCoverID;
    }

    get sourceBookCoverHTMLHREF() { 
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].source
             && this[_config_yamlParsed].source.coverhtml
                ? this[_config_yamlParsed].source.coverhtml.href
                : undefined;
    }
    set sourceBookCoverHTMLHREF(newCoverHREF) {
        if (!this[_config_yamlParsed].source) {
            this[_config_yamlParsed].source = {};
        }
        if (!this[_config_yamlParsed].source.coverhtml) {
            this[_config_yamlParsed].source.coverhtml = {};
        }
        this[_config_yamlParsed].source.cover.hrefhtml = newCoverHREF;
    }

    get opfTitles() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].opf
             && this[_config_yamlParsed].opf.data
             && this[_config_yamlParsed].opf.data.metadata
             && this[_config_yamlParsed].opf.data.metadata.titles
                ? this[_config_yamlParsed].opf.data.metadata.titles
                : "";
    }
    set opfTitles(newBookTitles) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.titles = newBookTitles;
    }

    /**
     * The primary language for this book.
     */
    get opfLanguages() {
        return this[_config_yamlParsed]
             && this[_config_yamlParsed].opf
             && this[_config_yamlParsed].opf.data
             && this[_config_yamlParsed].opf.data.metadata
             && this[_config_yamlParsed].opf.data.metadata.languages
                ? this[_config_yamlParsed].opf.data.metadata.languages
                : "";
    }
    /**
     * The primary language for this book.
     */
    set opfLanguages(newBookPubLanguage) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.languages = newBookPubLanguage;
    }

    get opfCreators() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.creators
                ? this[_config_yamlParsed].opf.data.metadata.creators
                : "";
    }
    set opfCreators(newCreators) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.creators = newCreators;
    }

    get opfContributors() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.contributors
                ? this[_config_yamlParsed].opf.data.metadata.contributors
                : "";
    }
    set opfContributors(newContributors) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.contributors = newContributors;
    }

    get opfSubjects() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.subjects
                ? this[_config_yamlParsed].opf.data.metadata.subjects
                : "";
    }
    set opfSubjects(newSubjects) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.subjects = newSubjects;
    }

    get opfIdentifiers() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.identifiers
                ? this[_config_yamlParsed].opf.data.metadata.identifiers
                : "";
    }
    set opfIdentifiers(newIdentifiers) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.identifiers = newIdentifiers;
    }

    get bookMetaSourceType() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.source
                && this[_config_yamlParsed].opf.data.metadata.source.type
                ? this[_config_yamlParsed].opf.data.metadata.source.type
                : "";
    }
    set bookMetaSourceType(newType) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata.source) {
            this[_config_yamlParsed].opf.data.metadata.source = {};
        }
        this[_config_yamlParsed].opf.data.metadata.source.type = newType;
    }

    get bookMetaSourceID() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.source
                && this[_config_yamlParsed].opf.data.metadata.source.id
                ? this[_config_yamlParsed].opf.data.metadata.source.id
                : "";
    }
    set bookMetaSourceID(newID) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata.source) {
            this[_config_yamlParsed].opf.data.metadata.source = {};
        }
        this[_config_yamlParsed].opf.data.metadata.source.id = newID;
    }

    get opfPublisher() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.publisher
                ? this[_config_yamlParsed].opf.data.metadata.publisher
                : "";
    }
    set opfPublisher(newBookPublisher) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.publisher = newBookPublisher;
    }

    get opfPublicationDate() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.publicationDate
                ? this[_config_yamlParsed].opf.data.metadata.publicationDate
                : "";
    }
    set opfPublicationDate(newBookPublicationDate) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        // Do this solely to validate the format
        let ndate = new Date(newBookPublicationDate);
        this[_config_yamlParsed].opf.data.metadata.publicationDate = newBookPublicationDate;
    }

    get opfModifiedDate() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.modified
                ? this[_config_yamlParsed].opf.data.metadata.modified
                : "";
    }
    set opfModifiedDate(newBookModifiedDate) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        // Do this solely to validate the format
        let ndate = new Date(newBookModifiedDate);
        this[_config_yamlParsed].opf.data.metadata.modified = newBookModifiedDate;
    }

    get opfDescription() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.description
                ? this[_config_yamlParsed].opf.data.metadata.description
                : "";
    }
    set opfDescription(newBookDescription) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.description = newBookDescription;
    }

    get opfFormat() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.format
                ? this[_config_yamlParsed].opf.data.metadata.format
                : "";
    }
    set opfFormat(newBookFormat) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.format = newBookFormat;
    }

    get opfRelation() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.relation
                ? this[_config_yamlParsed].opf.data.metadata.relation
                : "";
    }
    set opfRelation(newBookRelation) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.relation = newBookRelation;
    }

    get opfCoverage() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.coverage
                ? this[_config_yamlParsed].opf.data.metadata.coverage
                : "";
    }
    set opfCoverage(newBookCoverage) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.coverage = newBookCoverage;
    }

    get opfRights() {
        return this[_config_yamlParsed]
                && this[_config_yamlParsed].opf
                && this[_config_yamlParsed].opf.data
                && this[_config_yamlParsed].opf.data.metadata
                && this[_config_yamlParsed].opf.data.metadata.rights
                ? this[_config_yamlParsed].opf.data.metadata.rights
                : "";
    }
    set opfRights(newBookRights) {
        if (!this[_config_yamlParsed].opf) {
            this[_config_yamlParsed].opf = {};
        }
        if (!this[_config_yamlParsed].opf.data) {
            this[_config_yamlParsed].opf.data = {};
        }
        if (!this[_config_yamlParsed].opf.data.metadata) {
            this[_config_yamlParsed].opf.data.metadata = {};
        }
        this[_config_yamlParsed].opf.data.metadata.rights = newBookRights;
    }

    async save() {
        if (!this.configFileName) throw new Error("No file name has been set for project");

        /*  Useful debugging of the generated configuration */
        
        console.log(`Configuration SAVE ${util.inspect(this[_config_yamlParsed])}`);
        console.log(this[_config_yamlParsed]);
        console.log(this.opfTitles);
        console.log(this.opfLanguages);
        console.log(this.opfIdentifiers);
        console.log(this.opfCreators);
        console.log(this.opfContributors);
        console.log(this.opfManifest);
        /* */

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
    try {
        await manifest.spineTitles(config);
        config.tocdata = await manifest.tocData(config);
    } catch (e) {
        console.error(`epubtools caught error while building Configuration: ${e.stack}`);
    }
    return config;
};