class Board {
	constructor( canvas , width , height ) {
		this.Inputs = new Inputs( );
		this.Events = new Events( );
		this.Colision = new Colision_Component( );

		this.width = width;
		this.height = height;

		this.Canvas = new Canvas( canvas , width , height , 60 );

		this.entities = [];
		this.units = [];
		this.foods = [];
		this.colors = ["green","blue","red","pink","orange","purple"];

		this.pause = false;
	}

	DrawBoard( ) {
		for( let i=0, max=this.entities.length ; i<max ; i++ ) {
			this.entities[i].Draw( this.Canvas );
		}
	}
	UpdateBoard( ) {
		for( let i=0, max=this.units.length ; i<max ; i++ ) {
			this.units[i].Update( );
		};
		this.units.forEach( Element => {
			this.Colision.CheckElementColision( Element );
		});
	}

	NewUnit( attr , properties , names , components ) {
		let _Unit = new Unit( this , attr , properties , names , components );
		this.entities.push( _Unit );
		this.units.push( _Unit );
	}
	NewFood( attr , properties , names , components ) {
		let _Food = new Food( this , attr , properties , names , components );
		this.entities.push( _Food );
		this.foods.push( _Food );
	}

	Init( ) {
		//colocamos los puntitos que se comen
		for(let i=0 ; i<150 ; i++ ) {
			this.NewFood( {} , {} , ["food"] , {colision:this.Colision} );
		};
		this.NewUnit( {} ,
			//properties
			{
				up : this.Inputs.KEY.W,
				down : this.Inputs.KEY.S,
				left : this.Inputs.KEY.A,
				right : this.Inputs.KEY.D,
				speed : 300,
				masa : 50,
				color : "blue"
			}, ["player"] , {colision:this.Colision} );
		this.NewUnit( {} ,
			{
				up : this.Inputs.KEY.NUM_PAD5,
				down : this.Inputs.KEY.NUM_PAD2,
				left : this.Inputs.KEY.NUM_PAD1,
				right : this.Inputs.KEY.NUM_PAD3,
				speed : 300,
				masa : 50,
				color : "red"
			}, ["player"] , {colision:this.Colision} );
		this.NewUnit( {} ,
			{
				up : this.Inputs.KEY.Y,
				down : this.Inputs.KEY.H,
				left : this.Inputs.KEY.G,
				right : this.Inputs.KEY.J,
				speed : 300,
				masa : 50,
				color : "green"
			}, ["player"] , {colision:this.Colision} );

		this.NewUnit( {} ,
			{
				up : this.Inputs.KEY.P,
				down : 186,
				left : this.Inputs.KEY.L,
				right : 222,
				speed : 300,
				masa : 50,
				color : "gray"
			}, ["player"] , {colision:this.Colision} );

		this.Canvas.Update = this.UpdateBoard.bind( this );
		this.Canvas.Render = this.DrawBoard.bind( this );
	}
}