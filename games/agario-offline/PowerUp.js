class PowerUp {
	constructor( entitie ) {
		this.entitie = entitie;
		this.power = {
			// divide : , ToDo

		};
	}

	Phantom( ) {
		if( !this.entitie.hasName("phantom") ) {
			let	Color = "rgba(0,0,0,0.2)";
			this.entitie.addName("phantom");
			this.entitie.properties.color = Color;
			this.SpeedUp( 2 );
			this.timePhantom = setTimeout( ( ) => {
				this.entitie.removeName("phantom");
				this.entitie.properties.color = this.entitie._color;
			} , 6500 );

		} else {
			//reseteamos el timeout
			clearTimeout( this.timePhantom );
			this.timePhantom = setTimeout( ( ) => {
				this.entitie.removeName("phantom");
				this.entitie.properties.color = this.entitie._color;
			} , 6500 );
		};
	}

	SpeedUp( Up , seconds=10000 ) {
		this.entitie._speed *= Up;
		setTimeout( ( ) => {
			this.entitie._speed /= Up;
		} , seconds );
	}

	Slow( slow=2 , seconds=13000 ) {
		this.entitie._speed /= slow;
		setTimeout( ( ) => {
			this.entitie._speed *= slow;
		} , seconds );
	}

	MasaBonus( ) {
		let Masa_Bonus = this.entitie.properties.masa*0.15;
		this.entitie.properties.masa += Masa_Bonus;
		this.entitie.properties.masaOscura += Masa_Bonus;
		setTimeout( ( ) => {
			this.entitie.properties.masa -= Masa_Bonus;
			this.entitie.properties.masaOscura -= Masa_Bonus;
		} , 20000 );
	}
}