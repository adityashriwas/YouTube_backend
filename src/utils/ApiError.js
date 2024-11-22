class ApiError extends Error{
    constructor(
        statuscode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statuscode = statuscode;
        this.errors = errors;
        this.data = null;
        this.message = message;
        this.success = false;

        if(stack){
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }