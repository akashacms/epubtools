
const { promisify } = require('util');
const { assert } = require('chai');
const epubtools  = require('../index');
const epubconfig = require('../Configuration');
const manifest  = require('../manifest');


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

describe('read TOC data', function() {
    it('should read TOC data', async function() {
        await config.readTOCData();
        // console.log(config.tocdata);
    });
});

describe('check TOC data', function() {
    let expected = [
        {
            text: 'EPUB 3.0 Specification',
            href: 'EPUB/xhtml/epub30-titlepage.xhtml',
            id: 'ttl',
            children: 0
        },
        {
          text: 'EPUB 3 Specifications - Table of Contents',
          href: 'EPUB/xhtml/epub30-nav.xhtml',
          id: 'nav',
          children: 0
        },
        {
          text: 'Terminology',
          href: 'EPUB/xhtml/epub30-terminology.xhtml',
          id: 'term',
          children: 0
        },
        {
          text: 'EPUB 3 Overview',
          href: 'EPUB/xhtml/epub30-overview.xhtml',
          id: 'ovw',
          children: 4
        },
        {
          text: 'EPUB Publications 3.0',
          href: 'EPUB/xhtml/epub30-publications.xhtml',
          id: 'pub',
          children: 7
        },
        {
          text: 'EPUB Content Documents 3.0',
          href: 'EPUB/xhtml/epub30-contentdocs.xhtml',
          id: 'cd',
          children: 6
        },
        {
          text: 'EPUB Media Overlays 3.0',
          href: 'EPUB/xhtml/epub30-mediaoverlays.xhtml',
          id: 'mo',
          children: 6
        },
        {
          text: 'Acknowledgements and Contributors',
          href: 'EPUB/xhtml/epub30-acknowledgements.xhtml',
          id: 'ack',
          children: 0
        },
        {
          text: 'References',
          href: 'EPUB/xhtml/epub30-references.xhtml',
          id: 'ref',
          children: 0
        },
        {
          text: 'EPUB Open Container Format (OCF) 3.0',
          href: 'EPUB/xhtml/epub30-ocf.xhtml',
          id: 'ocf',
          children: 7
        },
        {
          text: 'EPUB 3 Changes from EPUB 2.0.1',
          href: 'EPUB/xhtml/epub30-changes.xhtml',
          id: 'cha',
          children: 4
        }
    ];
    it('should match expected TOC data', function() {
        assert.deepEqual(config.tocdata.filter(item => {
            item.children = item.children.length;
            return item;
        }), expected);
    })
});