class Entities {
	constructor( type , attr , Names , Components ) {
		this.attr = attr;
		//type es el tipo de forma que posee la entidad: rect o circle
		this.type = type;
		//names es un array de strings para nombrar a la entidad
		this.names = Names || [];
		//Component es un object cullas claves son los distintos componentes del juego aplicados a esa unidad y que permiten mandar mensajes a los otros componentes y entidades con componentes. Ejemplos de componentes : colisiones , movimientos
		this.components = Components || {};
		//la imagen que se usara para renderizar la entidad
		this._img = null;

		//el key es el nombre del componente y el value el object
		for( let Component in this.components ) {
			this.components[Component].addElement( this );
		}
	}

	//seteo estas funciones para evitar posibles errores
	Draw(){}
	Update(){}

	set img( img ) {
		let Img = document.createElement("canvas");
		Img.width = this.attr.width;
		Img.heigt = this.attr.height;

		let Ctx = new Canvas( Img , Img.width , Img.height , 0 );

		if( typeof img === "function" ) 
			img( Ctx );
		else
			Ctx.drawImage( img , 0 , 0 , Img.width , Img.height );
		this._img = Ctx.canvas;
	}
	get img( ) {
		return this._img;
	}

	set top( top ) {
		if( this.type === "rect" )
			this.attr.y = top;
		else if( this.type === "circle" )
			this.attr.y = top + this.attr.radius;
	}
	get top( ) {
		if( this.type === "rect" )
			return this.attr.y;
		else if( this.type === "circle" )
			return this.attr.y - this.attr.radius;
	}

	set bottom( bottom ) {
		if( this.type === "rect" )
			this.attr.y = bottom - this.attr.height;
		else if( this.type === "circle" )
			this.attr.y = bottom - this.attr.radius;
	}
	get bottom( ) {
		if( this.type === "rect" )
			return this.attr.y + this.attr.height;
		else if( this.type === "circle" )
			return this.attr.y + this.attr.radius;
	}

	set left( left ) {
		if( this.type === "rect" )
			this.attr.x = left;
		else if( this.type === "circle" )
			this.attr.x = left + this.attr.radius;
	}
	get left( ) {
		if( this.type === "rect" )
			return this.attr.x;
		else if( this.type === "circle" )
			return this.attr.x - this.attr.radius;
	}

	set right( right ) {
		if( this.type === "rect" )
			this.attr.x = right - this.attr.width;
		else if( this.type === "circle" )
			this.attr.x = right - this.attr.radius;
	}
	get right( ) {
		if( this.type === "rect" )
			return this.attr.x + this.attr.width;
		else if( this.type === "circle" )
			return this.attr.x + this.attr.radius;
	}
}

//verificamos la entidad tiene un nombre dado y si lo tiene retorna su posicion, de lo contrario retorna false
Entities.prototype.hasName = function( name ) {
	let index = this.names.indexOf( name );
	if( index !== -1 )
		return true;
	else
		return false;
}

Entities.prototype.addName = function( name ) {
	let hasName = this.hasName( name );
	if( !hasName )
		this.names.push( name );
}
Entities.prototype.removeName = function( name ) {
	//verificamos si la entidad tiene el nombre dado y guardamos su posicion en el array para luego removerlo
	let hasName = this.hasName( name );
	if( hasName ) {
		let index = this.names.indexOf( name );
		this.names.removeElements( index );
	}
}


Entities.prototype.hasComponent = function( component ) {
	return this.components[component];
}

Entities.prototype.addComponent = function( component ) {
	let hasComponent = this.hasComponent( component );
	if( hasComponent )
		this.components[component.name] = component;
}
//por ahora removeComponent no debe ser utilizado por mal funcionamiento
Entities.prototype.removeComponent = function( component ) {
	let hasComponent = this.hasComponent( component );
	if( hasComponent )
		this.components[component] = null;
}