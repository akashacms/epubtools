---
title: Create EPUB3 electronic books with an easy/simple workflow
layout: ebook-page.html.ejs
---

Should creating an electronic book require complicated software tools, heavy-weight server applications, expensive proprietary software, etc?  Since an EPUB3 document is simply a ZIP archive containing HTML, XML, and image files, it should be easy to create an eBook.  EPUB3 files can even contain JavaScript, and they support most of the modern HTML5/CSS3 goodness, and again these technologies are available to anyone today for building websites.  EPUB readers that implement the complete EPUB3 specification could offer a fantastic reading experience.  Democratizing the means of producing eBooks should produce positive results in the eBook marketplace.  Therefore, open source software for producing EPUB3 documents with all the bells and whistles is a worthy goal.

That's what **epubtools** is all about.  It is a Node.js package focused on the processing steps around creating and processing EPUB3 documents.

Features:

* Generate the XML metadata files for an EPUB3 document
* Generate an EPUB3 document
* Convert an EPUB3 document to HTML - with page breaks for nicer printing
    * HTML can be converted to PDF using a web browser
* Simple workflows that can be driven with Grunt or npm script's

When generating the EPUB3 document, the HTML files and asset files must already be collected into a correct directory structure.  The rules for this directory structure are straightforward - we'll go over them later.  The XML metadata files do not need to exist in this directory, because epubtools can generate them for you.  

A second tool is in development which will render a directory of Markdown files, and asset files, into a correct directory structure for EPUB3.  Between the two tools you'll have a simple a simple workflow of editing in Markdown, while being able to quickly and easily generate the EPUB3 any time you wish.  With a generated EPUB3, an HTML file is easily generatable, and from that a PDF can be easily generated.

With some work, epubtools could handle output to any number of output formats.  I suggest that an EPUB3 directory structure is an excellent starting point for generating any kind of electronic book output.

But, at the moment we're not even at version 0.2.  So there's a way to go yet.
