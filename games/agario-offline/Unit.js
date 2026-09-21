class Unit extends Entities {
	constructor( board , attr , Properties , Names , Component ) {
		super( "circle" , attr , Names , Component );
		this.properties = Properties;
		this.board = board;
		//seteamos valores default de masa y speed
		this._speed = Properties.speed;
		this._masa = Properties.masa;
		this._color = Properties.color;

		this.inputs = board.Inputs;
		this.PowerUp = new PowerUp( this );

		this.board.Events.Listen( "kill" , (Event) => {
			return Event.killed === this;
		} , this.onKill.bind(this) );


		//como todos las entidades Unit tendran el componente Colision y el mismo metodo onColision lo coloco aqui
		this.onColision = ColisionUnit => {
			//si la masa de esta unidad es mayor que la otra entonces añade la masa de otra unidad a esta y respawn la otra unidad;
			if( DistanceBetweenPoints( this.attr , ColisionUnit.attr ) <= this.attr.radius &&
				//comprovamos si la masa de la unidad es mayor que la masa de la otra, quitando los bonus de masas
			 	this.properties.masa-(this.properties.masaOscura || 0) > ColisionUnit.properties.masa-(ColisionUnit.properties.masaOscura || 0) &&
			 	this._colisionCondition(ColisionUnit) )
			{
				this.board.Events.Emit( "kill" , {
					killer : this,
					killed : ColisionUnit
				});
			}
		};
		this._colisionCondition = ColisionUnit => {
			return !ColisionUnit.hasName("phantom") || (this.hasName("phantom") && ColisionUnit.hasName("food"));
		};

		this.Init( );
	}

	Init( ) {
		let	x = GetRandomInteger( 10 , Math.round(this.board.width-10) ),
			y = GetRandomInteger( 10 , Math.round(this.board.height-10) ),
			masa = this._masa;

		this.attr.x = x;
		this.attr.y = y;
		this.properties.masa = masa;
		this.attr.radius = Math.sqrt( this.properties.masa/Math.PI );
	}

	UpdateRadius( ) {
		//reducimos la masa con el pasar del tiempo si es mayor que la masa inicial
		if( this.properties.masa > 1000 )
			//*****************************mejorar esto*************************************
			this.properties.masa -= this.attr.radius/this.board.Canvas.fps;
		this.properties.speed = this._speed*Math.pow( 0.98 , this.properties.masa/100 );
		this.attr.radius = Math.sqrt( this.properties.masa/Math.PI );
	}

	Draw( Ctx ) {
		Ctx.DrawCircle( this.attr.x , this.attr.y , this.attr.radius , false , this.properties.color );
	}

	Update( ) {
		let dx = 0,
			dy = 0;

		this.UpdateRadius( );
		if( this.inputs.isDown( this.properties.up ) && this.top > 0 ) {
			dy += -1;
		};
		if( this.inputs.isDown( this.properties.down ) && this.bottom < this.board.height ) {
			dy += 1;
		};
		if( this.inputs.isDown( this.properties.left ) && this.left > 0 ) {
			dx += -1;
		};
		if( this.inputs.isDown( this.properties.right ) && this.right < this.board.width ) {
			dx += 1;
		};
		let angle = Math.atan2( dy , dx );
		if( angle === 0 && dy === 0 && dx === 0 ) return;

		this.attr.y += Math.sin(angle)*this.properties.speed/this.board.Canvas.fps;
		this.attr.x += Math.cos(angle)*this.properties.speed/this.board.Canvas.fps;
	}

	onKill( Event ) {
		Event.killer.properties.masa += this.properties.masa;
		this.Init( );
	}
}