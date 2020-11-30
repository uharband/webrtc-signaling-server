const applicationTag = 'App';

class Utils {

    constructor() {
    }
    stringifyError(error) {
        if (typeof (error) === "string") {
            return error;
        }
        return JSON.stringify(error);
    }
    createApplicationConnectionIdFromClientId(clientConnectionId) {
        return clientConnectionId + '~' +  applicationTag;
    }
    getClientConnectionIdFromApplicationId(appConnectionId) {
        var res = appConnectionId.split('~' + applicationTag);
        return res[0];
    }

}

module.exports = new Utils();