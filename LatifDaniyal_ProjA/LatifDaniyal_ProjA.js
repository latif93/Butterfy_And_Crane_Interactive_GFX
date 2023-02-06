//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
var sliding = false;
var lowerCraneArmAngle  = 0.0;
var lowerCraneArmAngleRate = 45.0;           // rotation speed, in degrees/second 
var butterflyHeight = 0;
var flySpeedChangeRate = 5;
var butterflyRotateAngle = 20;
var butterflyRotateAngleRate = 70;
var wingAngle = 0;
var wingAngleRate = 100;
//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits
var pauseButterflyX = 0;
var pauseButterflyY = 0;
var paused = false;

var stringLength = 7;						
function main() {
//==============================================================================
/*REPLACED THIS: 
// Retrieve <canvas> element:
 var canvas = document.getElementById('webgl'); 
//with global variable 'g_canvas' declared & set above.
*/
  
  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.3, 0.3, 0.3, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 

  var tick = function() {
    lowerCraneArmAngle = animate(lowerCraneArmAngle);
	drawCrane();

	butterflyHeight = animateButterfly(butterflyHeight, butterflyRotateAngle);
	drawButterflyBody();

	wingAngle = animateWings(wingAngle);
	drawButterflyWings();

	  // Draw all parts
//    console.log('lowerCraneArmAngle=',lowerCraneArmAngle.toFixed(g_digits)); // put text in console.

//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		
		// Also display our current mouse-dragging state:
	
		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!

	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

*/
			// Face 0: (left side)  
     0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
			// Face 1: (right side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
    	// Face 2: (lower side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
     c30, -0.5,  0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1

    //mid rn X
	0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
	0.5, 0.0, 0.0, 1.0,     	1.0, 1.0, 0.0,	  // ylw
	0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
   
	0.5, 0.5, 0.0, 1.0,  1.0, 0.0, 0.0,		// r  					
	0.5, 0.0, 0.0, 1.0,  1.0, 1.0, 0.0,	  // ylw 	
	0.0, 0.5, 0.0, 1.0,  0.0, 0.0, 0.0,		// blk
	//bot-mid rn X
	0.0, 0.0, 0.5, 1.0,			1.0, 0.0, 0.0,		// r
	0.5, 0.0, 0.5, 1.0,     	0.0, 0.0, 0.0,		// blk
	0.0, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
   
	0.5, 0.0, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.0, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	// right rn X
	0.5, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk

	0.5, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	//left rn X
   0.0, 0.0, 0.5, 1.0,			1.0, 1.0, 1.0,		// w
   0.0, 0.0, 0.0, 1.0,     	0.0, 0.0, 1.0,	  // b
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk

   0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 1.0,	  // b
   0.0, 0.0, 0.0, 1.0,     	1.0, 1.0, 1.0,		// w
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
   //bottom rn X
   0.0, 0.0, 0.5, 1.0,			0.5, 0.5, 0.5,		//g
   0.5, 0.0, 0.5, 1.0,     	1.0, 1.0, 0.0,	  // y
   0.0, 0.5, 0.5, 1.0,			0.0, 1.0, 1.0,		// cyan
  
   0.5, 0.5, 0.5, 1.0,  0.0, 1.0, 0.0, // g    					
   0.5, 0.0, 0.5, 1.0,  1.0, 0.0, 1.0, // prpl  	
   0.0, 0.5, 0.5, 1.0,  0.0, 0.0, 0.0, //blk
   //top rn X
   0.0, 0.5, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
   0.5, 0.5, 0.0, 1.0,     	0.0, 1.0, 0.0,	  // g
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 1.0,		// b

   0.5, 0.5, 0.5, 1.0,			.0, 0.0, 1.0,		// b
   0.5, 0.5, 0.0, 1.0,     	1.0, 0.0, 0.0,		// r
   0.0, 0.5, 0.5, 1.0,			 	0.0, 1.0, 0.0,	  // g
   //crushing crystal
   0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   0.5, 0.0, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // r
   0.0, 0.5, 0.0, 1.0,			1.0, 0.0, 0.5,		// maybe pnk
  
   0.5, 0.5, 0.0, 1.0,  1.0, 0.0, 0.0,	  // r  					
   0.5, 0.0, 0.0, 1.0,  1.0, 0.0, 0.0,	  // r 	
   0.0, 0.5, 0.0, 1.0,  1.0, 0.0, 1.0,		// prpl
   //front tri
   0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   0.5, 0.0, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // r
   0.25, 0.25, 0.25, 1.0,			1.0, 0.0, 1.0,		// prpl
   //back tri
   0.5, 0.5, 0.0, 1.0,  0.0, 0.0, 1.0,		// b					
   0.25, 0.25, 0.25, 1.0,  1.0, 0.0, 1.0,		// prpl	
   0.0, 0.5, 0.0, 1.0,   1.0, 0.0, 0.0,	  // r  
   // left tri
   0.0, 0.5, 0.0, 1.0,  0.0, 0.0, 1.0,		// b 					
   0.0, 0.0, 0.0, 1.0,  1.0, 0.0, 1.0,		// prpl	  	
   0.25, 0.25, 0.25, 1.0,  1.0, 0.0, 0.0,	  // r
   // right tri
   0.5, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   0.25, 0.25, 0.25, 1.0,     	1.0, 0.0, 0.0,	  // r
   0.5, 0.5, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   //abdomen top left
   0.0, 0.25, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
   0.25, 0.0, 0.5, 1.0,     	1.0, 1.0, 1.0,		// white
   0.25, 0.15, 1.0, 1.0,			0.0, 0.0, 0.0,		// blk
   //abdomen top-right
   0.5, 0.25, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
   0.25, 0.5, 0.5, 1.0,     	1.0, 1.0, 1.0,		// white
   0.25, 0.15, 1.0, 1.0,			0.0, 0.0, 0.0,		// blk
   //abdomen small middle
   0.15, 0.12, 1.20, 1.0,			0.0, 0.0, 0.0,		// blk
   0.20, 0.12, 1.20, 1.0,     	1.0, 1.0, 1.0,		// white
   0.25, 0.15, 1.0, 1.0,			1.0, 1.0, 1.0,		// white
   //building block of faces of new crystal
   0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   0.5, 0.0, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // red
   0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 1.0,		// b
   //squares on top and bottom of new crystal
   0.0, 0.5, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   0.5, 0.5, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // red
   0.0, 1.0, 0.0, 1.0,			0.0, 0.0, 1.0,		// b   

   0.5, 1.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
   0, 1.0, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // red
   0.5, 0.5, 0.0, 1.0,			0.0, 0.0, 1.0,		// b  
   //rects on crystal border
  
  ]);
  g_vertsMax = 100;		// 12 tetrahedron vertices.
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

/* REMOVED -- global 'g_vertsMax' means we don't need it anymore
  return nn;
*/
}

function DrawPart1() {
	gl.drawArrays(gl.TRIANGLES, 75,3);
  }

function drawCrane() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
// Great question from student:
// "?How can I get the screen-clearing color (or any of the many other state
//		variables of OpenGL)?  'glGet()' doesn't seem to work..."
// ANSWER: from WebGL specification page: 
//							https://www.khronos.org/registry/webgl/specs/1.0/
//	search for 'glGet()' (ctrl-f) yields:
//  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	// console.log("clear value:", clrColr);


	//--------Draw NON spinning triangle
	g_modelMatrix.setTranslate(0.25,0.25,0);
		//Use this matrix to transform & draw 
  //    	the first set of vertices stored in our VBO:
  		//Pass our current matrix to the vertex shaders:
	//-----------------------------------------
//AHHHHHHHHHHHHHHHHHHHHHHHH

    //upper arm
	g_modelMatrix.scale(1.5, 0.25, 0.25); 
	g_modelMatrix.rotate(lowerCraneArmAngle, 1, 0, 0);
    
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
    // lower arm
	g_modelMatrix.scale(0.5, 1, 0.5); 
	g_modelMatrix.translate(-0.50, 0, 0.25); 
	g_modelMatrix.rotate(lowerCraneArmAngle*0.25, 1, 0, 0);


	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
    //string
	//up and down arrow should move this y-val up and down

	g_modelMatrix.scale(0.05, stringLength, 0.05); 
	g_modelMatrix.translate(0, -0.5, 0); 
    g_modelMatrix.rotate(lowerCraneArmAngle*0.125, 1, 0, 0);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	
	g_modelMatrix.translate(0, -0.01, 0.2); 
	g_modelMatrix.scale(10, 0.125, 1); 
	g_modelMatrix.rotate(lowerCraneArmAngle*1.5,1,0,0);
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(-0.1775,0.18,-0.25);
	g_modelMatrix.scale(0.7,0.175,0.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,6);	

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 24,18);



    g_modelMatrix = popMatrix();
	g_modelMatrix.rotate(90,0,1,0);
	g_modelMatrix.scale(0.5,0.5,0.5);
	g_modelMatrix.rotate(90,0,1,0);
	g_modelMatrix.rotate(45,0,0,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 18,6);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

	gl.drawArrays(gl.TRIANGLES, 30,9);
    g_modelMatrix.translate(0.125,0.125,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 15,3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 24,6);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 39,9);
	
}

function drawButterflyBody() {
    //butterfly body
	//g_modelMatrix.setTranslate(-0.6, 0.4, 0.0);
	
    console.log(paused);
	if(((g_xMclik < 1 && g_xMclik > -1) && (g_yMclik < 1 && g_yMclik > -1)) && !(paused)&& !(sliding)){
		console.log(sliding);
	g_modelMatrix.setTranslate(g_xMclik, g_yMclik -0.1, 0.0);
	pauseButterflyX = g_xMclik;
	pauseButterflyY = g_yMclik;
	}
	else{
		g_modelMatrix.setTranslate(pauseButterflyX, pauseButterflyY -0.1, 0.0);
		
	}
	g_modelMatrix.scale(0.25, 0.25, 0.25);
	g_modelMatrix.rotate(butterflyRotateAngle, 0, 1, 0); //tryna make it rotate and fly

	g_modelMatrix.translate(0, butterflyHeight, 0);

    pushMatrix(g_modelMatrix);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
 	gl.drawArrays(gl.TRIANGLES, 12,36);
    //butterfly abdomen
	g_modelMatrix = popMatrix();
     
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 66, 9);

	pushMatrix(g_modelMatrix);


	//butterfly leg # 1
	g_modelMatrix.scale(0.05, 0.9, 0.05); 
	g_modelMatrix.translate(0, -0.5, 0); 

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	//butterfly leg # 2
	g_modelMatrix.translate(2, 0, 5); 

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	//butterfly leg # 3
	g_modelMatrix.translate(-2, 0, 5); 
	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	//butterfly leg # 4
	g_modelMatrix.translate(9, 0, 0); 
     
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	//butterfly leg # 5
	g_modelMatrix.translate(-2, 0, -5); 
		 
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	//butterfly leg # 6
	g_modelMatrix.translate(2, 0, -5); 
     
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
}
function drawButterflyWings() {
    //left underwing/tendon
	g_modelMatrix.rotate(wingAngle, 0, 0, 1);
	g_modelMatrix.translate(0.5,0,0.125);
	g_modelMatrix.scale(0.25,0.25,0.5);
	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
    //left middle wing
	g_modelMatrix.rotate(wingAngle*1.2, 0, 0, 1);
	g_modelMatrix.translate(0.125,0.5, -0.15);
	g_modelMatrix.scale(2,1.25,1.5);
	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
	//left main wing
	g_modelMatrix.rotate(wingAngle*1.5, 0, 0, 1);
	g_modelMatrix.translate(0.125,0.5, -0.15);
	g_modelMatrix.scale(2,1.25,1.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
	//left top wing
	g_modelMatrix.rotate(wingAngle*1.7, 0, 0, 1);
	g_modelMatrix.translate(0.125,0.5, -0.15);
	g_modelMatrix.scale(2,1.25,1.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
    //right underwing/tendon
	g_modelMatrix.rotate(-wingAngle, 0, 0, 1);
	g_modelMatrix.translate(-0.125, 0, 0.15); 
	g_modelMatrix.scale(0.25,0.25,0.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
	
    //right middle wing
	g_modelMatrix.rotate(-wingAngle * 1.2, 0, 0, 1);
	g_modelMatrix.translate(-0.625,0.5, -0.15);
	g_modelMatrix.scale(2,1.25,1.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
    //right main wing
	g_modelMatrix.rotate(-wingAngle * 1.5, 0, 0, 1);
	g_modelMatrix.translate(-0.625,0.5, -0.15);
	g_modelMatrix.scale(2,1.25,1.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);

    //right top wing
	g_modelMatrix.rotate(-wingAngle * 1.7, 0, 0, 1);
	g_modelMatrix.translate(-0.625,0.5, -0.15);
	g_modelMatrix.scale(2,1.25,1.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 12,36);
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
							// why add 0.001? avoids divide-by-zero in next statement
							// in cases where user didn't drag the mouse.)
	g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
	//first eye
	g_modelMatrix = popMatrix();
	g_modelMatrix.translate(0.075,0.25,0.05);
	g_modelMatrix.scale(0.25,0.25,0.25);
    pushMatrix(g_modelMatrix);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(180, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(90, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(180, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(90, 0, 1, 0);
	g_modelMatrix.translate(0,0,0.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(180, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);

    ///second eye

	g_modelMatrix.translate(0,0,-1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(180, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(90, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(180, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(90, 0, 1, 0);
	g_modelMatrix.translate(0,0,0.5);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);	

	g_modelMatrix.rotate(180, 1, 0, 0);
	g_modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48,18);

}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  var newAngle = angle + (lowerCraneArmAngleRate * elapsed) / 1000.0;
  if(newAngle > 60.0 || newAngle <-60.0){ 
	lowerCraneArmAngleRate = -lowerCraneArmAngleRate;
  }
  return newAngle;
  
}

function animateButterfly(height, angle) {
	//==============================================================================
	  // Calculate the elapsed time
	  var now = Date.now();
	  var elapsed = now - g_last;
	  g_last = now;
      var newAngle = angle + (butterflyRotateAngleRate * elapsed) / 1000.0;
	  var newHeight = height + (flySpeedChangeRate * elapsed) / 1000.0;
     if(newHeight > 0.5 || newHeight <-0.5){
		  flySpeedChangeRate= 0-flySpeedChangeRate;
	  }
	  if(newAngle >45 || newAngle <-45){
		  butterflyRotateAngleRate = -butterflyRotateAngleRate;
          
	  }	  
      butterflyRotateAngle = newAngle;
	  return newHeight;
	}
function animateWings(angle) {
		//==============================================================================
		  // Calculate the elapsed time
		  var now = Date.now();
		  var elapsed = now - g_last;
		  g_last = now;
		  		
		  var newAngle = angle + (wingAngleRate * elapsed) / 1000.0;
		  if(newAngle > 10.0 || newAngle <-10.0){ 
			wingAngleRate = -wingAngleRate;
		  }
		  return newAngle;

		}


//==================HTML Button Callbacks======================




function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}



function runStop() {
	if (paused){
		paused = false;
	}
	else{
		paused = true;
	}
// Called when user presses the 'Run/Stop' button
  if(lowerCraneArmAngleRate*lowerCraneArmAngleRate > 1) {  // if nonzero rate,
    myTmp = lowerCraneArmAngleRate;  // store the current rate,
    lowerCraneArmAngleRate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
  	lowerCraneArmAngleRate = myTmp;  // use the stored rate.
  }
  //same but with the other rates

  g_yMclik = pauseButterflyY;
  g_xMclik = pauseButterflyX;
 
  if(flySpeedChangeRate * flySpeedChangeRate > 1) {  // if nonzero rate,
    myTmp = flySpeedChangeRate;  // store the current rate,
    flySpeedChangeRate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
	flySpeedChangeRate = 3;  // use the stored rate.
  }
  if(wingAngleRate*wingAngleRate > 1) {  // if nonzero rate,
    myTmp = wingAngleRate;  // store the current rate,
    wingAngleRate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
	wingAngleRate = 100;  // use the stored rate.
  }
  if(butterflyRotateAngleRate*butterflyRotateAngleRate > 1) {  // if nonzero rate,
    myTmp = butterflyRotateAngleRate;  // store the current rate,
    butterflyRotateAngleRate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
	butterflyRotateAngleRate = 70;  // use the stored rate.
  }


}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	//g_xMclik = pauseButterflyX;													// record where mouse-dragging began
	//g_yMclik = pauseButterflyY;
	// report on webpage
	
	  
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:

    if (((x < 1) && (x>-1)) && ((y<1) && (y>-1))){
	g_xMclik = x;													// Make next drag-measurement from here.
	g_yMclik = y;
	console.log(y);
	}
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
//	document.getElementById('MouseAtResult').innerHTML = 
	  //'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

// and report EVERYTHING on webpage:

 
	switch(kev.code) {
		case "KeyP":
// print on webpage
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------

		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
            if((stringLength > 1) && !(paused)){
			stringLength -=0.1;
			}
  	//	document.getElementById('KeyDownResult').innerHTML =
  		//	'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
            if((stringLength < 7)  && !(paused)){
				stringLength +=0.1;
				}
				
  		
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}
