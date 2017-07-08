# GBBRS Boilerplate

Boilerplate workflow for Gulp, Browserify, Babel, React and SASS.

It has taken me quite a while to come up with a pragmatic workflow for Babel, React and SASS. Both browserify and webpack have their pro's and con's. Webpack being so cutting edge at times that node_modeles needed to be debugged (dev webserver port issue comes to mind) and backwards (when needing to compile your own sass module instead of using the the source in ruby) and browserify being annoying with the stream issue in combination with outdated recipes for fixes. Finally settled on a combination that works. With a big thank you to the work done by Dan Harper on browserify and watchify with vinyl. [danharper/gulpfile.js](https://gist.github.com/danharper/3ca2273125f500429945)

Hoping to contribute and hopefully save other people the time and effort of finding out all the quirks and oddities of working with these workflow tools and providing a kickstart boilerplate that can be adjusted to your own specfic needs.

The workflow is based on three stages, development, staging (test) and production. All sources are in the src directory. The gulp script will handle the workflow and you can set the stage by providing the --env option at the commandline.

gulp default will do the development workflow
gulp --env [production,staging or development] 

partial names in the --env parameter will work, script checks for the first letter only so p, s or d work as well.

Next to the environment you can bump or set the version in the package by adding the parameter --bump [patch, minor, major or vX.X.X]

## Workflow DEVELOPMENT will:
* transpile es2015/Babel
* transpile React/JSX
* bundle non uglified files into a bundle.js
* generate sourcemaps

* precompile sass
* generate non compressed css into css/style.css

* copy index.html from src to development

* compress images
* optimize images
* optimize svg
* put generated images into img/

* listen for changes in alle files and restart above tasks when needed
* open a local server on port 8080 with automatic reloading on changes


## Workflow STAGING will:
* clean the staging build directory
* create a complete copy of the development folder into the staging environment

## Workflow PRODUCTION will:
* clean the production build directory

* transpile es2015/Babel
* transpile React/JSX
* bundle uglified files into a bundle.js

* precompile sass
* generate compressed css into css/style.css

* copy index.html from staging to production

* copy images from staging to production