// Load necessary framework
Mocha.sharedRuntime().loadFrameworkWithName('CoreFoundation');

//Let's import the library that allows us to talk with the UI
@import "MochaJSDelegate.js";
@import "constraints.js";
@import "functions.js";
@import "flip-within-parent.js";

// let's get a hold on the Sketch API
const sketch = require('sketch')

// var sketch = require('sketch');
var ui = require('sketch/ui');

const util = require('util')


let Style = sketch.Style
let ShapePath = sketch.ShapePath
let Text = sketch.Text
let Rectangle = sketch.Rectangle

// var selectedLayers = document.selectedLayers;
// var selectedLayer = selectedLayers.layers[0];
// var selectedCount = selectedLayers.length;



// var libraries = require('sketch/dom').getLibraries()
//
// var Library = require('sketch/dom').Library

//let's expose these globally
var document;
var page;

//the main function we run when we execute the plugin. It creates the webview and hooks
function onRun(context) {
  console.log("start: " + Date.now())

  document = sketch.fromNative(context.document)
  page = document.selectedPage;
  var selectedLayers = document.selectedLayers.layers;


  // var originalSelectedLayers = selectedLayers;
  var resultingSelectedLayers = [];


  var tokensSpacingKeys = ["xs","sm","md","lg","xl"]
  var tokensSpacingValues = ["4","8","16","32","64"]


  // if (selectedLayers.length == 0) {
  //   ui.message("🪄: Please select at least a Layer or Artboard 🙏");
  if (0) {
    //ui.message("🪄: Please select at least a Layer or Artboard 🙏");

  } else {
    //A couple of functions used in the plugin:
    //A function to count the number of artboards in the page
    function artboardsCount() {
      var artboardCount = 0;
      var artboardNames = "";
      for (x=0;x<selectedLayers.length;x++) {
        if (selectedLayers[x].type == 'Artboard') {
          artboardCount = artboardCount+1;
          // artboardCount = artboardCount+","+selectedLayers[x].name;
        }
      }
      // return artboardCount;
      //
      // ui.message("🪄: Set Chat URL to "+ result + " 👏 🚀");
      // Settings.setDocumentSettingForKey(document, 'chatUrl', result)
      return artboardCount;
    }

    //A couple of functions used in the plugin:
    //A function to pass the selected layers
    function selectedLayersNames() {
      var selectedLayersCount = 0;
      var selectedLayersNames = []
      for (l=0;l<selectedLayers.length;l++) {
        selectedLayersNames.push(selectedLayers[l].name);
      }

      var selectedLayerName = selectedLayers[0].name;
      // console.log(selectedLayersNames.join(","))
      selectedLayersNames = selectedLayersNames.join(",")
      // return selectedLayersNames;

      // ui.message("🪄: "+ selectedLayersNames + " 👏 🚀");
      ui.message("🪄: Let's go! 🚀");

      return selectedLayersNames;
    }

    // function selectedLayersMeta() {
    //   var selectedLayersCount = 0;
    //   var selectedLayersMeta = []
    //   for (l=0;l<selectedLayers.length;l++) {
    //     //Settings.setLayerSettingForKey(layer, 'meta', myLayerX);
    //
    //     var myLayerX = Settings.layerSettingForKey(selectedLayers[l], 'meta');
    //     selectedLayersMeta.push(myLayerX);
    //   }
    //
    //   var selectedLayerMeta = Settings.layerSettingForKey(selectedLayers[0], 'meta') ;
    //   // console.log(selectedLayersMeta.join(","))
    //   selectedLayersMeta = selectedLayersMeta.join(",")
    //   // return selectedLayersNames;
    //
    //   //ui.message("🪄: Meta from selected layer: "+ selectedLayersMeta + " 👏 🚀");
    //
    //
    //   return selectedLayersMeta;
    // }


    var userDefaults = NSUserDefaults.standardUserDefaults();

    // Create a window
    var title = "🪄";
    var identifier = "com.fbmore.magicwand";
    var threadDictionary = NSThread.mainThread().threadDictionary();

    if (threadDictionary[identifier]) {
      return;
    }

    var windowWidth = 200,
    windowHeight = 454;
    var webViewWindow = NSPanel.alloc().init();
    webViewWindow.setFrame_display(NSMakeRect(0, 0, windowWidth, windowHeight), true);
    // webViewWindow.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSResizableWindowMask);
    webViewWindow.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask);

    //Uncomment the following line to define the app bar color with an NSColor
    //webViewWindow.setBackgroundColor(NSColor.whiteColor());
    webViewWindow.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    webViewWindow.standardWindowButton(NSWindowZoomButton).setHidden(true);
    webViewWindow.setTitle(title);
    webViewWindow.setTitlebarAppearsTransparent(true);
    webViewWindow.becomeKeyWindow();
    webViewWindow.setLevel(NSFloatingWindowLevel);
    threadDictionary[identifier] = webViewWindow;
    COScript.currentCOScript().setShouldKeepAround_(true);

    //Add Web View to window
    var webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, windowWidth, windowHeight - 24));
    webView.setAutoresizingMask(NSViewWidthSizable|NSViewHeightSizable);
    var windowObject = webView.windowScriptObject();
    var delegate = new MochaJSDelegate({

      "webView:didFinishLoadForFrame:" : (function(webView, webFrame) {
        //We call this function when we know that the webview has finished loading
        //It's a function in the UI and we run it with a return coming from the artboardCount
        // windowObject.evaluateWebScript("updateInput("+artboardsCount()+")");
        // windowObject.evaluateWebScript("updateSelectedLayersNames('yo');");
        // windowObject.evaluateWebScript("updateInput('yo')");
        windowObject.evaluateWebScript("updateSelectedLayersNames('"+selectedLayersNames()+"')");
        // windowObject.evaluateWebScript("updateSelectedLayersData('"+selectedLayersMeta()+"')");
        //updateSelectedLayersNames();
      }),

      //To get commands from the webView we observe the location hash: if it changes, we do something
      "webView:didChangeLocationWithinPageForFrame:" : (function(webView, webFrame) {
        var locationHash = windowObject.evaluateWebScript("window.location.hash");
        //The hash object exposes commands and parameters
        //In example, if you send updateHash('add','artboardName','Mark')
        //You’ll be able to use hash.artboardName to return 'Mark'
        var hash = parseHash(locationHash);
        //We parse the location hash and check for the command we are sending from the UI
        //If the command exist we run the following code
        if (hash.hasOwnProperty('update')) {
          //In example updating the artboard count based on the current contex.
          //The evaluateWebScript function allows us to call a function from the UI.html with parameters
          //coming from Sketch
          windowObject.evaluateWebScript("updateInput("+artboardsCount()+");");


        } else if (hash.hasOwnProperty('saveData')) {
          //If you are sending arguments from the UI
          //You can simply grab them from the hash object

          // var abCount = 2;
          //windowObject.evaluateWebScript("updateInput("+artboardsCount()+");");


          selectedLayers = document.selectedLayers;

          
          // Catch CMD + Z in Webview

          if (hash.direction.toLowerCase() == "undo"){
            //MSUndoAction
            console.log("undo---")
            // ui.message("🪄: Undo! 👏 🚀");

            context.document.actionsController().actionForID("MSUndoAction").doPerformAction(null);

          } 
          if (hash.direction.toLowerCase() == "redo"){
            //MSUndoAction
            console.log("redo---")
            // ui.message("🪄: Undo! 👏 🚀");

            context.document.actionsController().actionForID("MSRedoAction").doPerformAction(null);

          } 


          if ((selectedLayers.length == 0) && (hash.direction.toLowerCase() != "undo")){
            ui.message("🪄: Please select at least a Layer or Artboard 🙏");
          }


          for (j = 0; j < selectedLayers.length; ++j){


            var layer = selectedLayers.layers[j]

            // var layer = selectedLayers[0]


            // read values from webview
            var myLayerX = hash.myLayerX.toLowerCase();
            console.log(myLayerX)
            var myLayerY = hash.myLayerY.toLowerCase();
            console.log(myLayerY)
            var myDirection = hash.direction.toLowerCase();


            // X and Y as values

            // if (myLayerX == "x"){
            //   console.log("keep x")
            //   console.log(myLayerX)
            //   console.log(layer.frame.x)
            //   myLayerX = layer.frame.x;
            //   console.log("keep x after assignment")
            //   console.log(myLayerX)
            
            // }
            
            // if (myLayerX == "y"){
            //   console.log("keep y")
            //   console.log(myLayerY)
            //   console.log(layer.frame.y)
            //   myLayerY = layer.frame.y;
            //   console.log("keep y after assignment")
            //   console.log(myLayerY)
            // }
            
            // layer.frame.x = myLayerX
            // layer.frame.y = myLayerY
            

            //And then use them in your functions: in example setting position



            if (tokensSpacingKeys.indexOf(myLayerX) != -1){
              myLayerX = tokensSpacingValues[tokensSpacingKeys.indexOf(myLayerX)]
            }

            if (tokensSpacingKeys.indexOf(myLayerY) != -1){
              myLayerY = tokensSpacingValues[tokensSpacingKeys.indexOf(myLayerY)]
            }

            if (myLayerX.includes("%")){
              myLayerX = parseInt(myLayerX.replace("%",""))
              myLayerX = layer.parent.frame.width * (myLayerX/100)
            }

            if (myLayerY.includes("%")){
              myLayerY = parseInt(myLayerY.replace("%",""))
              myLayerY = layer.parent.frame.height * (myLayerY/100)
            }

            // console.log("myLayerX after")
            // console.log(myLayerX)



            /// LAYOUT SETTINGS

            if (layer.type === "Artboard"){
              var parentArtboard = layer;
            } else {
              var parentArtboard = layer.getParentArtboard();
            }

            // var parentArtboard = layer.getParentArtboard();

            if (parentArtboard.sketchObject.layout() !== null ){

              var layout = parentArtboard.sketchObject.layout()
              var columnWidth = layout.columnWidth();
              var drawHorizontal = layout.drawHorizontal();
              var drawHorizontalLines = layout.drawHorizontalLines();
              var drawVertical = layout.drawVertical();
              var gutterHeight = layout.gutterHeight();
              var gutterWidth = layout.gutterWidth();
              var guttersOutside = layout.guttersOutside();
              var horizontalOffset = layout.horizontalOffset();
              var isEnabled = layout.isEnabled();
              var numberOfColumns = layout.numberOfColumns();
              var rowHeightMultiplication = layout.rowHeightMultiplication();
              var totalWidth = layout.totalWidth()

              console.log(columnWidth)
              console.log(gutterWidth)
              console.log(guttersOutside)


              // COLUMNS as values

              if (myLayerX.includes("c")){
                myLayerX = myLayerX.replace("c","");
                if (myLayerX == 1) {
                  myLayerX = horizontalOffset
                } else {
                  myLayerX = horizontalOffset + columnWidth * (myLayerX - 1) + gutterWidth * (myLayerX - 1);
                }
                console.log("Cols:" + myLayerX)

              }

              if (myLayerY.includes("c")){
                myLayerY = myLayerY.replace("c","");
                if (myLayerY == 1) {
                  myLayerY = 0;
                  //horizontalOffset is removed for vertical spacing
                } else {
                  myLayerY = columnWidth * (myLayerY - 1) + gutterWidth * (myLayerY - 1);
                }
                console.log("Cols:" + myLayerY)
              }

            } 
            // else {
            //   ui.message("🪄: Please define layout settings first! 👏 🚀");

            // }



            // rems to px

            // if (myLayerX.includes("rem")){
            //
            //   myLayerX = myLayerX.replace("rem","");
            //
            //   var base = tokensBaseFontValues[0]
            //
            //   myLayerX = myLayerX * base;
            //
            //   console.log("rem:" + myLayerX)
            //
            //   // if (layer.parent == "Group") {
            //   //   layer.parent.adjustToFit();
            //   // }
            //
            // }



            // layer.frame.width = 100
            // layer.frame.height = 1000

            /// LOGIC BASED ON DIRECTION

            var h = myDirection[1]
            var v = myDirection[0]
            // console.log(h + v)

            ///

            // var prop = h
            var prop = myDirection
            var valuex = parseInt(myLayerX) || 0
            var valuey = parseInt(myLayerY) || 0



            console.log("prop: " + prop)




            /// HORIZZONTAL

            if (prop.includes("r")){
              console.log("From Right")
              // valuex = parseInt(valuex)
              layer.frame.x = layer.parent.frame.width - layer.frame.width - valuex;
            }

            if (prop.includes("l")){
              console.log("From Left")
              // valuex = parseInt(valuex)
              layer.frame.x = valuex;
            }

            if (prop.includes("c")){
              console.log("Center")
              // valuex = parseInt(valuex)
              // layer.frame.height = layer.parent.frame.height - 2*valuex;
              layer.frame.x = layer.parent.frame.width/2 - layer.frame.width/2 - valuex;
            }


            /// VERTICAL

            // prop = v

            if (prop.includes("t")){
              console.log("From Top")
              // valuey = parseInt(valuey)
              layer.frame.y = valuey;
            }

            if (prop.includes("b")){
              console.log("From Bottom")
              // valuey = parseInt(valuey)
              // layer.frame.y = layer.parent.frame.height - layer.frame.height - valuey;
              layer.frame.y = layer.parent.frame.height - layer.frame.height - valuey;
            }

            if (prop.includes("m")){
              console.log("Middle")
              // layer.frame.x = value;
              layer.frame.y = layer.parent.frame.height/2 - layer.frame.height/2 - valuey;
              // layer.frame.width = layer.parent.frame.width - 2*valuey;
            }


            if (prop == "fw"){
              console.log("fullwidth")
              layer.frame.x = valuex;
              // layer.frame.y = valuey;
              layer.frame.width = layer.parent.frame.width - 2*valuex;
            }

            if (prop == "fh"){
              console.log("fullheight")
              layer.frame.y = valuey;
              // layer.frame.x = valuex;
              layer.frame.height = layer.parent.frame.height - 2*valuey;
            }

            if (prop == "fs"){
              console.log("fullsize")
              if (layer.type == "Text"){
                console.log("fullsize")
                // layer.fixedWidth = true;
                // fixedWidth
                console.log(layer.fixedWidth)
              }

              layer.frame.x = valuex;
              layer.frame.y = valuey;
              layer.frame.width = layer.parent.frame.width - 2*valuex;
              layer.frame.height = layer.parent.frame.height - 2*valuey;

            }

            /// RTL

            if (prop == "%3e---%3e"){
              console.log("RTL/flip imported")
              flipPositionAndPins()
            }



            /// Padded Shape layer

            if (prop == "+---+"){

              console.log("padded layer")

              var paddedLayerColor = '#F2F2F2'

              if (layer.type != "Text"){
                paddedLayerColor = '#D3D3D3'
              }

              var paddedLayer = new ShapePath({
                name: layer.name,
                frame: new Rectangle(layer.frame.x - valuex,layer.frame.y - valuey,layer.frame.width + valuex*2,layer.frame.height + valuey*2),
                parent: layer.parent
              })

              paddedLayer.style.fills = [
                {
                  color: paddedLayerColor,
                  fillType: Style.FillType.Color,
                },
              ]


              layer.selected = false;

              var layerIndex = layer.index;

              console.log("valuex")
              console.log(valuex)

              if (valuex > 0) {
                paddedLayer.index = layerIndex;
              } else {
                paddedLayer.index = layerIndex + 1;
              }

              paddedLayer.selected = true;

              console.log("layer.index")
              console.log(layer.index)
              console.log("rectangle.index")
              console.log(paddedLayer.index)
              console.log("padded layer")

              var layerResizingConstraint = layer.sketchObject.resizingConstraint();
              paddedLayer.sketchObject.setResizingConstraint(layerResizingConstraint);

              ui.message("🪄: Done creating padded layer! 👏 🚀");

            }



            /// Padded Text layer
            if (prop == "+++"){
              console.log("padded text layer")

              var paddedLayerColor = '#D3D3D3'

              if (layer.type != "Text"){

                valuex = valuex * (-1)
                valuey = valuey * (-1)


                createText(layer,layer.frame.x - valuex,layer.frame.y - valuey,layer.frame.width + valuex*2,layer.frame.height + valuey*2,"Type something")

                ui.message("🪄: Done creating padded layer! 👏 🚀");

              } else {

                console.log("duplicate down text layer")
                var newLayer = layer.duplicate();
                newLayer.frame.y = newLayer.frame.y + layer.frame.height + valuey
                newLayer.frame.x = newLayer.frame.x + valuex
                newLayer.frame.width = layer.frame.width + valuex*(-2)
                newLayer.index = layer.index;

                layer.selected = false;
                newLayer.selected = true;
                // resultingSelectedLayers.push(newLayer)

                adjustToFitIfGroup(layer)

                ui.message("🪄: Added a text layer just below the selcted one! 👏 🚀");

              }


            }





            if (prop == "|||"){

              // console.log("space horizzontally 4")


              if (layer.type == "Artboard"){

                var layerParentChildren = selectedLayers.layers

                if (j == 0) {
                  layer.frame.x = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.x; }))
                } else {
                  layer.frame.x = layerParentChildren[j-1].frame.x + layerParentChildren[j-1].frame.width + valuex
                }

                console.log("force Y to min")
                layer.frame.y = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.y; }))

              } else {

                var layerParent = layer.parent;
                var layerParentChildren = layer.parent.layers;

                if (j == 0) {
                  layer.frame.x = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.x; }))
                } else {
                  layer.frame.x = layerParentChildren[j-1].frame.x + layerParentChildren[j-1].frame.width + valuex
                }

                // console.log("force Y to min")
                layer.frame.y = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.y; }))


                if (j == layerParentChildren.length - 1) {
                  adjustToFitIfGroup(layer)
                }

              }


              ui.message("🪄: Spaced elements horizzontally! 👏 🚀");

            }


            /// Stacking

            if (prop == "-20-20-"){
              // console.log("space vertically - selectedLayers 7")

              if (layer.type == "Artboard"){

                var layerParentChildren = selectedLayers.layers

                if (j == 0) {
                  layer.frame.y = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.y; }))
                } else {
                  layer.frame.y = layerParentChildren[j-1].frame.y + layerParentChildren[j-1].frame.height + valuey
                }

                console.log("force X to min")
                layer.frame.x = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.x; }))

              } else {

                var layerParent = layer.parent;
                var layerParentChildren = layer.parent.layers;

                if (j == 0) {
                  layer.frame.y = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.y; }))
                } else {
                  layer.frame.y = layerParentChildren[j-1].frame.y + layerParentChildren[j-1].frame.height + valuey
                }

                // console.log("force X to min")
                layer.frame.x = Math.min.apply(Math, layerParentChildren.map(function(o) { return o.frame.x; }))


                if (j == layerParentChildren.length - 1) {
                  adjustToFitIfGroup(layer)
                }

              }

              ui.message("🪄: Spaced elements vertically! 👏 🚀");

            }


            // Duplicate


            if (prop == "dw"){
              console.log("down")
              var newLayer = layer.duplicate();
              newLayer.frame.y = newLayer.frame.y + layer.frame.height + valuey
              newLayer.index = layer.index;

              layer.selected = false;
              newLayer.selected = true;
              resultingSelectedLayers.push(newLayer)

              adjustToFitIfGroup(layer)

            }

            if (prop == "up"){
              console.log("up")
              var newLayer = layer.duplicate();
              newLayer.frame.y = newLayer.frame.y - layer.frame.height - valuey

              layer.selected = false;
              newLayer.selected = true;
              resultingSelectedLayers.push(newLayer)

              adjustToFitIfGroup(layer)

            }

            if (prop == "dx"){
              console.log("right")
              var newLayer = layer.duplicate();
              newLayer.frame.x = newLayer.frame.x + layer.frame.width + valuex
              newLayer.index = layer.index;

              layer.selected = false;
              newLayer.selected = true;

              resultingSelectedLayers.push(newLayer)

              adjustToFitIfGroup(layer);

            }

            if (prop == "sx"){
              console.log("left")
              var newLayer = layer.duplicate();
              newLayer.frame.x = newLayer.frame.x - layer.frame.width - valuex

              layer.selected = false;
              newLayer.selected = true;
              resultingSelectedLayers.push(newLayer)

              adjustToFitIfGroup(layer);
            }


            // left,right,top,bottom,fixedWidth,fixedHeight

            if (myDirection == "tl"){
              setResizingConstraint(layer, [true,false,true,false],[false,false])
            }
            if (myDirection == "tc"){
              setResizingConstraint(layer, [false,false,true,false],[false,false])
            }
            if (myDirection == "tr"){
              setResizingConstraint(layer, [false,true,true,false],[false,false])
            }

            if (myDirection == "ml"){
              setResizingConstraint(layer, [true,false,false,false],[false,false])
            }
            if (myDirection == "mc"){
              setResizingConstraint(layer, [false,false,false,false],[false,false])
            }
            if (myDirection == "mr"){
              setResizingConstraint(layer, [false,true,false,false],[false,false])
            }

            if (myDirection == "bl"){
              setResizingConstraint(layer, [true,false,false,true],[false,false])
            }
            if (myDirection == "bc"){
              setResizingConstraint(layer, [false,false,false,true],[false,false])
            }
            if (myDirection == "br"){
              setResizingConstraint(layer, [false,true,false,true],[false,false])
            }

            if (myDirection == "fw"){
              setResizingConstraint(layer, [true,true,false,false],[false,false])
            }
            if (myDirection == "fh"){
              setResizingConstraint(layer, [false,false,true,true],[false,false])
            }
            if (myDirection == "fs"){
              setResizingConstraint(layer, [true,true,true,true],[false,false])
            }


            if (layer.parent.layers.length << 2) {
              // console.log("only child")
              adjustToFitIfGroup(layer);
            }



            ///
            console.log(layer.sketchObject.resizingConstraint())

            ui.message("🪄: Done! 👏 🚀");

            /// UNDO
          //   if (prop == "undo"){
          //   //MSUndoAction
          //   console.log("undo---")
          //   ui.message("🪄: Undo! 👏 🚀");

          //   context.document.actionsController().actionForID("MSUndoAction").doPerformAction(null);

          // }

            //Settings.setLayerSettingForKey(layer, 'meta', myLayerX);

            // }

            // for (s = 0; s < resultingSelectedLayers.length; s++) {

            //   console.log("resultingSelectedLayers")
            //   console.log(resultingSelectedLayers)
            //   resultingSelectedLayers[s].selected = true;
            // }


          }



        } else if (hash.hasOwnProperty('close')) {
          //We can also call commands on the window itself, like closing the window
          //This can be run aftr other commands, obviously
          threadDictionary.removeObjectForKey(identifier);
          webViewWindow.close();
        }

      })
    });

    webView.setFrameLoadDelegate_(delegate.getClassInstance());
    webView.setMainFrameURL_(context.plugin.urlForResourceNamed("ui.html").path());
    webViewWindow.contentView().addSubview(webView);
    webViewWindow.center();
    webViewWindow.makeKeyAndOrderFront(nil);
    // Define the close window behaviour on the standard red traffic light button
    var closeButton = webViewWindow.standardWindowButton(NSWindowCloseButton);
    closeButton.setCOSJSTargetFunction(function(sender) {
      COScript.currentCOScript().setShouldKeepAround(false);
      threadDictionary.removeObjectForKey(identifier);
      webViewWindow.close();
    });
    closeButton.setAction("callAction:");
  };







  //A function to parse the hash we get back from the webview
  function parseHash(aURL) {
    aURL = aURL;
    var vars = {};
    var hashes = aURL.slice(aURL.indexOf('#') + 1).split('&');

    for(var i = 0; i < hashes.length; i++) {
      var hash = hashes[i].split('=');

      if(hash.length > 1) {
        vars[hash[0].toString()] = hash[1];
      } else {
        vars[hash[0].toString()] = null;
      }
    }

    return vars;
  }

}

// var onSelectionChanged = function(context) {
//   // BUG: newSelection is empty when changing selection
//   // WORKAROUND: document.selectedLayers().layers()
//   // http://sketchplugins.com/d/112-bug-selectionchanged-finish-newselection-is-empty
//
//   console.log("You are selecting things")
//
//   ui.message("🪄: You are selecting things! 👏 🚀");
// }


/// Adjust to fit if parent is a group

function adjustToFitIfGroup(layer) {
  var layerParent = layer.parent;
  if (layerParent.type === "Group") {
    layerParent.adjustToFit();
  }
}

/// Create text layer

function createText(layer,textX,textY,width,height,textValue) {
  // textX = 10;
  // textY = 10;
  textParent = layer.parent;

  var textFontSize = 12;

  var backgroundColor = layer.style.fills[0].color.slice(0,7)
  // console.log("Fill:" + layer.style.fills[0].color.slice(0,7))
  var highContrastColor = invertColor(backgroundColor, true) || "#999"

  // console.log(highContrastColor)

  var textColor = highContrastColor

  var textLineHeight = 24;
  var textAlignment = "left";
  var textFontFamily = 'Open Sans';
  var textFontWeight = 5;
  // textValue = "Hello!";
  // textName = "Notes";

  var text = new Text({
    text: textValue
  })

  text.frame.x = textX
  text.frame.y = textY
  text.frame.width = width
  text.frame.height = height
  text.parent = textParent;
  text.index = layer.index+1;
  text.style.fontSize = textFontSize;
  text.style.textColor = textColor;
  text.style.lineHeight = textLineHeight;
  text.style.alignment = textAlignment;
  text.style.fontFamily= textFontFamily;
  text.style.fontWeight= textFontWeight;

  text.name = textName;

}

// function getMaxValue(array,property) {
// var maxY = Math.max.apply(Math, array.map(function(o) { return o.y; }))
// }

//// RTL function from FreeFlow

// function flipPositionAndPins() {
//
//   // var sketch = require('sketch');
//   // var sketchDom = require('sketch/dom')
//   // var ui = require('sketch/ui');
//   // var document = sketch.getSelectedDocument();
//
//   var selection = document.selectedLayers;
//
//   console.log(selection.layers[0].name);
//
//   for (j = 0; j < selection.length; ++j){
//
//     console.log("RTL/flip imported function")
//
//     var layer = selection.layers[j]
//
//     var parentWidth = layer.parent.frame.width
//
//     console.log("before")
//     console.log(layer.frame.x)
//
//     layer.frame.x = parentWidth - layer.frame.x - layer.frame.width
//     console.log("after")
//     console.log(layer.frame.x)
//
//     var newConstraint = 0;
//     var newConstraint = layer.sketchObject.resizingConstraint();
//
//     if (layer.sketchObject.resizingConstraint() === 27) {
//       newConstraint = 30
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 30) {
//       newConstraint = 27
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 59) {
//       newConstraint = 62
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 62) {
//       newConstraint = 59
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 51) {
//       newConstraint = 54
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 54) {
//       newConstraint = 51
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 9) {
//       newConstraint = 12
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 12) {
//       newConstraint = 9
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 44) {
//       newConstraint = 41
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 41) {
//       newConstraint = 44
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 35) {
//       newConstraint = 38
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 38) {
//       newConstraint = 35
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 43) {
//       newConstraint = 46
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 46) {
//       newConstraint = 43
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 57) {
//       newConstraint = 60
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 60) {
//       newConstraint = 57
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 11) {
//       newConstraint = 14
//     }
//
//     if (layer.sketchObject.resizingConstraint() === 14) {
//       newConstraint = 11
//     }
//
//     // APPLY CONSTRAINT
//     layer.sketchObject.setResizingConstraint(newConstraint);
//
//   }
//
//   ui.message("🪄: Done repositioning and inverting pinning properties of " + selection.length + " layers! 👏 🚀");
//
//
// };



/////


//The whole function above is run here
onRun(context);
