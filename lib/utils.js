class Utils {
    constructor() {
    }
    stringifyError(error) {
        if (typeof (error) === "string") {
            return error;
        }
        return JSON.stringify(error);
    }

}

module.exports = new Utils();