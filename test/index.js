
const { promisify } = require('util');
const { assert } = require('chai');
const epubtools  = require('../index');
const epubconfig = require('../Configuration');


describe('read config file', function() {
    
    let config;
    const configFN = 'test.epubtools';

    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });

    it('should have correct config file name', function() {
        assert.equal(config.configFileName, configFN);
    });

    it('should have correct EPUB file name', function() {
        assert.equal(config.epubFileName, 'test.epub');
    });
    
    it('should have correct project name', function() {
        assert.equal(config.projectName, 'Test AkashaEPUB book');
    });
    
    it('should have correct bookOPF path', function() {
        assert.equal(config.bookOPF, "test.opf");
    });
    
    it('should have correct renderedPath path', function() {
        assert.equal(config.renderedPath, "out");
    });
    
    it('should have correct bookOPFFullPath path', function() {
        assert.equal(config.bookOPFFullPath, "out/test.opf");
    });
    
    it('should have correct sourceBookNCXID', function() {
        assert.equal(config.sourceBookNCXID, "ncx");
    });
    
    it('should have correct sourceBookNCXHREF', function() {
        assert.equal(config.sourceBookNCXHREF, "toc.ncx");
    });
    
    it('should have correct sourceBookTOCID', function() {
        assert.equal(config.sourceBookTOCID, "toc");
    });
    
    // TODO Is this correct?  Shouldn't it be toc.html?
    it('should have correct sourceBookTOCHREF', function() {
        assert.equal(config.sourceBookTOCHREF, "toc.html.ejs");
    });
    
    it('should have correct sourceBookCoverID', function() {
        assert.equal(config.sourceBookCoverID, "cover-image");
    });
    
    it('should have correct sourceBookCoverHREF', function() {
        assert.equal(config.sourceBookCoverHREF, "images/Human-Skeleton.jpg");
    });
    
    it('should have correct sourceBookCoverHTMLID', function() {
        assert.equal(config.sourceBookCoverHTMLID, "cover-html");
    });
    
    it('should have correct opfTitles', function() {
        assert.deepEqual(config.opfTitles, [ {
            id: '',
            title: "Skeletal AkashaEPUB book",
            type: "main"
        } ]);
    });
    
    it('should have correct opfLanguages', function() {
        assert.deepEqual(config.opfLanguages, [ {
            id: '',
            langcode: "en"
        } ]);
    });
    
    it('should have correct opfCreators', function() {
        assert.deepEqual(config.opfCreators, [ {
            id: '',
            name: "David Herron",
            role: 'author'
        } ]);
    });
    
    it('should have correct opfSubjects', function() {
        assert.deepEqual(config.opfSubjects, []);
    });
    
    it('should have correct opfIdentifiers', function() {
        assert.deepEqual(config.opfIdentifiers, [ {
            unique: "unique",
            type: "uuid",
            string: "2db2943e-3e10-11e9-a517-8f0be7b86995"
        } ]);
    });
    
    it('should have correct bookMetaSourceType', function() {
        assert.equal(config.bookMetaSourceType, "");
    });
    
    it('should have correct bookMetaSourceID', function() {
        assert.equal(config.bookMetaSourceID, "");
    });
    
    it('should have correct opfPublisher', function() {
        assert.equal(config.opfPublisher, "David Herron");
    });
    
    it('should have correct opfPublicationDate', function() {
        assert.equal(config.opfPublicationDate, '2012-02-20T00:01:01Z');
    });
    
    it('should have correct opfModifiedDate', function() {
        assert.equal(config.opfModifiedDate, '2019-03-06T00:00:00Z');
    });
    
    it('should have correct opfDescription', function() {
        assert.equal(config.opfDescription, '');
    });
    
    it('should have correct opfFormat', function() {
        assert.equal(config.opfFormat, '');
    });
    
    it('should have correct opfRelation', function() {
        assert.deepEqual(config.opfRelation, '');
    });
    
    it('should have correct opfCoverage', function() {
        assert.deepEqual(config.opfCoverage, '');
    });
    
    it('should have correct opfRights', function() {
        assert.deepEqual(config.opfRights, 'Copyright 2019, David Herron');
    });
    
});

describe('modify config file', function() {
    
    let config;
    const configFN = 'test.epubtools';

    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });

    // Test the set methods

    it('should correctly change config file name', function() {
        let foo = 'foo.epubtools';
        config.configFileName = foo;
        assert.equal(config.configFileName, foo);
    });

    it('should correctly change EPUB file name', function() {
        let foo = 'foo.epub';
        config.epubFileName = foo;
        assert.equal(config.epubFileName, foo);
    });
    
    it('should correctly change project name', function() {
        let foo = 'Foo AkashaEPUB book';
        config.projectName = foo;
        assert.equal(config.projectName, foo);
    });
    
    it('should correctly change renderedPath path', function() {
        let foo = 'foocuments';
        config.renderedPath = foo;
        assert.equal(config.renderedPath, foo);
    });
    
    it('should correctly change bookOPF path', function() {
        let foo = 'foo.opf';
        config.bookOPF = foo;
        assert.equal(config.bookOPF, foo);
    });
    
    it('should correctly change bookOPFFullPath path', function() {
        // let foo = 'foocuments/foo.opf';
        // config.bookOPFFullPath = foo;
        // There were earlier changes to the values that make up this item.
        assert.equal(config.bookOPFFullPath, 'foocuments/foo.opf');
    });
    
    it('should correctly change sourceBookNCXID', function() {
        let foo = 'foocx';
        config.sourceBookNCXID = foo;
        assert.equal(config.sourceBookNCXID, foo);
    });
    
    it('should correctly change sourceBookNCXHREF', function() {
        let foo = 'foocx.ncx';
        config.sourceBookNCXHREF = foo;
        assert.equal(config.sourceBookNCXHREF, foo);
    });
    
    it('should correctly change sourceBookTOCID', function() {
        let foo = 'footoc';
        config.sourceBookTOCID = foo;
        assert.equal(config.sourceBookTOCID, foo);
    });
    
    // TODO Is this correct?  Shouldn't it be toc.html?
    it('should correctly change sourceBookTOCHREF', function() {
        let foo = 'footoc.html.ejs';
        config.sourceBookTOCHREF = foo;
        assert.equal(config.sourceBookTOCHREF, foo);
    });
    
    it('should correctly change sourceBookCoverID', function() {
        let foo = 'foover-image';
        config.sourceBookCoverID = foo;
        assert.equal(config.sourceBookCoverID, foo);
    });
    
    it('should correctly change sourceBookCoverHREF', function() {
        let foo = 'foomages/Human-Skeleton.jpg';
        config.sourceBookCoverHREF = foo;
        assert.equal(config.sourceBookCoverHREF, foo);
    });
    
    it('should correctly change sourceBookCoverHTMLID', function() {
        let foo = 'foover-html';
        config.sourceBookCoverHTMLID = foo;
        assert.equal(config.sourceBookCoverHTMLID, foo);
    });
    
    it('should correctly change opfTitles', function() {
        let toadd = {
            id: 'foo',
            title: "Fooletal AkashaEPUB book",
            type: "main"
        };
        config.opfTitles.push(toadd);
        assert.deepEqual(config.opfTitles, [ {
            id: '',
            title: "Skeletal AkashaEPUB book",
            type: "main"
        }, toadd ]);
    });
    
    it('should have correctly changed opfTitles', function() {
        assert.deepEqual(config.opfTitles, [ {
            id: '',
            title: "Skeletal AkashaEPUB book",
            type: "main"
        }, {
            id: 'foo',
            title: "Fooletal AkashaEPUB book",
            type: "main"
        } ]);
    });

    it('should correctly change opfLanguages', function() {
        let toadd = {
            id: 'foo',
            langcode: "en"
        };
        config.opfLanguages.push(toadd);
        assert.deepEqual(config.opfLanguages, [ {
            id: '',
            langcode: "en"
        }, toadd ]);
    });
    
    it('should correctly change opfCreators', function() {
        let toadd = {
            id: 'foo',
            name: "Foovid Herron",
            role: 'author'
        };
        config.opfCreators.push(toadd);
        assert.deepEqual(config.opfCreators, [ {
            id: '',
            name: "David Herron",
            role: 'author'
        }, toadd ]);
    });
    
    it('should correctly change opfSubjects', function() {
        config.opfSubjects.push('fooject');
        assert.deepEqual(config.opfSubjects, [ 'fooject' ]);
    });
    
    it('should correctly change opfIdentifiers', function() {
        let toadd = {
            unique: "unique",
            type: "uuid",
            string: "1fa48d35-5caf-49ea-90fd-91d340289a90"
        };
        config.opfIdentifiers.push(toadd);
        assert.deepEqual(config.opfIdentifiers, [ {
            unique: "unique",
            type: "uuid",
            string: "2db2943e-3e10-11e9-a517-8f0be7b86995"
        }, toadd ]);
    });
    
    it('should correctly change bookMetaSourceType', function() {
        let foo = 'foourse';
        config.bookMetaSourceType = foo;
        assert.equal(config.bookMetaSourceType, foo);
    });
    
    it('should correctly change bookMetaSourceID', function() {
        let foo = 'fooid';
        config.bookMetaSourceID = foo;
        assert.equal(config.bookMetaSourceID, foo);
    });
    
    it('should correctly change opfPublisher', function() {
        let foo = 'Foovid Herron';
        config.opfPublisher = foo;
        assert.equal(config.opfPublisher, foo);
    });
    
    it('should correctly change opfPublicationDate', function() {
        let foo = '2013-03-20T03:01:01Z';
        config.opfPublicationDate = foo;
        assert.equal(config.opfPublicationDate, foo);
    });
    
    it('should correctly change opfModifiedDate', function() {
        let foo = '2020-03-06T00:00:00Z';
        config.opfModifiedDate = foo;
        assert.equal(config.opfModifiedDate, foo);
    });
    
    it('should correctly change opfDescription', function() {
        let foo = 'fooDescription';
        config.opfDescription = foo;
        assert.equal(config.opfDescription, foo);
    });
    
    it('should correctly change opfFormat', function() {
        let foo = 'fooFormat';
        config.opfFormat = foo;
        assert.equal(config.opfFormat, foo);
    });
    
    it('should correctly change opfRelation', function() {
        let foo = 'fooRelation';
        config.opfRelation = foo;
        assert.deepEqual(config.opfRelation, foo);
    });
    
    it('should correctly change opfCoverage', function() {
        let foo = 'fooCoverage';
        config.opfCoverage = foo;
        assert.deepEqual(config.opfCoverage, foo);
    });
    
    it('should correctly change opfRights', function() {
        let foo = 'Copyright 2020, Foovid Herron';
        config.opfRights = foo;
        assert.deepEqual(config.opfRights, foo);
    });
    
});

describe('save modified config file', function() {
    
    let config;
    const configFN = 'test.epubtools';

    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });

    // Modify a few fields
    // Save the file
    // Read it again
    // Check that modifications held
    
    let addID = {
        unique: "unique",
        type: "uuid",
        string: "1fa48d35-5caf-49ea-90fd-91d340289a90"
    };
    let addLang = {
        id: 'foo',
        langcode: "en"
    };
    it('should modify the config object', function() {
        config.opfIdentifiers.push(addID);
        config.opfLanguages.push(addLang);
    });

    it('should have changed opfIdentifiers', function() {
        assert.deepEqual(config.opfIdentifiers, [ {
            unique: "unique",
            type: "uuid",
            string: "2db2943e-3e10-11e9-a517-8f0be7b86995"
        }, addID ]);
    });
    
    it('should have changed opfLanguages', function() {
        assert.deepEqual(config.opfLanguages, [ {
            id: '',
            langcode: "en"
        }, addLang ]);
    });
    
    let newFileName = 'modified.epubtools';
    it('should save the config object', async function() {
        config.configFileName = newFileName;
        await config.save();
    });

    let newConfig;
    it('should read the modified config', async function() {
        newConfig = await epubconfig.readConfig(newFileName);
    });

    it('should read changed opfIdentifiers', function() {
        assert.deepEqual(newConfig.opfIdentifiers, [ {
            unique: "unique",
            type: "uuid",
            string: "2db2943e-3e10-11e9-a517-8f0be7b86995"
        }, {
            unique: "unique",
            type: "uuid",
            string: "1fa48d35-5caf-49ea-90fd-91d340289a90"
        } ]);
    });
    
    it('should read changed opfLanguages', function() {
        assert.deepEqual(newConfig.opfLanguages, [ {
            id: '',
            langcode: "en"
        }, {
            id: 'foo',
            langcode: "en"
        } ]);
    });
    
});
