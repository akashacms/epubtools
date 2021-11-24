---
title: Packaging EPUB's with EPUBTools
layout: ebook-page.html.ejs
---

Now that we know how to configure a EPUBTools project, and to generate the metafiles, let's learn about bundling an EPUB.

To review, an EPUB v3 container is a ZIP file containing files, including XHTML, CSS, images, and various metadata files.  We saw this [when setting up a project directory](setup.html) when we bundled the EPUB v3 Specification, then used `unzip` to look at the content.

Before you think - what's the point of EPUBTools?  Why not just use ZIP to package the EPUB?  There are two reasons, the first being the [metadata files we discussed in the previous section](mkmeta.html).  The second is some specific requirements, specifically that the EPUB v3 specification requires that the first file in the container must be a file named `mimetype`, with specific content, and that it cannot be compressed.  This is so that the EPUB container has a specific fingerprint at the front of the file so that software can readily identify it as an EPUB.

What does it mean to say we use EPUBTools to "package" the EPUB?  It's simple, namely that we must have a directory structure containing the files to be bundled as the EPUB.  After arranging to have those files, we must ensure to generate the metadata files.

The task of generating the files is outside the scope of EPUBTools.  But, what are the characteristics of these files?

The EPUB v3 specification included in the EPUBTools workspace was published in 2011 on the IDPF website.  Since then the IDPF (International Digital Publishing Forum) became the W3C Publishing group, which has the focus of publishing book-like things both on the Web and via eBooks.  While the IDPF website is still available, and all the old documents are still there, the W3C committees have moved on and in 2019 published EPUB 3.2.

The point of bringing this up is, the answer to the question of the characteristics of the files you include in EPUB's is answered in great detail in the EPUB 3 and EPUB 3.2 specification documents.

The 20,000 foot summary is this:

* Content documents can be either XHTML or SVG.   XHTML was chosen because it conforms with XML and is apparently easier to process.  Specifically, it is a subset of HTML5 serialized as XHTML.  The SVG is SVG.
* Other sorts of images (PNG, JPEG, etc) are supported
* The CSS is a subset of CSS3
* Limited use of JavaScript is allowed
* Audio and video files can be embedded in the EPUB, and displayed using the `audio` and `video` tags
* EPUB 3 supports OpenType and WOFF fonts

For details, see:

* EPUB 3 Overview https://www.w3.org/publishing/epub3/epub-overview.html
* EPUB 3.2 https://www.w3.org/publishing/epub3/epub-spec.html
* EPUB Content Documents 3.2 https://www.w3.org/publishing/epub32/epub-contentdocs.html

It is important to know that EPUBTools does not fully implement EPUB 3, nor EPUB 3.2.  However, we routinely use EPUBCheck (https://github.com/w3c/epubcheck) to validate that EPUBTools is producing conformant EPUB files.

# Bundling an EPUB using EPUBTools

To bundle an EPUB, run this command:

```
$ epubtools package --help
Usage: epubtools package [options] <configFN>

Package an EPUB3 file from a directory

Options:
  -h, --help  display help for command
```

As you see, the only command option is the name for the configuration file.

Run the command, and out pops the EPUB as it is named in the configuration file.

To make this simpler, we earlier recommended the following `scripts` section in `package.json`:

```json
 "scripts": {
    "build": "npm-run-all build:*",
    "build:mkmeta": "epubtools mkmeta epub30-spec.epubtools",
    "build:bundle": "epubtools package epub30-spec.epubtools"
},
```

With this, you simply run `npm run build` and both `mkmeta` and `package` is executed.

# Live rebuilding an EPUB using EPUBTools watch mode

EPUBTools also supports live rebuild triggered by changes to files in the `rendered` directory.  This is convenient, because you can be editing files, then automatically have the EPUB rebuilt.

To implement this, in `package.json` add this to the `scripts` section:

```json
"watch": "epubtools watch epub30-spec.epubtools"
```

With that available, simply run `npm run watch`.

