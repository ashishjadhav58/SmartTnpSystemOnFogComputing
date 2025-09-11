const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const region = "ap-south-1";
const table = "EvolveAuthTable";

const table1 = "FogEvolveDriveTables";
const table2 = "FogEvolveTpoEventTables";
const table3 = "FogEvolveResourceTables";
const table4 = "FogEvolveMessageTables";
const table5 = "FogEvolveAttendanceTables";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docclient = DynamoDBDocumentClient.from(dynamoClient);


const fogServers = [
    "https://026898f49fc2.ngrok-free.app"
];

const getIpResult = async (url) => {
    console.log("getIpResult",url);
    try {
        const response = await axios.get(`${url}/status`);
        const { cpu, memory, activeJobs, status } = response.data;
        console.log(response.data);
        if (status !== "up") {
            throw new Error("Fog is not active");
        }

        const loadScore = cpu + memory + activeJobs * 10;

        return {
            ip: url,
            cpu,
            memory,
            activeJobs,
            status,
            loadScore
        };
    } catch (err) {
        return {
            ip: url,
            status: "down",
            loadScore: Number.POSITIVE_INFINITY,
            error: err.message || "Unavailable"
        };
    }
};

const getBestFogServer = async () => {
    console.log("getBestFogServer");

    const results = await Promise.all(fogServers.map(getIpResult));

    const available = results.filter(server => server.status === "up");

    if (available.length === 0) {
        return { message: "No active fog servers found" };
    }

    const best = available.reduce((min, curr) =>
        curr.loadScore < min.loadScore ? curr : min
    );

    return best.ip;
};


exports.handler = async (event) => {
    console.log(event);
    const method = event.httpMethod;
    const path = event.path;
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };
    try {
        if (method == "OPTIONS") {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ Message: "Connection Establish Successfully ... " })
            }
        }
        if (method === "POST" && path.endsWith("/signin")) {
            console.log("Signin Method");
            const { username, password } = JSON.parse(event.body);
            console.log(username, password);
            const data = await docclient.send(new GetCommand({ TableName: table, Key: { email: username } }))
            console.log(data.Item);
            const backendip = await getBestFogServer();
            console.log("best ip",backendip);
            return ({
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    data: data,
                    ip: backendip,
                    message: "Login Successful"
                })
            })
        }
        if(method === "POST" && path.endsWith("/syncdata")){
            console.log("request is coming");
            try{
                const response = JSON.parse(event.body);
                const synctable = response.syncTable;
                switch(synctable){
                    case "1": {
                        try {
                            const {
                                id,
                                updatedAt,
                                createdAt,
                                status,
                                registrationLink,
                                description,
                                driveDate,
                                eligibilityCriteria,
                                salaryPackage,
                                jobRole,
                                companyName,
                                sourcefog
                            } = response;
                    
                            console.log("1");
                    
                            const data = {
                                id,
                                updatedAt,
                                createdAt,
                                status,
                                registrationLink,
                                description,
                                driveDate,
                                eligibilityCriteria,
                                salaryPackage,
                                jobRole,
                                companyName
                            };
                    
                            console.log("2");
                    
                            // Save data into DynamoDB
                            await docclient.send(new PutCommand({ TableName: table1, Item: data }));
                            console.log("3");
                    
                            // Broadcast to all fog servers except the sourcefog
                            const broadcastPromises = fogServers
                                .filter((server) => server !== sourcefog) // exclude sender fog
                                .map(async (server) => {
                                    try {
                                        const res = await axios.post(`${server}/fogsynctable1`, data);
                                        console.log(`✅ Sent to ${server}:`, res.data);
                                    } catch (err) {
                                        console.error(`❌ Error sending to ${server}:`, err.message);
                                    }
                                });
                    
                            // Wait for all broadcasts to complete
                            await Promise.all(broadcastPromises);
                    
                            console.log("4");
                    
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({
                                    message: "User is successfully added and broadcasted"
                                })
                            };
                        } catch (err) {
                            console.error("❌ Error in case 1 block:", err.message);
                            return {
                                statusCode: 500,
                                headers,
                                body: JSON.stringify({
                                    message: "Failed to add user or broadcast",
                                    error: err.message
                                })
                            };
                        }
                    }
                    case "2": {
                        try {
                            const {
                                id,
                                lecturer,
                                lectureName,
                                eventDateTime,
                                venue,
                                description,
                                status,
                                sourcefog
                            } = response;  // assuming response carries event data
                    
                            console.log("Case 2 started");
                    
                            const data = {
                                id,
                                lecturer,
                                lectureName,
                                eventDateTime,
                                venue,
                                description,
                                status
                            };
                    
                            console.log("Saving event to DynamoDB...");
                    
                            // Save event into DynamoDB
                            await docclient.send(new PutCommand({ TableName: table2, Item: data }));
                    
                            console.log("Event saved, broadcasting to other fog nodes...");
                    
                            // Broadcast to other fog servers
                            const broadcastPromises = fogServers
                                .filter((server) => server !== sourcefog) // exclude sender fog
                                .map(async (server) => {
                                    try {
                                        const res = await axios.post(`${server}/fogsynctable2`, data);
                                        console.log(`✅ Event sent to ${server}:`, res.data);
                                    } catch (err) {
                                        console.error(`❌ Error sending event to ${server}:`, err.message);
                                    }
                                });
                    
                            // Wait for all broadcasts
                            await Promise.all(broadcastPromises);
                    
                            console.log("Case 2 completed");
                    
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({
                                    message: "Event successfully added and broadcasted"
                                })
                            };
                        } catch (err) {
                            console.error("❌ Error in case 2 block:", err.message);
                            return {
                                statusCode: 500,
                                headers,
                                body: JSON.stringify({
                                    message: "Failed to add event or broadcast",
                                    error: err.message
                                })
                            };
                        }
                    }
                    case "3": {
                        try {
                            const {
                                id,
                                resourceName,
                                description,
                                category,
                                driveLink,
                                uploadedBy,
                                uploadDate,
                                sourcefog
                            } = response;  // assuming resource data comes in response
                    
                            console.log("Case 3 started");
                    
                            const data = {
                                id,
                                resourceName,
                                description,
                                category,
                                driveLink,
                                uploadedBy,
                                uploadDate
                            };
                    
                            console.log("Saving resource to DynamoDB...");
                    
                            // Save resource into DynamoDB
                            await docclient.send(new PutCommand({ TableName: table3, Item: data }));
                    
                            console.log("Resource saved, broadcasting to other fog nodes...");
                    
                            // Broadcast to other fog servers except the source
                            const broadcastPromises = fogServers
                                .filter((server) => server !== sourcefog)
                                .map(async (server) => {
                                    try {
                                        const res = await axios.post(`${server}/fogsynctable3`, data);
                                        console.log(`✅ Resource sent to ${server}:`, res.data);
                                    } catch (err) {
                                        console.error(`❌ Error sending resource to ${server}:`, err.message);
                                    }
                                });
                    
                            // Wait for all broadcasts to finish
                            await Promise.all(broadcastPromises);
                    
                            console.log("Case 3 completed");
                    
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({
                                    message: "Resource successfully added and broadcasted"
                                })
                            };
                        } catch (err) {
                            console.error("❌ Error in case 3 block:", err.message);
                            return {
                                statusCode: 500,
                                headers,
                                body: JSON.stringify({
                                    message: "Failed to add resource or broadcast",
                                    error: err.message
                                })
                            };
                        }
                    }                    
                    case "4": {
                        try {
                            const {
                                id,
                                sender,
                                receiver,
                                msg,
                                read,
                                sourcefog
                            } = response;  // assuming message body comes from response
                    
                            console.log("Case 4 started");
                    
                            const data = {
                                id,
                                sender,
                                receiver,
                                msg,
                                read: read ?? false  // default false if not passed
                            };
                    
                            console.log("Saving message to DynamoDB...");
                    
                            // Save message into DynamoDB
                            await docclient.send(new PutCommand({ TableName: table4, Item: data }));
                    
                            console.log("Message saved, broadcasting to other fog nodes...");
                    
                            // Broadcast to all fog servers except the sourcefog
                            const broadcastPromises = fogServers
                                .filter((server) => server !== sourcefog)
                                .map(async (server) => {
                                    try {
                                        const res = await axios.post(`${server}/fogsynctable4`, data);
                                        console.log(`✅ Message sent to ${server}:`, res.data);
                                    } catch (err) {
                                        console.error(`❌ Error sending message to ${server}:`, err.message);
                                    }
                                });
                    
                            // Wait for all broadcasts to finish
                            await Promise.all(broadcastPromises);
                    
                            console.log("Case 4 completed");
                    
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({
                                    message: "Message successfully added and broadcasted"
                                })
                            };
                        } catch (err) {
                            console.error("❌ Error in case 4 block:", err.message);
                            return {
                                statusCode: 500,
                                headers,
                                body: JSON.stringify({
                                    message: "Failed to add message or broadcast",
                                    error: err.message
                                })
                            };
                        }
                    }
                    case "5": {
                        try {
                            const {
                                id,
                                userEmail,
                                eventId,
                                eventName,
                                views,
                                feedback,
                                suggestion,
                                markedAt,
                                sourcefog
                            } = response;  // coming from req.body or event.body
                    
                            console.log("Case 5 started");
                    
                            const data = {
                                id,
                                userEmail,
                                eventId,
                                eventName,
                                views,
                                feedback,
                                suggestion,
                                markedAt
                            };
                    
                            console.log("Saving attendance to DynamoDB...");
                    
                            // Save attendance into DynamoDB
                            await docclient.send(new PutCommand({ TableName: table5, Item: data }));
                    
                            console.log("Attendance saved, broadcasting to other fog nodes...");
                    
                            // Broadcast to all fog servers except the sourcefog
                            const broadcastPromises = fogServers
                                .filter((server) => server !== sourcefog)
                                .map(async (server) => {
                                    try {
                                        const res = await axios.post(`${server}/fogsynctable5`, data);
                                        console.log(`✅ Attendance sent to ${server}:`, res.data);
                                    } catch (err) {
                                        console.error(`❌ Error sending attendance to ${server}:`, err.message);
                                    }
                                });
                    
                            // Wait for all broadcasts to finish
                            await Promise.all(broadcastPromises);
                    
                            console.log("Case 5 completed");
                    
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({
                                    message: "Attendance successfully added and broadcasted"
                                })
                            };
                        } catch (err) {
                            console.error("❌ Error in case 5 block:", err.message);
                            return {
                                statusCode: 500,
                                headers,
                                body: JSON.stringify({
                                    message: "Failed to add attendance or broadcast",
                                    error: err.message
                                })
                            };
                        }
                    }
                }       
            }
            catch(err){
                return {
                    statusCode: 502,
                    headers,
                    body: JSON.stringify({ err: "Server Error 502 ... " })
                }
            }
        }
        if (method === "POST" && path.endsWith("/signup")){

            const { username, password, email, classemail, tpoemail, accesstype } = JSON.parse(event.body);
            const id = uuidv4();
            const data = {
                id: id,
                username: username,
                email: email,
                classemail: classemail,
                tpoemail: tpoemail,
                accesstype: accesstype,
                password: password,
                updatedAt: new Date().toISOString(),
            }

            fogServers.forEach((e,index)=>{
                axios.post(`${e}/NewUser`, data)
                .then((res)=>{
                    console.log(res.data);
                })
                .catch((err)=>{
                    console.log(err);
                })
            }
            );

            var existUN = await docclient.send(new GetCommand({ TableName: table, Key: { email } }));

            if (existUN.Item) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        message: "Username is already exist",
                    })
                }
            }
            await docclient.send(new PutCommand({ TableName: table, Item: data }))
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: "User is Sccessfully added",
                    userId: id
                })
            }
        }
    }
    catch (err) {
        console.log(err);
        console.log(method);
        console.log(path);
        return {
            statusCode: 502,
            headers,
            body: JSON.stringify({ err: "Server Error 502 ... " })
        }
    }
}
