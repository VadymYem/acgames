class Food extends Entities {
	constructor( board , attr , Properties , Names , Components ) {
		super( "circle" , attr , Names , Components );
		this.properties = Properties;
		this.board = board;
		this.colors = board.colors;

		this.board.Events.Listen( "kill" , (Event) => {
			return Event.killed === this;
		} , this.onKill.bind(this) );

		this.Init( );
	}

	Init( ) {
		let	x = GetRandomInteger( 10 , Math.round(this.board.width-10) ),
			y = GetRandomInteger( 10 , Math.round(this.board.height-10) ),
			masa = GetRandomInteger( 5 , 53 );
		this.properties.color = this.colors[GetRandomInteger(0,this.colors.length-1)];

		//seteamos las comidas que proporcionan powers
		if( masa > 50 ) {
			let int = GetRandomInteger( 0 , 7 );
			masa = GetRandomInteger( 200 , 2500 );
			switch( int ) {
				//phantom
				case 0 :
					this.properties.color = "rgb( 100 , 100 , 100 )";
					this.addName("power_phantom");
					break;

				//speedUp
				case 1 :
					this.properties.color = "yellow";
					this.addName("power_speedUp");
					break;

				//slow
				case 2 :
					this.addName("power_slow");
					break;

				//masaBonus
				case 3 :
					this.addName("power_masaBonus");
					break;

				case 4 :
					this.addName("power_superSpeed");
					break;

				case 5 :
					this.addName("power_stun");
					break;

			}
		}

		this.attr.x = x;
		this.attr.y = y;
		this.properties.masa = masa;
		this.attr.radius = Math.sqrt( this.properties.masa/Math.PI );
	}

	Draw( Ctx ) {
		Ctx.DrawCircle( this.attr.x , this.attr.y , this.attr.radius , false , this.properties.color );
	}

	onKill( Event ) {
		if( this.hasName("power_phantom") ) {
			Event.killer.PowerUp.Phantom( );
			this.removeName("power_phantom");

		} else if( this.hasName("power_speedUp") ) {
			Event.killer.PowerUp.SpeedUp( 1.3 );
			this.removeName("power_speedUp");

		} else if( this.hasName("power_slow") ) {
			Event.killer.PowerUp.Slow( );
			this.removeName("power_slow");

		} else if( this.hasName("power_masaBonus") ) {
			Event.killer.PowerUp.MasaBonus( );
			this.removeName("power_masaBonus");

		} else if( this.hasName("power_superSpeed") ) {
			Event.killer.PowerUp.SpeedUp( 2 , 2500 );
			this.removeName("power_superSpeed");

		} else if( this.hasName("power_stun") ) {
			Event.killer.PowerUp.Slow( 1000 , 3000 );
			this.removeName("power_stun");

		} else {
			Event.killer.properties.masa += this.properties.masa;
		}

		this.Init( );
	}
}