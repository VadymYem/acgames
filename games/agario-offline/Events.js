class Events {
    constructor() {
        this.events = {};
    }

    Emit( event , eventData ) {
        this.events[event].conditions.forEach( (condition , index ) => {
        	if( condition( eventData ) ) {
        		this.events[event].functions[index]( eventData );
        	}
        });

        return this;
    }

    Listen( event , ConditionFunc , func ) {
    	this.events[event] = this.events[event] || {conditions:[],functions:[]};
        this.events[event].conditions.push( ConditionFunc );
        this.events[event].functions.push( func );

        return this;
    }

    RegisterEvent( event ) {
    	this.events[event] = {
    		conditions : [],
    		functions : []
    	}
    }

    Ignore(event, listener) {
        const index = (this.events[event] || []).indexOf(listener);
        if (index >= 0) {
            this.events[event].splice(index, 1);
        }
    }
}