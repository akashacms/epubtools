
const { promisify } = require('util');
const { assert } = require('chai');
const epubtools  = require('../dist/index');
const epubconfig = require('../dist/Configuration');
const manifest  = require('../dist/manifest');


let config;
const configFN = 'samples-3.0/epub30-spec.epubtools';

describe('read config file', function() {
    
    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });
});

describe('read manifest', function() {

    it('should read the manifest', async function() {
        this.timeout(75000);
        assert.isDefined(config);
        config.opfManifest = await manifest.from_fs(config);
        // console.log(config.opfManifest);
    });
});

describe('check manifest items', function() {
    it('should read epub-spec.css', function() {
        let item = config.opfManifest.byPath('EPUB/css/epub-spec.css');
        // console.log(`should read epub-spec.css item=`, item);
        assert.isDefined(item);
        assert.equal(item.basedir, 'epub30-spec');
        assert.equal(item.dirname, 'EPUB/css');
        assert.equal(item.filename, 'epub-spec.css');
        assert.equal(item.mime, 'text/css');
        assert.isFalse(item.mimeoverride);
        assert.isFalse(item.is_nav);
        assert.isFalse(item.is_cover_image);
        assert.isFalse(item.suppress);
        assert.isFalse(item.seen_in_opf);
    });

    it('should read epub_logo_color.jpg', function() {
        let item = config.opfManifest.byPath('EPUB/img/epub_logo_color.jpg');
        assert.isDefined(item);
        assert.equal(item.basedir, 'epub30-spec');
        assert.equal(item.dirname, 'EPUB/img');
        assert.equal(item.filename, 'epub_logo_color.jpg');
        assert.equal(item.mime, 'image/jpeg');
        assert.isFalse(item.mimeoverride);
        assert.isFalse(item.is_nav);
        assert.isFalse(item.is_cover_image);
        assert.isFalse(item.suppress);
        assert.isFalse(item.seen_in_opf);
    });

    it('should read epub30-acknowledgements.xhtml', function() {
        let item = config.opfManifest.byPath('EPUB/xhtml/epub30-acknowledgements.xhtml');
        assert.isDefined(item);
        assert.equal(item.basedir, 'epub30-spec');
        assert.equal(item.dirname, 'EPUB/xhtml');
        assert.equal(item.filename, 'epub30-acknowledgements.xhtml');
        assert.equal(item.mime, 'application/xhtml+xml');
        assert.isFalse(item.mimeoverride);
        assert.isFalse(item.is_nav);
        assert.isFalse(item.is_cover_image);
        assert.isFalse(item.suppress);
        assert.isTrue(item.in_spine);
        assert.isFalse(item.seen_in_opf);
    });

    it('should read epub30-changes.xhtml', function() {
        let item = config.opfManifest.byPath('EPUB/xhtml/epub30-changes.xhtml');
        assert.isDefined(item);
        assert.equal(item.basedir, 'epub30-spec');
        assert.equal(item.dirname, 'EPUB/xhtml');
        assert.equal(item.filename, 'epub30-changes.xhtml');
        assert.equal(item.mime, 'application/xhtml+xml');
        assert.isFalse(item.mimeoverride);
        assert.isFalse(item.is_nav);
        assert.isFalse(item.is_cover_image);
        assert.isFalse(item.suppress);
        assert.isTrue(item.in_spine);
        assert.isFalse(item.seen_in_opf);
    });

    it('should read epub30-nav.xhtml', function() {
        let item = config.opfManifest.byPath('EPUB/xhtml/epub30-nav.xhtml');
        assert.isDefined(item);
        assert.equal(item.id, 'toc');
        assert.equal(item.basedir, 'epub30-spec');
        assert.equal(item.dirname, 'EPUB/xhtml');
        assert.equal(item.filename, 'epub30-nav.xhtml');
        assert.equal(item.mime, 'application/xhtml+xml');
        assert.isFalse(item.mimeoverride);
        assert.isTrue(item.is_nav);
        assert.isFalse(item.is_cover_image);
        assert.isFalse(item.suppress);
        assert.isTrue(item.in_spine);
        assert.isFalse(item.seen_in_opf);
    });
});