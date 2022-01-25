---
layout: blog.html.ejs
title: EPUBTools 0.8.3 -- Adopting latest xmldom, TypeScript types
publicationDate: January 22, 2022
blogtag: news
tags:
    - EPUBTools
    - Milestone
teaser: |
    EPUBTools version 0.8.3 has been released, eliminating a security warning for the <em>xmldom</em> dependency.  This release also includes TypeScript type definitions files.
---

Running `npm audit` for EPUBTools gave a warning that the `xmldom` package contains a security vulnerability in version 0.6.0 and prior.  Unfortunately 0.6.0 is the last release for this package.

It turns out that the `xmldom` package is stuck in time because of a dispute with GitHub over who owns that project.  Instead, current releases of this package are published under the name `@xmldom/xmldom`.

For documentation see: https://www.npmjs.com/package/@xmldom/xmldom

The bottom line for EPUBTools is that I switched to the new package, `@xmldom/xmldom`, reran the test suite, and all tests passed. 

As for the TypeScript declaration files.  I'm updating a book, _Quick Start to using Typescript and TypeORM in Node.js applications_, and in a moment of enthusiasm for TypeScript type definitions, went ahead and used the TypeScript tools to generate type definition files.  I may also rewrite EPUBTools in TypeScript, but that's a longer term project.

The type files are declared in `package.json` and will be automatically picked up by the appropriate tools.
