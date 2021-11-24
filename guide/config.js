
const akasha  = require('akasharender');

const config = new akasha.Configuration();

config.rootURL("https://akashacms.github.io/epubtools");

config.configDir = __dirname;

config
    .addAssetsDir('assets')
    .addAssetsDir({
        src: 'node_modules/bootstrap/dist',
        dest: 'vendor/bootstrap'
    })
   .addAssetsDir({
        src: 'node_modules/jquery/dist',
        dest: 'vendor/jquery'
    })
    .addAssetsDir({
        src: 'node_modules/popper.js/dist',
        dest: 'vendor/popper.js'
    })
    .addAssetsDir({
        src: 'node_modules/@fortawesome/fontawesome-free',
        dest: 'vendor/fontawesome-free'
    })
    .addLayoutsDir('layouts')
    .addDocumentsDir('documents')
    .addDocumentsDir({
        src: 'guide',
        dest: 'guide',
        baseMetadata: {
            bookHomeURL: "/guide/index.html",
            title: "EPUBTools Table of Contents",
            tags: "AkashaRender",
            headerHeight: "140px",
            bookTitle: "EPUBTools User Guide",
            bookAuthor: "David Herron",
            authors: "David Herron",
            published: "2021 David Herron",
            language: "English",
            coverImage: "/images/EPUBTools-User-Guide.png",
            logoImage: "/images/EPUBTools-User-Guide.png",
            noLogoImage: "false"
        }
    })
    .addPartialsDir('partials');

config.setRenderDestination('out');

config
    .use(require('@akashacms/theme-bootstrap'))
    .use(require('@akashacms/plugins-base'), {
        generateSitemapFlag: true
    })
    .use(require('@akashacms/plugins-breadcrumbs'))
    .use(require('@akashacms/plugins-booknav'))
    .use(require('akashacms-external-links'))
    .use(require('@akashacms/plugins-footnotes'))
    .use(require('@akashacms/plugins-tagged-content'), {
        sortBy: 'title',
        // @tagDescription@ can only appear once
        headerTemplate: "---\ntitle: @title@\nlayout: tagpage.html.ejs\n---\n<p><a href='./index.html'>Tag Index</a></p><p>Pages with tag @tagName@</p><p>@tagDescription@</p>",
        indexTemplate: "---\ntitle: Tags for AkashaCMS Example site\nlayout: tagpage.html.ejs\n---\n",
        pathIndexes: '/tags/'
    })
    .use(require('@akashacms/plugins-blog-podcast'), {
        bloglist: {
            news: {
                rss: {
                    title: "EPUBTools News",
                    description: "Announcements and news about EPUBTools",
                    site_url: "http://akashacms.github.io/news/index.html",
                    // image_url: "http://akashacms.com/logo.gif",
                    managingEditor: 'David Herron',
                    webMaster: 'David Herron',
                    copyright: '2021 David Herron',
                    language: 'en',
                    categories: [ "Node.js", "Content Management System", "HTML5", "Static website generator" ]
                },
                rssurl: "/news/rss.xml",
                rootPath: "news",
                matchers: {
                    layouts: [ "blog.html.ejs", "blog.html.njk" ],
                    path: /^news\//
                }
            }
        }
    })
    .use(require('epub-website'));

config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/popper.js/umd/popper.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js" })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({       href: "/css/flatly.min.css" })
    .addStylesheet({       href: "/css/style.css" })
    .addStylesheet({ href: "/vendor/fontawesome-free/css/all.min.css" });

config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    decodeEntities: true
});
   
config.prepare();
module.exports = config;
 