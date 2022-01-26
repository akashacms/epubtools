---
layout: blog.html.ejs
title: EPUBTools 0.8.4 -- Conversion to full TypeScript source
publicationDate: January 26, 2022
blogtag: news
tags:
    - EPUBTools
    - Milestone
teaser: |
    EPUBTools version 0.8.4 has been released, with the primary feature being conversion to TypeScript.
---

By converting to TypeScript we are opening the door to refactoring EPUBTools to correctly model the data types of the EPUB specifications.

TypeScript's class system has better data modeling capabilities than vanilla JavaScript.  It is hoped that it will provide a big improvement over the current architecture.

For example - OPF files should be handled by an OPF class.  That class will contain a function to read an OPF from XML, to write an OPF to XML, to read items from the OPF, provide correct data modeling of individual items, and so forth.

The EPUB specifications include several XML files for storing data.  Each of which should receive a treatment like what was just described for OPF.
