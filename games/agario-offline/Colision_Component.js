class Colision_Component {
	constructor( ) {
		this.name = "colision";
		this.elements = [];
	}

	addElement( Element ) {
		Element._colisionCondition = function(){return true};
		Element.onColision = function(){};
		this.elements.push( Element );
	}

	//chequea si hay una colision entre dos elementos de entidad que poseen :
	//circle : x,y,radius
	//rect : x,y,width,height
	//pueden tener algunas propiedades extra como solid,
	Check( Element1 , Element2 ) {

		if( Element1.type === "circle" ) {
			let temp = Element1
			Element1 = Element2;
			Element2 = temp;
		}
		if( Element1.type === "rect" && Element2.type === "rect" )
			return Element1.right >= Element2.left && Element1.left <= Element2.right && Element1.bottom >= Element2.top && Element1.top <= Element2.bottom;

		else if( Element1.type === "rect" && Element2.type === "circle" )
			return Element1.right >= Element2.left && Element1.left <= Element2.right && Element1.bottom >= Element2.top && Element1.top <= Element2.bottom;

		else if( Element1.type === "circle" && Element2.type === "circle" ) {
			let P1 = {
				x : Element1.attr.x,
				y : Element1.attr.y
			};
			let P2 = {
				x : Element2.attr.x,
				y : Element2.attr.y
			};
			return DistanceBetweenPoints( P1 , P2 ) <= Element1.attr.radius + Element2.attr.radius;
		}
	}

	//verifica si dos elementos cualesquiera han colisionado
	TriggeringColisions( ) {
		for( let i=0, max=this.elements.length ; i<max-1 ; i++ ) {
			for( let f=i+1 ; f<max ; f++ ) {
				//verificamos si las condiciones de colision son ok para asegurarte de que esta colisionando con la unidad deseada
				//y a la vez optimiza codigo
				if( this.elements[i]._colisionCondition( this.elements[f] ) &&
					this.elements[f]._colisionCondition( this.elements[i] ) &&
					this.Check( this.elements[i] , this.elements[f] ))
				{
					this.elements[i].onColision( this.elements[f] );
					this.elements[f].onColision( this.elements[i] );
				}
			}
		}
	}

	CheckElementColision( Element ) {
		this.elements.forEach( Ele => {
			if( Element._colisionCondition( Ele ) && this.Check( Element , Ele ) && Element !== Ele ) {
				Element.onColision( Ele );
				Ele.onColision( Element );
			}
		});
	}
}