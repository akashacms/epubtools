import shell from 'shelljs';
import configurator from '../Configuration.js';
import bundleEPUB from '../bundleEPUB.js';
import metadata from '../metadata.js';
import opf from '../opf.js';
import chaipkg from 'chai';
const { assert } = chaipkg;
import process from 'process';

const configFN = 'samples-3.0/epub30-spec-mkmeta.epubtools';
const rendereddir = 'samples-3.0/epub30-spec';
const testdir = 'samples-3.0-test/epub30-spec';

describe('setup', function() {
    it('should setup project', async function() {
        shell.mkdir('-p', 'samples-3.0-test');
        shell.rm('-rf', testdir);
        shell.cp('-R', rendereddir, testdir);
    });

});

describe('mkmeta', function() {
    it('should run mkmeta command', async function() {
        await bundleEPUB.doMkMetaCommand(configFN);
    });

    it('should generate package.opf', async function() {
        assert.isTrue(shell.test('-f', `${testdir}/EPUB/package.opf`));
    });

    it('should generate container.xml', async function() {
        assert.isTrue(shell.test('-f', `${testdir}/META-INF/container.xml`));
    });

    it('should generate toc.ncx', async function() {
        assert.isTrue(shell.test('-f', `${testdir}/toc.ncx`));
    });

    it('should contain correct container.xml', async function() {
        let containerXmlData = await metadata.readContainerXml(testdir);
        assert.isNotNull(containerXmlData);
        let roots = metadata.findRootfiles(containerXmlData.containerXml);
        assert.equal(roots.length, 1);
        assert.equal(roots[0].fullpath, 'EPUB/package.opf');
        assert.equal(roots[0].mime, 'application/oebps-package+xml');
    });

    it('should contain correct package.opf', async function() {
        const OPFXML = await opf.readOpf(`${testdir}/EPUB/package.opf`);
        assert.isNotNull(OPFXML);

        const config = await configurator.readConfig(configFN);

        assert.deepEqual({
            titles: opf.titles(OPFXML),
            identifiers: opf.identifiers(OPFXML),
            languages: opf.languages(OPFXML),
            creators: opf.creators(OPFXML, 'dc:creator'),
            publicationDate: opf.publicationDate(OPFXML),
            modifiedDate: opf.modifiedDate(OPFXML),
            subjects: opf.subjects(OPFXML),
            description: opf.description(OPFXML),
            format: opf.format(OPFXML),
            publisher: opf.publisher(OPFXML),
            relation: opf.relation(OPFXML),
            coverage: opf.coverage(OPFXML),
            rights: opf.rights(OPFXML)
        }, {
            titles: [
                { id: 'title0', title: 'EPUB 3.0 Specification' }
            ],
            identifiers: [
                { 
                    id: 'epub-unique-identifier',
                    string: 'b8f4bc3a-5e00-4c32-9da4-67e66609f33e',
                    type: 'uuid',
                    unique: true
                }
            ],
            languages: [ { id: '', langcode: 'en' } ],
            creators: [
                { id: "creator0", name: 'EPUB 3 Working Group' }
            ],
            publicationDate: '2012-02-27T16:39:36Z',
            modifiedDate: '2012-02-27T16:39:36Z',
            subjects: [],
            description: '',
            format: '',
            publisher: 'EPUB 3 Working Group',
            relation: '',
            coverage: '',
            rights: 'Copyright 2012, EPUB 3 Working Group'
        });

        const manifest = opf.manifest(config, OPFXML);
        assert.deepEqual(manifest, [
            {
              id: 'item0',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'css/epub-spec.css',
              dirname: 'css',
              filename: 'epub-spec.css',
              mime: 'text/css',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: false,
              spine_order: false,
              seen_in_opf: false
            },
            {
              id: 'ci',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'img/epub_logo_color.jpg',
              dirname: 'img',
              filename: 'epub_logo_color.jpg',
              mime: 'image/jpeg',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: false,
              spine_order: false,
              seen_in_opf: false
            },
            {
              id: 'item1',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'img/idpflogo_web_125.jpg',
              dirname: 'img',
              filename: 'idpflogo_web_125.jpg',
              mime: 'image/jpeg',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: false,
              spine_order: false,
              seen_in_opf: false
            },
            {
              id: 'item2',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-acknowledgements.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-acknowledgements.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 7,
              seen_in_opf: false
            },
            {
              id: 'item3',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-changes.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-changes.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 10,
              seen_in_opf: false
            },
            {
              id: 'item4',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-contentdocs.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-contentdocs.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 5,
              seen_in_opf: false
            },
            {
              id: 'item5',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-mediaoverlays.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-mediaoverlays.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 6,
              seen_in_opf: false
            },
            {
              id: 'toc',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-nav.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-nav.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              nav_id: 'toc',
              nav_path: 'xhtml/epub30-nav.xhtml',
              is_nav: true,
              properties: 'nav',
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 1,
              seen_in_opf: false
            },
            {
              id: 'item6',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-ocf.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-ocf.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 9,
              seen_in_opf: false
            },
            {
              id: 'item7',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-overview.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-overview.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 3,
              seen_in_opf: false
            },
            {
              id: 'item8',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-publications.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-publications.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 4,
              seen_in_opf: false
            },
            {
              id: 'item9',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-references.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-references.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 8,
              seen_in_opf: false
            },
            {
              id: 'item10',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-terminology.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-terminology.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 2,
              seen_in_opf: false
            },
            {
              id: 'item11',
              basedir: 'samples-3.0-test/epub30-spec',
              path: 'xhtml/epub30-titlepage.xhtml',
              dirname: 'xhtml',
              filename: 'epub30-titlepage.xhtml',
              mime: 'application/xhtml+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: true,
              spine_order: 0,
              seen_in_opf: false
            },
            {
              id: 'ncx',
              basedir: 'samples-3.0-test/epub30-spec',
              path: '../toc.ncx',
              dirname: '..',
              filename: 'toc.ncx',
              mime: 'application/x-dtbncx+xml',
              mimeoverride: '',
              is_nav: false,
              is_cover_image: false,
              is_mathml: false,
              is_scripted: false,
              is_svg: false,
              is_remote_resources: false,
              is_switch: false,
              suppressOPF: false,
              suppress: false,
              in_spine: false,
              spine_order: false,
              seen_in_opf: false
            }
          ]);

    });


    it('should contain correct toc.ncx', async function() {
        const NCXXML = await opf.readTocNCX(`${testdir}/toc.ncx`);
        assert.isNotNull(NCXXML);
        // NOTE this tests that toc.ncx is there, and that it's readable XML

        // TODO add to opf.js functions to read from toc.ncx
        // TODO add here checks of the content
    });
});

describe('epubcheck-exp', function() {
    it('should validate unpacked EPUB', function(done) {

        this.timeout(40000);

        shell.exec(`npm run check-spec:exp`, function(code, stdout, stderr) {
            if (code !== 0) done(new Error(`Exit code ${code}`));
            else done();
        });
    })
});

describe('package', function() {
    it('should run package command', async function() {
        await bundleEPUB.doPackageCommand(configFN);
    });
});

describe('epubcheck-epub', function() {
    it('should validate EPUB', function(done) {

        this.timeout(40000);

        shell.exec(`npm run check-spec:epub`, function(code, stdout, stderr) {
            if (code !== 0) done(new Error(`Exit code ${code}`));
            else done();
        });
    })
});

// TODO next is to check the bundled EPUB
//      However, the content of the EPUB has already been verified
//      Therefore, it should be enough to verify that the contents match
//      the inputs
//      Further, using epubcheck already ensures the EPUB is correct

