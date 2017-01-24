# iKnowGraphBrowser

iKnowGraphBrowser is a software library that helps you visualize graphs coming from iKnow REST endpoint. 
User can apply filters to graph, select nodes, export them to CSV file.

## Preparing to work with:

This will get you prepared to either running demo version of iKnowGraphBrowser or modifying and building it.

1. Get node.js version 4+ and npm version 3+ for your OS
2. Clone this repository
3. Resolve dependencies with `npm install`

## Running demo

This will run the demo with UI to select iKnow data scenario and ability to select seed word. 
Data will be fethed from iKnow REST endpoint you specify via enviromental variables.    

1. Set IKNOW_ENDPOINT and IKNOW_AUTH environmental variables or edit end of `webpack.demo.config.js` to specify what iKnow REST endpoint to use.
2. Run `npm run demo` to build application and run proxy server. This will launch webpack build process and start development server.
3. Point your browser to `http://localhost:5000` to view UI


## Building library

Library is built using `npm run build` which produce dist/iKnowBrowser.js file with all the JS dependencies of the project. 

## Using library

This is minimal html code to run the library:

```
<!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>iKnowGraphBrowser Demo</title>
   
       <!-- bootstrap styles and some javascript. Dependency on bootstrap is not crucial and can be removed in the future. -->
       <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">
   
       <style>
           html, body, #root {
               height: 100%;
               overflow: hidden;
           }
   
           #root {
               display: flex;
           }
       </style>
   </head>
   <body>
   <div id="root"></div>
   <!-- to build iKnowBrowser.js see docs in README.md -->
   <script src="libs/iKnowBrowser/iKnowBrowser.js"></script>
   <script>
    var demo = new iKnowBrowser(document.getElementById('root'), IKNOW-REST-GRAPH-RESPONSE);
   </script>
  </body>
</html>
```

## Architecture

Library is written in JavaScript ES6 language, it uses modules and webpack to build library bundle with all dependencies.
UI of the library is written using React framework, graph visualization used Linkurious build of sigma.js.

Dependencies:

* file-saver - cross-browser support of launching `Save As` dialog for exporting JSON file
* linkuroius - sigma.js graph visualization library enhanced with numerous plugins, some of them are used
* lodash - general purpose algorithmic/helper library
* react - library by Facebook used to create UI
* react-dom - react library helper
* bootstrap - basic styles/some UI components. Not a strict dependency, could be removed if nessesary.
