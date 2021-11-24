---
layout: blog.html.ejs
title: Announcing EPUBTools and its website
publicationDate: November 19, 2021
blogtag: news
tags:
    - EPUBTools
    - Milestone
teaser: |
    EPUBTools is an application which helps you build EPUB eBooks.  It has been under development for several years, with many changes coming from experience in using this tool to format several books.  It is now easy to use, and competently produces EPUB's that pass the checks in EPUBCheck.
---

The milestones being announced are:

* Getting EPUBTools to a very mature state, which is easy to use
* Getting an associated tool, AkashaRenderEPUB, to a similar easy-to-use state
* Developing this website to publish EPUBTools documentation

EPUBTools is a command-line tool implemented in Node.js that focuses on building eBooks using the EPUB format.  It conforms with EPUB v3, the leading standard in eBook formatting.  Development of this tool began in 2014 when I woke up one morning thinking that EPUB documents are a ZIP archive containing HTML files, and maybe it would be easy to develop a tool.

Between the two tools mentioned, it is easy to write eBooks and format them as EPUB.  Over the intervening years several versions of EPUBTools and AkashaRenderEPUB have existed.  Once formatted this way, your book can be sold through several eBook marketplaces like Amazon's Kindle, Google Play Store, Apple iBooks, etc.

EPUBTools does not render the HTML files to be included in the eBook.  Instead it is focused on building EPUB documents based on data held in a configuration file supplied by the user.

The user is responsible for generating the HTML+CSS+Image files that are to be used in the book.

AkashaRenderEPUB is available to handle that task.  It supports taking Markdown or AsciiDoc files, and rendering them into the format required for generating an EPUB.

Using EPUBTools does not require that you use AkashaRenderEPUB.
