Inputs = function() {

	_this = this;
	_pressed = [];

	this.KEY = {
		BACKSPACE: 8,
		TAB: 9,
		ENTER: 13,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,
		ESCAPE: 27,

		LEFT_ARROW: 37,
		UP_ARROW: 38,
		RIGHT_ARROW: 39,
		DOWN_ARROW: 40,

		A: 65,
		B: 66,
		C: 67,
		D: 68,
		E: 69,
		F: 70,
		G: 71,
		H: 72,
		I: 73,
		J: 74,
		K: 75,
		L: 76,
		M: 77,
		N: 78,
		O: 79,
		P: 80,
		Q: 81,
		R: 82,
		S: 83,
		T: 84,
		U: 85,
		V: 86,
		W: 87,
		X: 88,
		Y: 89,
		Z: 90,

		NUM0: 48,
		NUM1: 49,
		NUM2: 50,
		NUM3: 51,
		NUM4: 52,
		NUM5: 53,
		NUM6: 54,
		NUM7: 55,
		NUM8: 56,
		NUM9: 57,


		NUM_PAD0: 96,
		NUM_PAD1: 97,
		NUM_PAD2: 98,
		NUM_PAD3: 99,
		NUM_PAD4: 100,
		NUM_PAD5: 101,
		NUM_PAD6: 102,
		NUM_PAD7: 103,
		NUM_PAD8: 104,
		NUM_PAD9: 105

	}

	var onKeyUp = function( event) {
		delete _pressed[ event.keyCode];
	}
	
	var onKeyDown = function( event) {
		_pressed[ event.keyCode] = true;
	}

	this.isDown = function( keycode) {
		return _pressed[ keycode];
	}

	window.addEventListener( 'keyup', function( event) { onKeyUp( event); });
	window.addEventListener( 'keydown', function( event) { onKeyDown( event); });

}