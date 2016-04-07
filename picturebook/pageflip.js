// using picturebook
var pageElement = [];
var selifElement = [];
var draggedMousePos = 0;
var n = 0;

// picturebook all pages (from 0 to 41)
var len = 41;

// create picturebook page elements
var pagesElement = document.getElementById("pages");
var selifsElement = document.getElementById("selifs");
for(i=0;i<=len;i++){
    var section = document.createElement("section");
    section.id = "page"+i;
    pagesElement.appendChild(section);
    var selifSection = document.createElement("div");
    selifSection.id = "selif"+i;
    selifsElement.appendChild(selifSection);
}

// picture book size
var BOOK_WIDTH = 940;
var BOOK_HEIGHT = 560;
var PAGE_WIDTH = 450;
var PAGE_HEIGHT = 550;
var FLIP_LIMIT = 400;
var PAGE_Y = ( BOOK_HEIGHT - PAGE_HEIGHT ) / 2;
var CANVAS_PADDING = 10;

// initialze
var page = 0, clientX = 0, clientY = 0;

var book = document.getElementById( "book" );	
var pages = book.getElementsByTagName( "section" );

var canvas = document.getElementById( "pageflip-canvas" );
var context = canvas.getContext( "2d" );

var mouse = { x: 0, y: 0 };

var flips = [];

// Organize the depth of our pages and create the flip definitions
for( var i = 0; i < len; i++ ) {
    pages[i].style.zIndex = len - i;
    
    flips.push( {
	// Current progress of the flip (left -1 to right +1)
	progress: 1,
	// The target value towards which progress is always moving
	target: 1,
	// The page DOM element related to this flip
	page: pages[i], 
	// True while the page is being dragged
	dragging: false
    } );
}


// Resize the canvas to match the book size
canvas.width = BOOK_WIDTH + ( CANVAS_PADDING * 2 );
canvas.height = BOOK_HEIGHT + ( CANVAS_PADDING * 2 );

// Offset the canvas so that it's padding is evenly spread around the book
canvas.style.top = -CANVAS_PADDING + "px";
canvas.style.left = -CANVAS_PADDING + "px";

// Render the page flip 60 times a second
setInterval( render, 1000 / 60 );

document.addEventListener( "mousemove", mouseMoveHandler, false );
document.addEventListener( "touchmove", mouseMoveHandler, false );
document.addEventListener( "mousedown", mouseDownHandler, false );
document.addEventListener( "touchstart", mouseDownHandler, false );
document.addEventListener( "mouseup", mouseUpHandler, false );
document.addEventListener( "touchend", mouseUpHandler, false );

function mouseMoveHandler( event ) {
    // Offset mouse position so that the top of the book spine is 0,0
    clientY = event.targetTouches[0].pageY;
    clientX = event.targetTouches[0].pageX;
    mouse.x = clientX - book.offsetLeft - ( BOOK_WIDTH / 2 );
    mouse.y = clientY - book.offsetTop;
    for( var i = 0; i < len; i++ ) {
	if( flips[i].dragging ) {
	    for( var j = 0; j < len; j++ ) {
		pages[j].style.zIndex = len - j;
	    }
	}
    }

}

function mouseDownHandler( event ) {
    clientY = event.targetTouches[0].pageY;
    clientX = event.targetTouches[0].pageX;
    mouse.x = clientX - book.offsetLeft - ( BOOK_WIDTH / 2 );
    mouse.y = clientY - book.offsetTop;
    // Make sure the mouse pointer is inside of the book
    if (Math.abs(mouse.x) < PAGE_WIDTH) {
	draggedMousePos = mouse.x;
	if (mouse.x < 0 && page - 1 >= 0) {
	    // We are on the left side, drag the previous page
	    flips[page - 1].dragging = true;
	}
	else if (mouse.x > 0 && page + 1 < flips.length) {
	    // We are on the right side, drag the current page
	    flips[page].dragging = true;
	}
    }
    
    // Prevents the text selection
    event.preventDefault();
}

function mouseUpHandler( event ) {
    for( var i = 0; i < flips.length; i++ ) {
	// If this flip was being dragged, animate to its destination
	if( flips[i].dragging) {
	    // Figure out which page we should navigate to
	    if( mouse.x < 0  && draggedMousePos >= 0) {
		flips[i].target = -1;
		page = Math.min( page + 1, flips.length );
		renderCurrentPage(page);
	    }
	    else {
		if(draggedMousePos <= 0){
		    flips[i].target = 1;
		    page = Math.max( page - 1, 0 );
		    renderCurrentPage(page);
		}
	    }
	}
	
	flips[i].dragging = false;
    }
}

function render() {
    
    // Reset all pixels in the canvas
    context.clearRect( 0, 0, canvas.width, canvas.height );
    
    for( var i = 0, len = flips.length; i < len; i++ ) {
	var flip = flips[i];
	
	if( flip.dragging ) {
	    flip.target = Math.max( Math.min( mouse.x / PAGE_WIDTH, 1 ), -1 );
	}
	
	// Ease progress towards the target value 
	flip.progress += ( flip.target - flip.progress ) * 0.2;
	
	// If the flip is being dragged or is somewhere in the middle of the book, render it
	if( flip.dragging || Math.abs( flip.progress ) < 0.997 ) {
	    drawFlip( flip );
	}
	
    }
    
}

function drawFlip( flip ) {
    // Strength of the fold is strongest in the middle of the book
    var strength = 1 - Math.abs( flip.progress );
    
    // Width of the folded paper
    var foldWidth = ( PAGE_WIDTH * 0.5 ) * ( 1 - flip.progress );
    
    // X position of the folded paper
    var foldX = PAGE_WIDTH * flip.progress + foldWidth;
    
    // How far the page should outdent vertically due to perspective
    var verticalOutdent = 20 * strength;
    
    // The maximum width of the left and right side shadows
    var paperShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( 1 - flip.progress, 0.5 ), 0 );
    var rightShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( strength, 0.5 ), 0 );
    var leftShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( strength, 0.5 ), 0 );
    
    
    // Change page element width to match the x position of the fold
    flip.page.style.width = Math.max(foldX, 0) + "px";
    
    context.save();
    context.translate( CANVAS_PADDING + ( BOOK_WIDTH / 2 ), PAGE_Y + CANVAS_PADDING );
    
    
    // Draw a sharp shadow on the left side of the page
    context.strokeStyle = 'rgba(0,0,0,'+(0.05 * strength)+')';
    context.lineWidth = 30 * strength;
    context.beginPath();
    context.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
    context.lineTo(foldX - foldWidth, PAGE_HEIGHT + (verticalOutdent * 0.5));
    context.stroke();
    
    
    // Right side drop shadow
    var rightShadowGradient = context.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
    rightShadowGradient.addColorStop(0, 'rgba(0,0,0,'+(strength*0.2)+')');
    rightShadowGradient.addColorStop(0.8, 'rgba(0,0,0,0.0)');
    
    context.fillStyle = rightShadowGradient;
    context.beginPath();
    context.moveTo(foldX, 0);
    context.lineTo(foldX + rightShadowWidth, 0);
    context.lineTo(foldX + rightShadowWidth, PAGE_HEIGHT);
    context.lineTo(foldX, PAGE_HEIGHT);
    context.fill();
    
    
    // Left side drop shadow
    var leftShadowGradient = context.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
    leftShadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
    leftShadowGradient.addColorStop(1, 'rgba(0,0,0,'+(strength*0.15)+')');
    
    context.fillStyle = leftShadowGradient;
    context.beginPath();
    context.moveTo(foldX - foldWidth - leftShadowWidth, 0);
    context.lineTo(foldX - foldWidth, 0);
    context.lineTo(foldX - foldWidth, PAGE_HEIGHT);
    context.lineTo(foldX - foldWidth - leftShadowWidth, PAGE_HEIGHT);
    context.fill();
    
    
    // Gradient applied to the folded paper (highlights & shadows)
    var foldGradient = context.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
    foldGradient.addColorStop(0.35, '#fafafa');
    foldGradient.addColorStop(0.73, '#eeeeee');
    foldGradient.addColorStop(0.9, '#fafafa');
    foldGradient.addColorStop(1.0, '#e2e2e2');
    
    context.fillStyle = foldGradient;
    context.strokeStyle = 'rgba(0,0,0,0.06)';
    context.lineWidth = 0.5;
    
    // Draw the folded piece of paper
    context.beginPath();
    context.moveTo(foldX, 0);
    context.lineTo(foldX, PAGE_HEIGHT);
    context.quadraticCurveTo(foldX, PAGE_HEIGHT + (verticalOutdent * 2), foldX - foldWidth, PAGE_HEIGHT + verticalOutdent);
    context.lineTo(foldX - foldWidth, -verticalOutdent);
    context.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);
    
    context.fill();
    context.stroke();
    
    
    context.restore();
}

// Render each page elements
function renderCurrentPage(page){
    React.render(React.createElement(selifElement[page]), document.getElementById("selif"+page));
    React.render(React.createElement(pageElement[page]), document.getElementById("page"+page));
}

// Unmount hidden page elements
function unMountOtherPages(page){
    for( var i = 0; i < len; i++ ) {
	if (i != page){
	    React.unmountComponentAtNode(document.getElementById('page'+i));
	    React.unmountComponentAtNode(document.getElementById('selif'+i));
	}
    }
}

// Picture book contents
var nn = 0;
selifElement[0] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(n);
    },
    componentDidMount: function(){
	console.log(n);
	unMountOtherPages(n);
    },
    render: function(){
	return (
		<div>
		</div>
	);
    }
});

// 各ReactElementごとの挙動を記載
pageElement[0]= React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(n);
    },
    componentDidMount: function(){
	unMountOtherPages(n);
    },
    render: function(){
	return (
		<div className="caption" id="title">
		ひつじの　ぼうけん
	    </div>
	);
    }
});

selifElement[1] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap2-1">
		あるところに
	    </div>
		<div className="caption cap2-2">
		ひつじのかぞくがすんでいました
	    </div>
		</div>
	);
    }
});

pageElement[1] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(1);
    },
    componentDidMount: function(){
	unMountOtherPages(1);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		<div className="house">
		<div className="window">
		</div>
		<div className="chimney"></div>
		<div className="smokecontainer"><span className="smoke"></span>
		</div>
		</div>
		</div>    
		<div className="hill"></div>
		</div>
	);
    }
});

selifElement[2] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		おかあさんひつじと
	    </div>
		<div className="caption cap3-2">
		にひきの　あにひつじは
	    </div>
		<div className="caption cap3-3">
		ふさふさの　けが　はえていました
	    </div>
		</div>
	);
    }
});
pageElement[2] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(2);
    },
    componentDidMount: function(){
	unMountOtherPages(2);
    },
    render: function(){
	return (
		<div>
		<div>
		<div className="refrect" id="sheep-family1">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>

		<div  id="sheep-family2">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>

		<div className="sheep-mother refrect">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[3] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		いちばんしたの
	    </div>
		<div className="caption cap3-2">
		おとうとひつじには
	    </div>
		<div className="caption cap3-3">
		けが　いっぽんも　はえてませんでした
	    </div>
		</div>
	);
    }
});

pageElement[3] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(3);
    },
    componentDidMount: function(){
	unMountOtherPages(3);
    },
    render: function(){
	return (
		<div>
		<div  id="sheep-nowool-introduce">
		<div className="sheep-nowool-animal">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt-animal"></div>
		<div className="foot-lt-animal"></div>
		<div className="leg-lt-shadow-animal"></div>
		<div className="foot-lt-shadow-animal"></div>
		<div className="leg-rt-animal"></div>
		<div className="foot-rt-animal"></div>
		<div className="leg-rt-shadow-animal"></div>
		<div className="foot-rt-shadow-animal"></div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[4] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		あにひつじは
	    </div>
		<div className="caption cap3-2">
		けのない　おとうとひつじを
	    </div>
		<div className="caption cap3-3">
		いつも　ばかにしていました
	    </div>
		</div>
	);
    }
});
pageElement[4] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(4);
    },
    componentDidMount: function(){
	unMountOtherPages(4);
    },
    render: function(){
	return (
		<div id="sheep-introduce-with-bros">
		<div className="sheep-nowool sheep-crying">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-1"></div>
		<div className="black-2"></div>
		</div>
		<div className="rt-eye">
		<div className="black-3"></div>
		<div className="black-4"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body" id="sheep-crying"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt2"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>

		<div className="sheep-attack refrect">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-1"></div>
		</div>
		<div className="rt-eye">
		<div className="black-3"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		</div>
	);
    }
});

selifElement[5] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		ははおやひつじは
	    </div>
		<div className="caption cap3-2">
		おとうとひつじを
	    </div>
		<div className="caption cap3-3">
		いつも　なぐさめていました
	    </div>
		</div>
	);
    }
});
pageElement[5] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(5);
    },
    componentDidMount: function(){
	unMountOtherPages(5);
    },
    render: function(){
	return (
		<div>
		<div className="sheep-crying-back" id="sheep-crying-back-with-mother">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop7"></p>
		<p className="drop drop8"></p>
		<p className="drop drop9"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt2"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>

		<div className="sheep-mother refrect" id="sheep-mother-with-crying-sheep">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="lt-eye-line"></div>
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="rt-eye-line"></div>
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		</div>		    
	);
    }
});

selifElement[6] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		おとうとひつじは　おもいました
	    </div>
		<div className="caption cap3-2">
		「じぶんは　きっと　
		  </div>
		  <div className="caption cap3-3">
		  　ひつじのこどもじゃないんだ」
	    </div>
		</div>
	);
    }
});
pageElement[6] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(6);
    },
    componentDidMount: function(){
	unMountOtherPages(6);
    },
    render: function(){
	return (
		<div>
		<div id="dark-room"></div>
		<div className="sheep-nowool" id="sheep-nowool-introduce">
		<div className="bed"></div>
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-sleep-1"></div>
		<div className="black-sleep"></div>
		</div>
		<div className="rt-eye">
		<div className="black-sleep-3"></div>
		<div className="black-sleep"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div className="bed-cloth"></div>
		<div className="sheep-body-sleep"></div>
		</div>
		</div>

	);
    }
});


selifElement[7] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		あるばん
	    </div>
		<div className="caption cap4-2">
		おとうとひつじは　いえをぬけだし
	    </div>
		<div className="caption cap4-3">
		ほんとうの　かぞくを
	    </div>
		<div className="caption cap4-4">
		さがしにいきました
	    </div>
		</div>
	);
    }
});
pageElement[7] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(7);
    },
    componentDidMount: function(){
	unMountOtherPages(7);
    },
    render: function(){
	return (
		<div>
		<div className="sky dark-sky">
		<div className="house dark-house" id="house-move">
		<div className="window dark-window">
		</div>
		<div className="chimney dark-chimney"></div>
		</div>
		</div>
		<div className="sheep-nowool sheep-go-forest" id="sheep-dark-move">
		<div className="sheep-head sheep-dark-move">
		<div className="lt-ear sheep-dark-move"></div>
		<div className="lt-round-ear sheep-dark-move"></div>
		<div className="rt-ear sheep-dark-move"></div>
		<div className="rt-round-ear sheep-dark-move"></div>
		</div>
		<div className="sheep-body sheep-dark-move"></div>
		<div className="leg-lt sheep-dark-move"></div>
		<div className="leg-rt sheep-dark-move"></div>
		<div className="leg-rt2 sheep-dark-move"></div>
		</div>
		<div className="hill dark-hill"></div>
		</div>
	);
    }
});

selifElement[8] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		しばらく　あるいていると
	    </div>
		<div className="caption cap3-2">
		まっくらな　もりに
	    </div>
		<div className="caption cap3-3">
		つきました
	    </div>
		</div>
	);
    }
});
pageElement[8] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(8);
    },
    componentDidMount: function(){
	unMountOtherPages(8);
    },
    render: function(){
	return (
		<div>
		<div className="sky dark-sky">
		</div>
		<div className="sheep-nowool sheep-go-forest" id="sheep-dark-move">
		<div className="sheep-head sheep-dark-move">
		<div className="lt-ear sheep-dark-move"></div>
		<div className="lt-round-ear sheep-dark-move"></div>
		<div className="rt-ear sheep-dark-move"></div>
		<div className="rt-round-ear sheep-dark-move"></div>
		</div>

		<div className="sheep-body sheep-dark-move"></div>

		<div className="leg-lt sheep-dark-move"></div>
		<div className="leg-rt sheep-dark-move"></div>
		<div className="leg-rt2 sheep-dark-move"></div>
		</div>
		<div className="forest come-forest">
		<div className="wood1">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood2">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood3">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood4">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood5">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood6">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		</div>      
		<div className="hill dark-hill"></div>
		</div>
	);
    }
});

selifElement[9] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		もりにはいると
	    </div>
		<div className="caption cap4-2">
		だれかの　こえがしました
	    </div>
		<div className="caption cap4-3">
		「おや　こんなよなかに
		  </div>
		  <div className="caption cap4-4">
		  　おきゃくさんとは　めずらしい」
	    </div>
		</div>
	);
    }
});
pageElement[9] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(9);
    },
    componentDidMount: function(){
	unMountOtherPages(9);
    },
    render: function(){
	return (
		<div>
		<div className="sky black-forest">
		</div>
		<div className="owl">
		<div className="leyelash black-forest">
		</div>
		<div className="leye">
		<div className="black">
		</div>
		</div>
		<div className="reyelash black-forest">
		</div>
		<div className="reye">
		<div className="black">
		</div>
		</div>
		</div>
		<div className="sheep-nowool sheep-dark-stop">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
	);
    }
});

selifElement[10] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「あなたは　だれですか？」
	    </div>
		<div className="caption cap4-2">
		「わたしは　もりのふくろう
		  </div>
		  <div className="caption cap4-3">
		  　ひつじのこどもが　こんなよなかに
		  </div>
		  <div className="caption cap4-4">
		  　もりにきたら　あぶないよ」
	    </div>
		</div>
	);
    }
});
pageElement[10] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(10);
    },
    componentDidMount: function(){
	unMountOtherPages(10);
    },
    render: function(){
	return (
		<div>
		<div className="sky black-forest">
		</div>
		<div className="forest-light light-start">
		</div>
		<div className="owl">
		<div className="owl-head owl-light-start">
		<div className="leye-mark" id="owl-eye-light-start">
		</div>
		<div className="leyelash owl-show">
		</div>
		<div className="leye owl-show">
		<div className="black">
		</div>
		</div>
		<div className="reye-mark" id="owl-eye-light-start">
		</div>
		<div className="reyelash">
		</div>
		<div className="reye">
		<div className="black">
		</div>
		</div>
		<div className="beak" id="owl-beak-light-start"></div>
		</div>
		<div className="owl-body owl-light-start">
		</div>
		<div className="owl-leg-lt owl-light-start">
		</div>
		<div className="owl-leg-rt owl-light-start">
		</div>
		</div>
		<div className="sheep-nowool sheep-dark-stop">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
	);
    }
});

selifElement[11] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「ふくろうさん　ぼくは　ほんとうの
		  </div>
		  <div className="caption cap4-2">
		  　おかあさんを　さがしているんだ」
	    </div>
		<div className="caption cap4-3">
		「ほんとうの　おかあさん？
		  </div>
		  <div className="caption cap4-4">
		  　きみは　ひつじのこどもだろう」
	    </div>
		</div>
	);
    }
});
pageElement[11] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(11);
    },
    componentDidMount: function(){
	unMountOtherPages(11);
    },
    render: function(){
	return (
		<div>
		<div className="sky black-forest">
		</div>
		<div className="forest-light lighting">
		</div>
		<div className="owl">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leyelash owl-show">
		</div>
		<div className="leye owl-show">
		<div className="black">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reyelash">
		</div>
		<div className="reye">
		<div className="black">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>
		<div className="sheep-nowool sheep-dark-stop">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
	);
    }
});

selifElement[12] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap5-1">
		「でも　きょうだいで　ぼくだけ
		  </div>
		  <div className="caption cap5-2">
		  　ぜんぜん　けがはえてないんだ」
	    </div>
		<div className="caption cap5-3">
		「なるほど　だとすると
		  </div>
		  <div className="caption cap5-4">
		  　がけのうえの
		  </div>
		  <div className="caption cap5-5">
		  　やぎのこどもかもしれん」
	    </div>
		</div>
	);
    }
});
pageElement[12] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(12);
    },
    componentDidMount: function(){
	unMountOtherPages(12);
    },
    render: function(){
	return (
		<div>
		<div className="sky black-forest">
		</div>
		<div className="forest-light lighting">
		</div>
		<div className="ballon1" id="ballon1-owl-goat">
		<div className="goat" id="goat-in-ballon">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye">
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>
		</div>
		<div className="ballon2" id="ballon2-owl-goat">
		</div>
		<div className="ballon3" id="ballon3-owl-goat">
		</div>
		<div className="ballon4" id="ballon4-owl-goat">
		</div>
		<div className="owl">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leyelash owl-show">
		</div>
		<div className="leye owl-show">
		<div className="black">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reyelash">
		</div>
		<div className="reye">
		<div className="black">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-hand"></div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>
		<div className="sheep-nowool sheep-dark-stop">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
	);
    }
});

selifElement[13] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap5-1">
		「ありがとう　ふくろうさん！」
	    </div>
		<div className="caption cap5-2">
		ふくろうに　おれいをいって
	    </div>
		<div className="caption cap5-3">
		もりをぬけると
	    </div>
		<div className="caption cap5-4">
		あたりはすっかり
	    </div>
		<div className="caption cap5-5">
		あさになっていました
	    </div>
		</div>
	);
    }
});
pageElement[13] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(13);
    },
    componentDidMount: function(){
	unMountOtherPages(13);
    },
    render: function(){
	return (
		<div>
		<div className="sky morning">
		</div>
		<div className="sheep-nowool sheep-go-forest" id="sheep-dark-move">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		<div className="forest leave-forest">
		<div className="wood1">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood2">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood3">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood4">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood5">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood6">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood7">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood8">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		<div className="wood9">
		<div className="wood">
		</div>
		<div className="tree">
		</div>
		</div>
		</div>	
		<div className="hill dark-hill"></div>
		</div>
	);
    }
});

selifElement[14] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		しばらくすすむと
	    </div>
		<div className="caption cap4-2">
		みちに　だれかがいました
	    </div>
		<div className="caption cap4-3">
		「きみはだれ？」
	    </div>
		<div className="caption cap4-4">
		「ぼくは　へびだよ」
	    </div>
		</div>
	);
    }
});
pageElement[14] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(14);
    },
    componentDidMount: function(){
	unMountOtherPages(14);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland sheep-meet-snake">
		<div className="sheep-nowool sheep-after-forest">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake snake-first">
		<div className="snake-head">
		<div className="snake-eyelid">

            </div>
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="road"></div>
		</div>
	);
    }
});

selifElement[15] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「こんなところで　なにをしてるの？」
	    </div>
		<div className="caption cap4-2">
		へびが　ききました
	    </div>
		<div className="caption cap4-3">
		「ぼくは　おかあさんをさがしに
		  </div>
		  <div className="caption cap4-4">
		  　がけのうえに　いくところなんだ」
	    </div>
		</div>
	);
    }
});
pageElement[15] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(15);
    },
    componentDidMount: function(){
	unMountOtherPages(15);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="ballon1" id="ballon1-snake-goat">
		<div className="goat" id="goat-in-ballon">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye">
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>
		</div>
		<div className="ballon2" id="ballon2-snake-goat">
		</div>
		<div className="ballon3" id="ballon3-snake-goat">
		</div>
		<div className="ballon4" id="ballon4-snake-goat">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake" id="sheep-and-snake">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-and-sheep">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="road"></div>
		</div>
		
	);
    }
});


selifElement[16] = React.createClass({
    render: function(){
	return (
		<div>
		<div>
		<div className="caption cap5-1">
		「ぼくも　てつだってあげるよ」
	    </div>
		<div className="caption cap5-2">
		へびが　いいました
	    </div>
		<div className="caption cap5-3">
		「ありがとう！」
	    </div>
		<div className="caption cap5-4">
		ひつじが　そういうと
	    </div>
		<div className="caption cap5-5">
		にひきは　あるきだしました
	    </div>
		</div>
		</div>
	);
    }
});

pageElement[16] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(16);
    },
    componentDidMount: function(){
	unMountOtherPages(16);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake" id="sheep-and-snake-move">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left" id="black-left-with-snake"></div>
                <div className="sheep-eye-smiling-with-snake">
                </div>
		</div>
		<div className="rt-eye">
		<div className="black-left" id="black-left-with-snake"></div>
                <div className="sheep-eye-smiling-with-snake">
                </div>
		</div>

	    </div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-and-sheep" id="snake-and-sheep-move">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="road"></div>
		</div>
	);
    }
});

selifElement[17] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap5-1">
		しばらく　すすむと
	    </div>
		<div className="caption cap5-2">
		みちに　おおきなあなが
	    </div>
		<div className="caption cap5-3">
		あいていました
	    </div>
		<div className="caption cap5-4">
		「こまったな　これじゃあ
		  </div>
		  <div className="caption cap5-5">
		  　さきに　すすめないよ」
	    </div>
		</div>
	);
    }
});

pageElement[17] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(17);
    },
    componentDidMount: function(){
	unMountOtherPages(17);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-with-sheep refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="cliff-l"></div>
		<div className="cliff-r"></div>
		</div>
	);
    }
});

selifElement[18] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap5-1">
		「だいじょうぶ
		  </div>
		  <div className="caption cap5-2">
		  　ぼくにまかせて！」
	    </div>
		<div className="caption cap5-3">
		へびは　おおきな　ジャンプをして
	    </div>
		<div className="caption cap5-4">
		ひつじは　へびのせなかをわたって
	    </div>
		<div className="caption cap5-5">
		あなを　わたりました
	    </div>
		</div>
	);
    }
});

pageElement[18] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(18);
    },
    componentDidMount: function(){
	unMountOtherPages(18);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-go-on-snake">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left sheep-take-off-snake"></div>
                <div className="sheep-eye-smiling">
                </div>
		</div>
		<div className="rt-eye">
		<div className="black-left sheep-take-off-snake"></div>
                <div className="sheep-eye-smiling">
                </div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-with-sheep refrect snake-cliff">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-smiling">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="cliff-l"></div>
		<div className="cliff-r"></div>
		</div>

	);
    }
});

selifElement[19] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		さらに 　すすむと
	    </div>
		<div className="caption cap4-2">
		おおきながけに　つきました
	    </div>
		<div className="caption cap4-3">
		やぎは　このうえに
	    </div>
		<div className="caption cap4-4">
		すんでいるのです
	    </div>
		</div>
	);
    }
});
pageElement[19] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(19);
    },
    componentDidMount: function(){
	unMountOtherPages(19);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-with-sheep refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="mountain">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain4">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain7">
		</div>
		<div className="block mountain8">
		</div>
		</div>
		<div className="road"></div>
		</div>
	);
    }
});

selifElement[20] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap2-1">
		がけは　たかくて
	    </div>
		<div className="caption cap2-2">
		とても　のぼれそうにありません
	    </div>
		</div>
	);
    }
});
pageElement[20] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(20);
    },
    componentDidMount: function(){
	unMountOtherPages(20);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland" id="mountain-lookup-sheep">
		<div className="sheep-nowool sheep-with-snake">
		<div className="sheep-head face-to-mountain">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-with-sheep refrect" id="mountain-lookup-snake">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black  face-to-mountain">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="mountain mountain-lookup">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain4">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain7">
		</div>
		<div className="block mountain8">
		</div>
		</div>
		<div className="road mountain-lookup"></div>
		</div>
	);
    }
});

selifElement[21] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		ひつじが　ためしに
	    </div>
		<div className="caption cap3-2">
		のぼうろうとしましたが
	    </div>
		<div className="caption cap3-3">
		おちてしまいました
	    </div>
		</div>
	);
    }
});

pageElement[21] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(21);
    },
    componentDidMount: function(){
	unMountOtherPages(21);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-climing">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-climing-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-climing-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-with-sheep refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="mountain">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain4">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain7">
		</div>
		<div className="block mountain8">
		</div>
		</div>
		<div className="road"></div>
		</div>
	);
    }
});

selifElement[22] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		にひきが　こまっていると
	    </div>
		<div className="caption cap3-2">
		そのこえをきいて
	    </div>
		<div className="caption cap3-3">
		そらから　くもが　おりてきました
	    </div>
		</div>
	);
    }
});
pageElement[22] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(22);
    },
    componentDidMount: function(){
	unMountOtherPages(22);
    },
    render: function(){
	return (
		<div>
		<div>
		<div className="sky">
		</div>
		<div className="spider-with-web">
		<div className="spider-web">
		</div>
		<div className="spider">
		<div className="spider-leye">
		<div className="black">
		</div>
		</div>
		<div className="spider-reye">
		<div className="black">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-crying">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		</div>  
		<div className="snake-with-sheep refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black-line">
		</div>
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="mountain">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain4">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain7">
		</div>
		<div className="block mountain8">
		</div>
		</div>
		<div className="road"></div>
		</div>

	);
    }
});

selifElement[23] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「どうしたの？」
	    </div>
		<div className="caption cap4-2">
		くもが　いいました
	    </div>
		<div className="caption cap4-3">
		「がけのうえの　おかあさんに
		  </div>
		  <div className="caption cap4-4">
		  　あいたいんだけど　のぼれないんだ」
	    </div>
		</div>
	);
    }
});

pageElement[23] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(23);
    },
    componentDidMount: function(){
	unMountOtherPages(23);
    },
    render: function(){
	return (
		<div>
		<div>
		<div className="sky">
		</div>
		<div className="spider-with-sheep">
		<div className="spider-web">
		</div>
		<div className="spider">
		<div className="spider-leye">
		<div className="black">
		</div>
		</div>
		<div className="spider-reye">
		<div className="black">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-spider">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-up-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-up-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		</div>  
		<div className="snake-with-sheep refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black snake-eye-up">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="mountain">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain4">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain7">
		</div>
		<div className="block mountain8">
		</div>
		</div>
		<div className="road"></div>
		</div>
	);
    }
});

selifElement[24] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「ぼくが　つれていってあげるよ」
	    </div>
		<div className="caption cap4-2">
		そういうと　くもは
	    </div>
		<div className="caption cap4-3">
		ひつじとへびを　せなかにのせて
	    </div>
		<div className="caption cap4-4">
		がけを　のぼりはじめました
	    </div>
		</div>
	);
    }
});
pageElement[24] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(24);
    },
    componentDidMount: function(){
	unMountOtherPages(24);
    },
    render: function(){
	return (
		<div>
		<div>
		<div className="sky">
		</div>
		<div className="spider-with-sheep-down">
		<div className="spider-web">
		</div>
		<div className="spider">
		<div className="spider-leye">
		<div className="black">
		</div>
		</div>
		<div className="spider-reye">
		<div className="black">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-on-spider">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="sheep-eye-smile"></div>
		</div>
		<div className="rt-eye">
		<div className="sheep-eye-smile"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		</div>  
		<div className="snake-on-spider refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-smiling">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="mountain">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain4">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain7">
		</div>
		<div className="block mountain8">
		</div>
		</div>
		<div className="road"></div>
		</div>
	);
    }
});

selifElement[25] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		くもが　いとをまきあげると
	    </div>
		<div className="caption cap3-2">
		あっというまに　がけのうえに
	    </div>
		<div className="caption cap3-3">
		つきました
	    </div>
		</div>
	);
    }
});

pageElement[25] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(25);
    },
    componentDidMount: function(){
	unMountOtherPages(25);
    },
    render: function(){
	return (	
		<div>
		<div className="sky">
		</div>
		<div className="spider-with-sheep-up">
		<div className="spider-web">
		</div>
		<div className="spider">
		<div className="spider-leye">
		<div className="black">
		</div>
		</div>
		<div className="spider-reye">
		<div className="black">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-spider-up">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-up-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-up-rt"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-rt  leg-rt3"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>  

		<div className="snake-with-spider-up refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-smiling">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>

		<div className="mountain-top">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		</div>
		</div>
	);
    }
});

selifElement[26] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap2-1">
		がけのうえには
	    </div>
		<div className="caption cap2-2">
		いっぴきのやぎが　すんでいました
	    </div>
		</div>
	);
    }
});

pageElement[26] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(26);
    },
    componentDidMount: function(){
	unMountOtherPages(26);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="spider-mountain-move">
		<div className="spider-web">
		</div>
		<div className="spider">
		<div className="spider-leye">
		<div className="black">
		</div>
		</div>
		<div className="spider-reye">
		<div className="black">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-mountain-move">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-up-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-up-rt"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-rt leg-rt3"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-mountain-move refrect">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-smiling">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>

		<div className="goat" id="goat-mountain-move">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye">
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-move">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[27] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap6-1">
		「おや　ひつじのこどもが
		  </div>
		  <div className="caption cap6-2">
		  　こんなところに　なんのようだい？」
	    </div>
		<div className="caption cap6-3">
		　と、やぎがきくと
	    </div>
		<div className="caption cap6-4">
		「ちがいます　
		  </div>
		  <div className="caption cap6-5">
		  　ぼくは　やぎのこどもなんです」
	    </div>
		<div className="caption cap6-6">
		　と、ひつじが　こたえました
	    </div>
		</div>
	);
    }
});

pageElement[27] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(27);
    },
    componentDidMount: function(){
	unMountOtherPages(27);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>

		<div className="goat" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye">
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[28] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap2-1">
		それをきいた　やぎは
	    </div>
		<div className="caption cap2-2">
		おおごえで　わらいだしました
	    </div>
		</div>
	);
    }
});

pageElement[28] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(28);
    },
    componentDidMount: function(){
	unMountOtherPages(28);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>


		<div className="goat" id="goat-with-sheep">
		<div className="goat-head" id="goat-head-laugh">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye">
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[29] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap6-1">
		「おまえさんは　わたしの
		  </div>
		  <div className="caption cap6-2">
		  　こどもじゃないよ。
		  </div>
		  <div className="caption cap6-3">
		  　だって　やぎには
		  </div>
		  <div className="caption cap6-4">
		  　りっぱな　ひげがあるが
		  </div>
		  <div className="caption cap6-5">
		  　おまえさんには　ないじゃないか」
	    </div>
		<div className="caption cap6-6">
		　と　やぎがいいました
	    </div>
		</div>
	);
    }
});

pageElement[29] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(29);
    },
    componentDidMount: function(){
	unMountOtherPages(29);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-left"></div>
		</div>
		<div className="rt-eye">
		<div className="black-left"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>


		<div className="goat" id="goat-with-sheep">
		<div className="goat-head" id="goat-head-laughed">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye">
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="ballon1">
		<div className="beard" id="bread-in-ballon">
		</div>
		</div>
		<div className="ballon2">
		</div>
		<div className="ballon3">
		</div>
		<div className="ballon4">
		</div>
		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[30] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		それをきいた　ひつじは
	    </div>
		<div className="caption cap4-2">
		「ぼくの　ほんとうの
		  </div>
		  <div className="caption cap4-3">
		  　おかあさんはどこ？」
	    </div>
		<div className="caption cap4-4">
		　といって　なきだしてしまいました
	    </div>
		</div>
	);
    }
});

pageElement[30] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(30);
    },
    componentDidMount: function(){
	unMountOtherPages(30);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat sheep-crying">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black-line">
		</div>
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>


		<div className="goat" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye-worry">
		<div className="goat-eye-black-line">
		</div>
		<div className="goat-eye-black">
		</div>
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[31] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		「おーい　ひつじくーん！」
	    </div>
		<div className="caption cap3-2">
		もりのふくろうが
	    </div>
		<div className="caption cap3-3">
		おおごえで　とんできました
	    </div>
		</div>
	);
    }
});

pageElement[31] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(31);
    },
    componentDidMount: function(){
	unMountOtherPages(31);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="owl" id="owl-come">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leye owl-show">
		<div className="black">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reye">
		<div className="black">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-hand-l"></div>
		<div className="owl-hand-r"></div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat sheep-crying">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-up-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-up-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black" id="snake-eye-up">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>
		<div className="goat" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye-worry">
		<div className="goat-eye-black" id="goat-eye-up">
		</div>
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[32] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「ひつじのおかあさんが　もりで
		  </div>
		  <div className="caption cap4-2">
		  　こどもを　さがしていたんだ。
		  </div>
		  <div className="caption cap4-3">
		  　もしかして　きみの　おかあさん
		  </div>
		  <div className="caption cap4-4">
		  　じゃないかい？」
	    </div>
		</div>
	);
    }
});

pageElement[32] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(32);
    },
    componentDidMount: function(){
	unMountOtherPages(32);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>

		<div className="ballon1" id="ballon1-owl">
		<div className="sheep-mother" id="sheep-mother-in-ballon">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="lt-eye-line"></div>
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="rt-eye-line"></div>
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		</div>
		<div className="ballon2" id="ballon2-owl">
		</div>
		<div className="ballon3" id="ballon3-owl">
		</div>
		<div className="ballon4" id="ballon4-owl">
		</div>

		<div className="owl" id="owl-stay">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leye owl-show">
		<div className="black">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reye">
		<div className="black">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-hand-l"></div>
		<div className="owl-hand-r"></div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat sheep-crying">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-up-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-up-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black" id="snake-eye-up">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>


		<div className="goat" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye-worry">
		<div className="goat-eye-black" id="goat-eye-up">
		</div>
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[33] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		「ママに　あいたいよー！」
	    </div>
		<div className="caption cap4-2">
		それをきいた　ひつじは
	    </div>
		<div className="caption cap4-3">
		さらに　おおきなこえで
	    </div>
		<div className="caption cap4-4">
		なきだしてしまいました
	    </div>
		</div>
	);
    }
});

pageElement[33] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(33);
    },
    componentDidMount: function(){
	unMountOtherPages(33);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="owl" id="owl-stay">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leye owl-show">
		<div className="owl-leye-black-line">
		</div>
		<div className="black">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reye">
		<div className="owl-reye-black-line">
		</div>
		<div className="black">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-hand-l"></div>
		<div className="owl-hand-r"></div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat sheep-crying">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black-line">
		</div>
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>


		<div className="goat" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye-worry">
		<div className="goat-eye-black-line">
		</div>
		<div className="goat-eye-black">
		</div>
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});


selifElement[34] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap1-1">
		「ぼうや！」
	    </div>
		</div>
	);
    }
});

pageElement[34] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(34);
    },
    componentDidMount: function(){
	unMountOtherPages(34);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div className="spider-mountain-move-back">
		<div className="spider-web">
		</div>
		<div className="spider">
		<div className="spider-leye">
		<div className="black">
		</div>
		</div>
		<div className="spider-reye">
		<div className="black">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>

		<div className="sheep-mother" id="sheep-mother-with-spider">
		<div className="sheep-head" id="mother-head-with-spider">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div id="mother-body-with-spider">
		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="leg-rt" id="leg-rt-web"></div>
		<div className="leg-rt-shadow" id="leg-rt-web-shadow"></div>
		</div>
		</div>


		<div className="owl owl-move-back" id="owl-stay">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leye owl-show">
		<div className="owl-leye-black-line">
		</div>
		<div className="black">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reye">
		<div className="owl-reye-black-line">
		</div>
		<div className="black">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-hand-l"></div>
		<div className="owl-hand-r"></div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-with-snake sheep-with-goat sheep-crying" id="sheep-move-back">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep refrect snake-with-goat" id="snake-move-back">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-black-line">
		</div>
		<div className="snake-eye-black">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>


		<div className="goat goat-move-back" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye-worry">
		<div className="goat-eye-black-line">
		</div>
		<div className="goat-eye-black">
		</div>
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat" id="mountain-move-back">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[35] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap1-1">
		「ママ！」
	    </div>
		</div>
	);
    }
});

pageElement[35] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(35);
    },
    componentDidMount: function(){
	unMountOtherPages(35);
    },
    render: function(){
	return (
		<div  id="meet-sheeps">
		<div className="sheep-glassland">
		<div className="sheep-nowool" id="sheep-meet-mother">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="sheep-mother refrect" id="mother-meet-sheep">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		</div>
		</div>

	);
    }
});

selifElement[36] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap5-1">
		「ああ　よかった　ぼうやがぶじで」
	    </div>
		<div className="caption cap5-2">
		「ママ　ごめんなさい！」
	    </div>
		<div className="caption cap5-3">
		「いいのよ　かえりましょう」
	    </div>
		<div className="caption cap5-4">
		ふたりは　みんなに　おれいをいうと
	    </div>
		<div className="caption cap5-5">
		がけをおりて　うちにかえりました
	    </div>
		</div>
	);
    }
});

pageElement[36] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(36);
    },
    componentDidMount: function(){
	unMountOtherPages(36);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		</div>
		<div>
		<div className="spider" id="spider-with-sheeps">
		<div className="spider-leye">
		<div className="spider-eye-smiling">
		</div>
		</div>
		<div className="spider-reye">
		<div className="spider-eye-smiling">
		</div>
		</div>
		<div className="spider-body">
		</div>
		<div className="spider-foot spider-foot1-1">
		</div>
		<div className="spider-foot spider-foot1-2">
		</div>
		<div className="spider-foot spider-foot2-1">
		</div>
		<div className="spider-foot spider-foot2-2">
		</div>
		<div className="spider-foot spider-foot3-1">
		</div>
		<div className="spider-foot spider-foot3-2">
		</div>
		<div className="spider-foot spider-foot4-1">
		</div>
		<div className="spider-foot spider-foot4-2">
		</div>
		<div className="spider-foot spider-foot5-1">
		</div>
		<div className="spider-foot spider-foot5-2">
		</div>
		<div className="spider-foot spider-foot6-1">
		</div>
		<div className="spider-foot spider-foot6-2">
		</div>
		<div className="spider-foot spider-foot7-1">
		</div>
		<div className="spider-foot spider-foot7-2">
		</div>
		<div className="spider-foot spider-foot8-1">
		</div>
		<div className="spider-foot spider-foot8-2">
		</div>
		</div>
		</div>

		<div className="sheep-glassland">
		<div className="sheep-nowool sheep-crying" id="sheep-with-mother">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="snake-with-sheep snake-with-goat">
		<div className="snake-head">
		<div className="snake-eye">
		<div className="snake-eye-smiling">
		</div>
		</div>
		</div>
		<div className="snake-body">
		</div>
		</div>

		<div className="sheep-mother refrect" id="sheep-with-child">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="mother-eye-smiling"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="mother-eye-smiling"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div id="mother-body-with-spider">
		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="leg-rt-shadow"></div>
		</div>
		</div>
		<div className="leg-rt" id="catch-child-leg-rt"></div>


		<div className="owl" id="owl-stay">
		<div className="owl-head">
		<div className="leye-mark">
		</div>
		<div className="leye owl-show">
		<div className="owl-eye-smiling">
		</div>
		</div>
		<div className="reye-mark">
		</div>
		<div className="reye">
		<div className="owl-eye-smiling">
		</div>
		</div>
		<div className="beak"></div>
		</div>
		<div className="owl-hand-l"></div>
		<div className="owl-hand-r"></div>
		<div className="owl-body">
		</div>
		<div className="owl-leg-lt">
		</div>
		<div className="owl-leg-rt">
		</div>
		</div>

		<div className="goat" id="goat-with-sheep">
		<div className="goat-head">
		<div className="lt-corner">
		</div>
		<div className="rt-corner">
		</div>
		<div className="lt-eye-worry">
		<div className="goat-eye-smiling">
		</div>
		</div>
		<div className="beard">
		</div>
		</div>
		
		<div className="goat-body"></div>
		<div className="goat-wool goat-wool1">
		</div>
		<div className="goat-wool goat-wool2">
		</div>
		<div className="goat-wool goat-wool3">
		</div>
		<div className="goat-wool goat-wool4">
		</div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		<div className="goat-tail">
		</div>
		</div>

		<div className="mountain-with-goat">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		<div className="block mountain5">
		</div>
		<div className="block mountain6" id="mountain6-with-sheep">
		</div>
		<div className="block mountain9">
		</div>
		<div className="block mountain10">
		</div> 
		<div className="block mountain11">
		</div> 
		<div className="mountain-g1">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		<div className="mountain-g2">
		<div className="block mountain1">
		</div>
		<div className="block mountain2">
		</div>
		<div className="block mountain3">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[37] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap4-1">
		いえにかえると
	    </div>
		<div className="caption cap4-2">
		あにひつじたちが　ないていました
	    </div>
		<div className="caption cap4-3">
		ふしぎなことに　あにひつじたちの
	    </div>
		<div className="caption cap4-4">
		けが　なくなっています
	    </div>
		</div>
	);
    }
});

pageElement[37] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(37);
    },
    componentDidMount: function(){
	unMountOtherPages(37);
    },
    render: function(){
	return (
		<div>
		<div className="sheep-glassland" id="sheep-nowool-animal-with-mother">
		<div className="sheep-nowool-animal">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		</div>
		<div className="sheep-body"></div>
		<div className="leg-lt-animal"></div>
		<div className="foot-lt-animal"></div>
		<div className="leg-lt-shadow-animal"></div>
		<div className="foot-lt-shadow-animal"></div>
		<div className="leg-rt-animal"></div>
		<div className="foot-rt-animal"></div>
		<div className="leg-rt-shadow-animal"></div>
		<div className="foot-rt-shadow-animal"></div>
		</div>
		</div>

		<div className="sheep-mother" id="sheep-mother-with-children">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="sheep-mother-legs">
		<div className="leg-lt-animal"></div>
		<div className="leg-lt-shadow-animal"></div>
		<div className="foot-lt-animal"></div>
		<div className="foot-lt-shadow-animal"></div>
		<div className="leg-rt-animal"></div>
		<div className="leg-rt-shadow-animal"></div>
		<div className="foot-rt-animal"></div>
		<div className="foot-rt-shadow-animal"></div>
		</div>
		</div>

		<div className="sheep-nowool sheep-crying" id="crying-brother1">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt2"></div>
		<div className="leg-rt" id="leg-rt-crying"></div>
		<div className="leg-rt2"></div>
		</div>      

		<div className="sheep-nowool sheep-crying refrect" id="crying-brother2">
		<p className="drop drop1"></p>
		<p className="drop drop2"></p>
		<p className="drop drop3"></p>
		<p className="drop drop4"></p>
		<p className="drop drop5"></p>
		<p className="drop drop6"></p>
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt2"></div>
		<div className="leg-rt" id="leg-rt-crying"></div>
		<div className="leg-rt2"></div>
		</div>      
		</div>
	);
    }
});

selifElement[38] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		じつは　たくさんはえた　ひつじのけは
	    </div>
		<div className="caption cap3-2">
		にんげんが　ふくを　あむために
	    </div>
		<div className="caption cap3-3">
		ぜんぶ　かりとってしまうのです
	    </div>
		</div>
	);
    }
});

pageElement[38] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(38);
    },
    componentDidMount: function(){
	unMountOtherPages(38);
    },
    render: function(){
	return (
		<div>
		<div className="sheep-cutted">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="sheep-body-cutted1">
		</div>
		<div className="sheep-body-cutted2">
		</div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		<div id="r-arm">
		<div id="arm">
		</div>
		<div id="hand">
		</div>
		<div id="finger1">
		</div>
		<div id="finger2">
		</div>
		<div id="finger3">
		</div>
		<div id="finger4">
		</div>
		<div id="finger5">
		</div>
		<div id="clipper">
		<div id="clipper-body">
		</div>
		<div id="cutter1">
		</div>
		<div id="cutter2">
		</div>
		<div id="cutter3">
		</div>
		<div id="cutter4">
		</div>
		<div id="cutter5">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[39] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap6-1">
		「いままで　ばかにして　ごめんね」
	    </div>
		<div className="caption cap6-2">
		あにひつじたちは
	    </div>
		<div className="caption cap6-3">
		おとうとひつじに　あやまりました
	    </div>
		<div className="caption cap6-4">
		「これで　みんないっしょだね」
	    </div>
		<div className="caption cap6-5">
		おとうとひつじが　いうと
	    </div>
		<div className="caption cap6-6">
		みんな　わらいました
	    </div>
		</div>
	);
    }
});

pageElement[39] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(39);
    },
    componentDidMount: function(){
	unMountOtherPages(39);
    },
    render: function(){
	return (
		<div>
		<div className="sheep-glassland" id="sheep-nowool-animal-with-mother">
		<div className="sheep-nowool sheep-with-mother-and-children">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>

		<div className="lt-eye">
		<div className="sheep-eye-smile"></div>
		</div>
		<div className="rt-eye">
		<div className="sheep-eye-smile"></div>
		</div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>

		<div className="sheep-mother" id="sheep-mother-with-children">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="sheep-eye-smile"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="sheep-eye-smile"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="sheep-mother-legs">
		<div className="leg-lt-animal"></div>
		<div className="leg-lt-shadow-animal"></div>
		<div className="foot-lt-animal"></div>
		<div className="foot-lt-shadow-animal"></div>
		<div className="leg-rt-animal"></div>
		<div className="leg-rt-shadow-animal"></div>
		<div className="foot-rt-animal"></div>
		<div className="foot-rt-shadow-animal"></div>
		</div>
		</div>

		<div className="sheep-crying-back with-brother" id="sorry-brother1">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt2"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>

		<div className="sheep-crying-back with-brother refrect" id="sorry-brother2">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		</div>

		<div className="sheep-body"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt2"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt2"></div>
		</div>
		</div>
	);
    }
});

selifElement[40] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap5-1">
		それいらい
	    </div>
		<div className="caption cap5-2">
		ひつじのかぞくは
	    </div>
		<div className="caption cap5-3">
		けんかもせず　なかよく　くらしました
	    </div>
		<div className="caption cap5-4">
		</div>
		<div className="caption cap5-5">
		　　　　　　　　　　　　おしまい
	    </div>
		</div>
	);
    }
});

pageElement[40] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(40);
    },
    componentDidMount: function(){
	unMountOtherPages(40);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		<div className="house">
		<div className="window">
		</div>
		<div className="chimney"></div>
		</div>
		</div>    
		<div className="hill"></div>
		</div>
	);
    }
});

renderCurrentPage(page);
