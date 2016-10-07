
var MockDynamo = {
    userIdMap: {},

    get: function(table, userId, callback) {
        var params = {
            Key: {
                userId: userId
            },
            TableName: table,
            ConsistentRead: true
        };

        console.log("UserID: " + userId);
        var data = MockDynamo.userIdMap[userId];
        if (data === undefined || data === null || isEmptyObject(data)) {
            callback(null, {});
        } else {
            console.log(data.Item['mapAttr'].STATE);
            callback(null, data.Item['mapAttr']);
        }
    },

    set: function(table, userId, data, callback) {
        var params = {
            Item: {
                userId: userId,
                mapAttr: data
            },
            TableName: table
        };

        console.log("Set: " + data.STATE);

        MockDynamo.userIdMap[userId] = params;
        callback(null, data);

    },

    reset: function () {
        MockDynamo.userIdMap = {};
    }
}

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

module.exports = MockDynamo;