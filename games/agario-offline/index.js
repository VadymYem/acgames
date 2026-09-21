addEventListener( "load" , function( ) {
	let canvas = document.getElementById('canvas');
	let _Board = new Board( canvas , window.innerWidth*0.95 , window.innerHeight*0.94 );
	_Board.Init( );
})