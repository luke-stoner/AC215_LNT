import { BASE_API_URL } from "./Common";

const axios = require('axios');

const DataService = {
    Init: function () {
        // Any application initialization logic comes here
    },
    GetExperiments: async function () {
        return await axios.get(BASE_API_URL + "/experiments");
    },
}

export default DataService;