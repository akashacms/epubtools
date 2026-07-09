
// import uuid from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';

// import epubuild from '../index.js';
import * as manifest  from './manifest.js';

export class Configuration {

    #yamlText: string;
    #yamlParsed: any;
    #configFN: string | undefined;
    #tocdata: any | undefined;

    constructor(yamlText: string) {
        this.#yamlText = yamlText;
        this.#yamlParsed = yaml.load(yamlText);
        if (!this.#yamlParsed) {
            this.#yamlParsed = {};
        } else {
            this.#yamlParsed.opfManifest
                = new manifest.Manifest(this.#yamlParsed.opfManifest);
        }
        // console.log(`Configuration constructor ${typeof this.#yamlParsed.source.manifest} ${this.#yamlParsed.source.manifest instanceof manifest.Manifest}`);
        this.#configFN = undefined;
        this.#tocdata  = undefined;
    }

    get YAML() { return this.#yamlParsed; }

    /**
     * Check if the configuration is minimally usable.
     */
    async check() {
        if (!this.configFileName || this.configFileName === '') {
            throw new Error(`No configFileName set in ${this.projectName}`);
        }

        if (!this.opfPublicationDate || this.opfPublicationDate === '') {
            throw new Error(`No publication date`);
        }
    }

    /**
     * File name for configuration file.  Appears this is to be
     * the full path name?
     */
    get configFileName(): string | undefined  { return this.#configFN; }
    set configFileName(FN: string) { this.#configFN = FN; }

    /**
     * Return the pathname containing the configuration file.
     */
    get configDirPath(): string {
        if (!this.configFileName || this.configFileName === '') {
            throw new Error(`No configFileName set in ${this.projectName}`);
        }
        return path.dirname(this.configFileName);
    }

    /**
     * Pathname where the packaged EPUB will land, relative to the location
     * of the configuration file.
     */
    get epubFileName() { return this.#yamlParsed.epub; }
    set epubFileName(newEPUBFN) { this.#yamlParsed.epub = newEPUBFN; }

    /**
     * Human-friendly text string describing this project.  It is not used
     * anywhere else, e.g. it is not the book title.
     */
    get projectName() {
        return this.#yamlParsed
             && this.#yamlParsed.name
                ? this.#yamlParsed.name
                : "";
    }
    set projectName(newName) { this.#yamlParsed.name = newName; }

    /**
     * Contains data for the META-INF directory
     */
    get containerRootfiles() { 
        return this.#yamlParsed
             && this.#yamlParsed.container
             && this.#yamlParsed.container.rootfiles
                ? this.#yamlParsed.container.rootfiles
                : undefined; 
    }
    set containerRootfiles(newOPFs) {
        if (!this.#yamlParsed.container) {
            this.#yamlParsed.container = {};
        }
        this.#yamlParsed.container.rootfiles = newOPFs;
    }

    get opfManifest() {
        return this.#yamlParsed
             && this.#yamlParsed.opf
             && this.#yamlParsed.opf.manifest
                ? this.#yamlParsed.opf.manifest
                : undefined;
    }
    set opfManifest(newManifest) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        if (!(newManifest instanceof manifest.Manifest)) {
            throw new Error(`New manifest must be of type Manifest ${util.inspect(newManifest)}`);
        }
        this.#yamlParsed.opf.manifest = newManifest;
    }

    get bookOPF(): string | undefined {
        return this.#yamlParsed
             && this.#yamlParsed.opf
                ? this.#yamlParsed.opf.fileName
                : undefined; 
    }
    set bookOPF(newBookOPF: string) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.fileName = newBookOPF;
        this.containerRootfiles = [
            {
                fullpath: newBookOPF,
                mime: "application/oebps-package+xml"
            }
        ];
    }

    /**
     * The directory path where the rendered files are stored.  In akasharender-epub
     * an additional YAML location is supported, <code>this.YAML.akashaepub.bookdest</code>,
     * but it would be a mistake for epubtools to support that data, and it would be
     * better for akasharender-epub to use the rendered field.
     */
    get renderedPath() {
        return this.#yamlParsed
             && this.#yamlParsed.rendered
                ? this.#yamlParsed.rendered
                : "out";
    }
    set renderedPath(newPath) {
        this.#yamlParsed.rendered = newPath;
    }

    get renderedFullPath() {
        return path.normalize(path.join(this.configDirPath, this.renderedPath ? this.renderedPath : ""));
    }

    /**
     * Compute the full pathname to the OPF file.  In the config
     * file bookOPF is relative to the location of
     * the config file.  However some callers will require
     * the full pathname.
     */
    get bookOPFFullPath() {
        return typeof this.bookOPF === 'string'
            ? path.join(this.renderedPath, this.bookOPF)
            : this.renderedPath;
    }

    /**
     * Compute the path within the EPUB file for the OPF.
     * Assume that renderedFullPath is something like
     *       accessible_epub_3
     * While bookOPF is something like
     *       accessible_epub_3/EPUB/package.opf
     */
    get epubPathOPF() {
        const ret = typeof this.bookOPF === 'string'
            ? this.bookOPF.substr(this.renderedFullPath.length + 1)
            : this.bookOPF;
        // console.log(`epubPathOPF renderedFullPath ${this.renderedFullPath} bookOPF ${this.bookOPF} ret ${ret}`);
        return ret;
    }

    get sourceBookNCXID() { 
        return this.#yamlParsed
             && this.#yamlParsed.ncx
                ? this.#yamlParsed.ncx.id
                : undefined; 
    }
    set sourceBookNCXID(newNCXID) {
        if (!this.#yamlParsed.ncx) {
            this.#yamlParsed.ncx = {};
        }
        this.#yamlParsed.ncx.id = newNCXID;
    }

    get sourceBookNCXHREF() { 
        return this.#yamlParsed
             && this.#yamlParsed.ncx
                ? this.#yamlParsed.ncx.href
                : undefined; 
    }
    set sourceBookNCXHREF(newNCXHREF) {
        if (!this.#yamlParsed.ncx) {
            this.#yamlParsed.ncx = {};
        }
        this.#yamlParsed.ncx.href = newNCXHREF;
    }

    get doGenerateNCX() {
        if (!this.sourceBookNCXID && !this.sourceBookNCXHREF) {
            return false;
        }
        if (!this.sourceBookNCXID && this.sourceBookTOCHREF) {
            throw new Error(`doGenerateNCX Configuration must specify both sourceBookNCXID and sourceBookTOCHREF, only sourceBookTOCHREF ${this.sourceBookTOCHREF} specified`);
        }
        if (this.sourceBookNCXID && !this.sourceBookTOCHREF) {
            throw new Error(`doGenerateNCX Configuration must specify both sourceBookNCXID and sourceBookTOCHREF, only sourceBookNCXID ${this.sourceBookNCXID} specified`);
        }
        // At this point we've determined both are set.
        return true;
    }

    get sourceBookTOCID() { 
        return this.#yamlParsed
             && this.#yamlParsed.toc
                ? this.#yamlParsed.toc.id
                : undefined; 
    }
    set sourceBookTOCID(newTOCID) {
        if (!this.#yamlParsed.toc) {
            this.#yamlParsed.toc = {};
        }
        this.#yamlParsed.toc.id = newTOCID;
    }

    get sourceBookTOCHREF() { 
        return this.#yamlParsed
             && this.#yamlParsed.toc
                ? this.#yamlParsed.toc.href
                : undefined; 
    }
    set sourceBookTOCHREF(newTOCHREF) {
        if (!this.#yamlParsed.toc) {
            this.#yamlParsed.toc = {};
        }
        this.#yamlParsed.toc.href = newTOCHREF;
    }

    get TOCpath() {
        const tochref = this.sourceBookTOCHREF;
        const epubdir = this.renderedFullPath;
        return path.join(epubdir, tochref);
    }

    get tocdata() { return this.#tocdata; }

    async readTOCData() {
        try {
            await manifest.spineTitles(this);
            this.#tocdata = await manifest.tocData(this);
        } catch (e: any) {
            console.error(`epubtools caught error while building Configuration: ${e.stack}`);
            throw new Error(`epubtools caught error while building Configuration: ${e.stack}`);
        }
    }

    get sourceBookCoverID() { 
        /* if (this.#yamlParsed
         && this.#yamlParsed.opf
         && this.#yamlParsed.opf.data
         && this.#yamlParsed.opf.data.manifest) {
            for (let item of this.#yamlParsed.opf.data.manifest) {
                if (item.is_cover_image) {
                    return item.id;
                }
            }
        }
        return undefined; */
        return this.#yamlParsed
             && this.#yamlParsed.cover
                ? this.#yamlParsed.cover.id
                : undefined;
    }
    set sourceBookCoverID(newCoverID) {
        /* if (this.#yamlParsed
            && this.#yamlParsed.opf
            && this.#yamlParsed.opf.data
            && this.#yamlParsed.opf.data.manifest) {
            for (let item of this.#yamlParsed.opf.data.manifest) {
                if (item.is_cover_image) {
                    item.id = newCoverID;
                }
            }
        } */
        if (!this.#yamlParsed.cover) {
            this.#yamlParsed.cover = {};
        }
        this.#yamlParsed.cover.id = newCoverID;
    }

    get sourceBookCoverHREF() { 
        /* if (this.#yamlParsed
         && this.#yamlParsed.opf
         && this.#yamlParsed.opf.data
         && this.#yamlParsed.opf.data.manifest) {
            for (let item of this.#yamlParsed.opf.data.manifest) {
                if (item.is_cover_image) {
                    return item.path;
                }
            }
        }
        return undefined; */
        return this.#yamlParsed
             && this.#yamlParsed.cover
                ? this.#yamlParsed.cover.href
                : undefined;
    }
    set sourceBookCoverHREF(newCoverHREF) {
        /* if (this.#yamlParsed
            && this.#yamlParsed.opf
            && this.#yamlParsed.opf.data
            && this.#yamlParsed.opf.data.manifest) {
            for (let item of this.#yamlParsed.opf.data.manifest) {
                if (item.is_cover_image) {
                    item.id = newCoverHREF;
                }
            }
        } */
        if (!this.#yamlParsed.cover) {
            this.#yamlParsed.cover = {};
        }
        this.#yamlParsed.cover.href = newCoverHREF;
    }

    get sourceBookCoverHTMLID() { 
        return this.#yamlParsed
             && this.#yamlParsed.coverhtml
                ? this.#yamlParsed.coverhtml.id
                : undefined;
    }
    set sourceBookCoverHTMLID(newCoverID) {
        if (!this.#yamlParsed.coverhtml) {
            this.#yamlParsed.coverhtml = {};
        }
        this.#yamlParsed.coverhtml.id = newCoverID;
    }

    get sourceBookCoverHTMLHREF() { 
        return this.#yamlParsed
             && this.#yamlParsed.coverhtml
                ? this.#yamlParsed.coverhtml.href
                : undefined;
    }
    set sourceBookCoverHTMLHREF(newCoverHREF) {
        if (!this.#yamlParsed.coverhtml) {
            this.#yamlParsed.coverhtml = {};
        }
        this.#yamlParsed.coverhtml.href = newCoverHREF;
    }

    /**
     * This is an array of objects containing:
     *      id:  ID value
     *      title:  "The title to use"
     *      type:  is a code which is one of the following
     *              main
     *              The title that reading systems should normally display, 
     *              for example in a user’s library or bookshelf. If no 
     *              values for the title-type property are provided, it 
     *              is assumed that the first or only dc:title should be 
     *              considered the “main title.”
     * 
     *              subtitle
     *              A secondary title that augments the main title but 
     *              is separate from it.
     * 
     *              short
     *              A shortened version of the main title, often used when
     *              referring to a book with a long title (for example, 
     *              “Huck Finn” for The Adventures of Huckleberry Finn) or 
     *              a brief expression by which a book is known (for example, 
     *              “Strunk and White” for The Elements of Style or “Fowler” 
     *              for A Dictionary of Modern English Usage).
     * 
     *              collection
     *              A title given to a set (either finite or ongoing) to 
     *              which the given publication is a member. This can be a 
     *              “series title,” when the publications are in a specific 
     *              sequence (e.g., The Lord of the Rings), or one in which 
     *              the members are not necessarily in a particular order 
     *              (e.g., “Columbia Studies in South Asian Art”).
     * 
     *              edition
     *              A designation that indicates substantive changes from 
     *              one to the next.
     * 
     *              extended
     *              A fully expressed title that may be a combination of 
     *              some of the other title types, for example: The Great
     *              Cookbooks of the World: Mon premier guide de caisson, 
     *              un Mémoire. The New French Cuisine Masters, Volume Two.
     *              Special Anniversary Edition.
     */

    get opfTitles() {
        return this.#yamlParsed
             && this.#yamlParsed.opf
             && this.#yamlParsed.opf.titles
                ? this.#yamlParsed.opf.titles
                : "";
    }
    set opfTitles(newBookTitles) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.titles = newBookTitles;
    }

    /**
     * The primary language for this book.
     */
    get opfLanguages() {
        return this.#yamlParsed
             && this.#yamlParsed.opf
             && this.#yamlParsed.opf.languages
                ? this.#yamlParsed.opf.languages
                : "";
    }
    /**
     * The primary language for this book.
     */
    set opfLanguages(newBookPubLanguage) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.languages = newBookPubLanguage;
    }

    get opfCreators() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.creators
                ? this.#yamlParsed.opf.creators
                : "";
    }
    set opfCreators(newCreators) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.creators = newCreators;
    }

    get opfContributors() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.contributors
                ? this.#yamlParsed.opf.contributors
                : "";
    }
    set opfContributors(newContributors) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.metadata.contributors = newContributors;
    }

    get opfSubjects() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.subjects
                ? this.#yamlParsed.opf.subjects
                : "";
    }
    set opfSubjects(newSubjects) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        if (!this.#yamlParsed.opf.metadata) {
            this.#yamlParsed.opf.metadata = {};
        }
        this.#yamlParsed.opf.metadata.subjects = newSubjects;
    }

    get opfIdentifiers() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.identifiers
                ? this.#yamlParsed.opf.identifiers
                : "";
    }
    set opfIdentifiers(newIdentifiers) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.identifiers = newIdentifiers;
    }

    get bookMetaSourceType() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.source
                && this.#yamlParsed.opf.source.type
                ? this.#yamlParsed.opf.source.type
                : "";
    }
    set bookMetaSourceType(newType) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        if (!this.#yamlParsed.opf.source) {
            this.#yamlParsed.opf.source = {};
        }
        this.#yamlParsed.opf.source.type = newType;
    }

    get bookMetaSourceID() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.source
                && this.#yamlParsed.opf.source.id
                ? this.#yamlParsed.opf.source.id
                : "";
    }
    set bookMetaSourceID(newID) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        if (!this.#yamlParsed.opf.source) {
            this.#yamlParsed.opf.source = {};
        }
        this.#yamlParsed.opf.source.id = newID;
    }

    get opfPublisher() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.publisher
                ? this.#yamlParsed.opf.publisher
                : "";
    }
    set opfPublisher(newBookPublisher) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.publisher = newBookPublisher;
    }

    get opfPublicationDate() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.publicationDate
                ? this.#yamlParsed.opf.publicationDate
                : "";
    }
    set opfPublicationDate(newBookPublicationDate) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        // Do this solely to validate the format
        const ndate = new Date(newBookPublicationDate);
        if (!ndate) throw new Error(`Date ${util.inspect(newBookPublicationDate)} was not good`);
        this.#yamlParsed.opf.publicationDate = newBookPublicationDate;
    }

    get opfModifiedDate() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.modifiedDate
                ? this.#yamlParsed.opf.modifiedDate
                : new Date().toISOString();
    }
    set opfModifiedDate(newBookModifiedDate) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        // Do this solely to validate the format
        const ndate = new Date(newBookModifiedDate);
        if (!ndate) throw new Error(`Date ${util.inspect(newBookModifiedDate)} was not good`);
        this.#yamlParsed.opf.modifiedDate = newBookModifiedDate;
    }

    get opfDescription() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.description
                ? this.#yamlParsed.opf.description
                : "";
    }
    set opfDescription(newBookDescription) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.description = newBookDescription;
    }

    get opfFormat() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.format
                ? this.#yamlParsed.opf.format
                : "";
    }
    set opfFormat(newBookFormat) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.format = newBookFormat;
    }

    get opfRelation() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.relation
                ? this.#yamlParsed.opf.relation
                : "";
    }
    set opfRelation(newBookRelation) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.relation = newBookRelation;
    }

    get opfCoverage() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.coverage
                ? this.#yamlParsed.opf.coverage
                : "";
    }
    set opfCoverage(newBookCoverage) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.coverage = newBookCoverage;
    }

    get opfRights() {
        return this.#yamlParsed
                && this.#yamlParsed.opf
                && this.#yamlParsed.opf.rights
                ? this.#yamlParsed.opf.rights
                : "";
    }
    set opfRights(newBookRights) {
        if (!this.#yamlParsed.opf) {
            this.#yamlParsed.opf = {};
        }
        this.#yamlParsed.opf.rights = newBookRights;
    }

    async save() {
        if (!this.configFileName) throw new Error("No file name has been set for project");

        /*  Useful debugging of the generated configuration */
        
        /* console.log(`Configuration SAVE ${util.inspect(this.#yamlParsed)}`);
        console.log(this.#yamlParsed);
        console.log(this.opfTitles);
        console.log(this.opfLanguages);
        console.log(this.opfIdentifiers);
        console.log(this.opfCreators);
        console.log(this.opfContributors);
        console.log(this.opfManifest); */
        /* */

        await fs.writeFile(this.configFileName, 
            yaml.dump(this.#yamlParsed, {
                indent: 4
            }), 'utf8');
    }

}

export async function readConfig(fn: string) {
    const yamlText = await fs.readFile(fn, 'utf8');
    const config = new Configuration(yamlText);
    config.configFileName = fn;
    await config.check();
    return config;
}
