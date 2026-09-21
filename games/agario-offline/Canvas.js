class Canvas {
	constructor( Canvas , width , height , fps=30 ) {
		this.canvas = Canvas;
		this.width = width;
		this.height = height;
		this.fps = fps;

		this.ctx = Canvas.getContext("2d");
		this._lastTime = 0;

		//funciones que se ejecutan cada vez que se actualiza el juego y debe ser definido por el usuario
		//update para actualizar los valoes y Render para dibujar con los nuevos valores
		this.CanUpdate = function(){return true};
		this.Update = function(){};
		this.Render = function(){};

		//Ajustamos el ancho y alto del canvas a los valores establecidos
		Canvas.setAttribute( 'width' , this.width );
		Canvas.setAttribute( 'height' , this.height );

		if( fps === 0 || fps == null )
			this.Run( );
		 else
			this.mainInterval = setInterval( this.Run.bind( this ) , 1000/fps );
	}

	//corre el bucle principal
	Run( ) {
		let _timeNow = performance.now( );
		let _lag = _timeNow - this.lastTime;

		if( this.CanUpdate( ) === true ) {
			this.Update( );
			this.draw( );
		}

		this._lastTime = _timeNow;
	}

	draw( ) {
		if ( this.clearColor != null) {
			var v = this.ctx.fillStyle;
			this.ctx.fillStyle = this.clearColor;
			this.ctx.fillRect( 0, 0, this.width, this.height);
			this.ctx.fillStyle = v;
		} else this.ctx.clearRect( 0, 0, this.width, this.height);
		this.Render( );
	}

	DrawLine( x1 , y1 , x2 , y2 ) {
		this.ctx.beginPath( );
			this.ctx.moveTo( x1 , y1 );
			this.ctx.ineTo( x2 , y2 );
	}


	DrawRect( x , y , width , height , outline=true ) {
		outline ?
			this.ctx.strokeRect( x , y , width , height )
		:
			this.ctx.fillRect( x , y , width , height );
	}

	DrawCircle( x , y , radius , outline=true , color="black" ) {
		this.ctx.fillStyle = color;
		this.ctx.strokeStyle = color;
		this.ctx.beginPath();
			this.ctx.arc( x , y , radius , 0 , Math.PI * 2 , true );
			outline ? this.ctx.stroke( ) : this.ctx.fill( );
	}

	DrawTriangle( x1, y1, x2, y2, x3, y3, outline=true ) {
		this.ctx.beginPath();
			this.ctx.moveTo( x1, y1);
			this.ctx.lineTo( x2, y2);
			this.ctx.lineTo( x3, y3);
			this.ctx.lineTo( x1, y1);
			outline ? this.ctx.stroke() : this.ctx.fill();
		this.ctx.closePath();
	}

	drawText( x, y, string, align) {
		this.ctx.font = this.font;
		this.ctx.fillText( string, x, y);
	}

	DrawImage( img , x , y , width , height , rotate=0 ) {
		let dx = width/2,
			dy = height/2;
		this.ctx.save( );
		this.ctx.translate( x+dx , y+dy );
		this.ctx.rotate( D2R(rotate) );
		this.ctx.drawImage( img , -dx , -dy , width , height );
		this.ctx.restore( );
	}
}