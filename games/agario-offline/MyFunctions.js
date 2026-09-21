"use strict";

Array.prototype.clone = function ( ) {
	return(
		this.map( element => {
			return element;
		})
	)
};

/*
	elimina todos los elementos de un array indicando los indices en que se encuentran los elementos que quieres eliminar;
	retorna un array con los valores eliminados
*/
Array.prototype.removeElements = function ( ...Indexs ) {
	let count = 0;
	let NewArray = this.filter( ( element , index ) => {
		if( Indexs.indexOf( index ) === -1 ) {
			this[ count ] = this[ index ];
			count++;
			return false;
		} else {
			return true;
		}
	});
	for( let i = Indexs.length ; i > 0 ; i-- ) {
		this.pop( );
	};
	return NewArray;
};

Array.prototype.mezclar = function ( ) {
	let ArrayTemp = this.clone( );
	for( let max = this.length-1 , i = 0 ; max >= 0 ; max-- , i++ ) {
		let Random = GetRandomInteger( 0 , max );
		this[i] = ArrayTemp[ Random ];
		ArrayTemp[ Random ] = ArrayTemp[ max ];
	};
	return this;
};

Array.prototype.orden = function ( stringProperty="name" ) {
	let ArrayTemp = this;
	switch( stringProperty ) {
		case "name" :
			ArrayTemp.sort( );
			break;

		case "number" :
			ArrayTemp.sort( function ( a , b ) {
				return b - a;
			});
			break;

		case "length" :
			ArrayTemp.sort( function ( a , b ) {
				return a.length - b.length;
			});
			break;

		/*
			En el caso de default stringLength posee un valor de la forma "#/atributo/atributo..." y se ordenara de acuerdo a los atributos pasados como paremetro.

			atributo : atributo del JSON a ordenar.

			Este caso solo es recomendado para ordenar un array de objetos JSON donde "atributo" es un atributo comun entre todos los objeto JSON; en caso de que tengas otro JSON como un atributo del JSON original y quieres ordenar los objetos de acuerdo a un atributo del 2do JSON puedes separar los atributos con el caracter "/".
		*/
		default :
				let ListAttr = stringProperty.split( "/" );
				if( ListAttr.shift( ) !== "#" ) return;
				ArrayTemp.sort( function ( a , b ) {
					for( Attr of ListAttr ) {
						a = a[Attr];
						b = b[Attr];
					};
					let valor = a < b ? -1 : 0;
					return valor;
				});
				break;
	};
	return ArrayTemp;
};

function DistanceBetweenPoints( Point1 , Point2 ) {
	let M = Math;
	return M.sqrt( M.pow( Point1.x-Point2.x , 2 ) + M.pow( Point1.y-Point2.y , 2 ) );
}

function GetRandomInteger( min , max ) {
	if( !IsInteger(min) || !IsInteger(max) ) {
		console.error( "no puedeas mandar parametros no enteros a la funcion GetRandomInteger()" );
		return;
	};
	return Math.round( Math.random( )*( max - min ) + min );
}

function GetRandomNumber( min , max , numDecimales=15 ) {
	if( typeof min !== "number" || typeof max !== "number" || typeof numDecimales !== "number" || numDecimales <= 0 || numDecimales > 15 ) {
		console.error( "algun parametro de la funcion GetRandomNumber() no es valido." );
		return;
	};
	let FactorX = Math.pow( 10 , numDecimales );
	return GetRandomInteger( min*FactorX , max*FactorX )/FactorX;
}

function IsInteger( number ) {
	return number % 1 === 0
}

function JoinArrays( ...Arrays ) {
	let ArrayTemp = [];
	Arrays.forEach( element => {
		element.forEach( element =>{
			ArrayTemp.push( element )
		})
	});
	return ArrayTemp;
}


function LoadImg( url , callback=function(){} ) {
	let Img = new Image( );
	Img.src = url;
	Img.onload = callback;
	return Img;
}



function DegToRad( value ) {
	let Pi = Math.PI;
	return value*Pi/180;
}
function D2R( value ) {
	return DegToRad( value );
}

function RadToDeg( value ) {
	let Pi = Math.PI;
	return value*180/Pi;
}
function R2D( value ) {
	return RadToDeg( value );
}

function DescomponerEnPrimos(Number){
	if( !IsInteger(Number) ) {
		console.error("no puedes desconponer un numero decimal en factores primos");
		return;
	};
  	var primos = GetPrimos(100000);
  	var cont = 0,
  		values = [],
  		multiplos = [];
  	while( cont < primos.length ) {
    	let primo = primos[cont];
    	if( Number % primo === 0 ) {
      		Number = Number/primo;
      		values.push( Number );
      		multiplos.push( primo );
    	} else if( Number === 1 ) {
      		cont = primos.length
    	} else if( Number / primo > Math.sqrt( Number ) ) {
    		values.push( 1 );
    		multiplos.push( Number )
    		Number = 1;
    	} else {
    		cont++
    	};
  	};
  	console.log(values);
  	return multiplos;
}

/*
	Este es un algoritmo muy mal optimizado pero cumple con su funcion;
	devuelve todos los numeros primos desde el dos hasta el numero indicado por el parametro Max
	nota: en una pc con 2.5 de procesador a partir de 10^5 tarda .5s y con 10^6 tarda mas de 30s 
*/
function GetPrimos1(Max){
  	let Primos = [2]
  	for( let number=3 ; number<=Max ; number++ ) {
    	for( let index=0 , PrimosLen=Primos.length ; index < PrimosLen ; index++ ){
      		if( number % Primos[index] == 0 ) {
        		break
      		} else if( Primos[index] > number/2 ) {
        		Primos.push(number)
        		break
      		}
    	}
  	}
  return Primos
}
/*
	este algoritmo es mas eficaz que el anterior:
	4-5 veces para 10^4 con promedio de 0.003s
	22-25 veces para 10^5 con promedio de 0.021s
	75-78 veces para 10^6 con promedio de 0.379s
	xxxxx  ""    ""  10^7 ""     ""    "" 7.8s
*/
function GetPrimos2(Max){
  let Primos = [2]
  for( let number=3 ; number<=Max ; number++ ) {
    for( let index=0, PrimosLen=Primos.length ; index < PrimosLen ; index++ ){
      if( number % Primos[index] == 0 ) {
        break
      } else if( Primos[index] > number/Primos[index] ) {
        Primos.push(number)
        break
      }
    }
  }
  return Primos
}

function GetPrimos(Max){
  	let primos = [2];
  	for( let number=3 ; number<=Max ; number+=2 ) {
    	for( let index=0, primosLen=primos.length ; index < primosLen ; index++ ) {
     	 	if( number % primos[index] == 0 ) {
        		break;
      		} else if( primos[index] > number/primos[index] ) {
        		primos.push(number);
        		break;
      		}
    	}
  	}
  	return primos;
}

function Evaluar( Callback , ...Params ) {
	let a = performance.now( );
	Callback( ...Params );
	let b = performance.now( );
	return( b-a );
}

