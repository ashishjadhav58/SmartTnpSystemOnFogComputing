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

const dynamoClient = new DynamoDBClient({ region });
const docclient = DynamoDBDocumentClient.from(dynamoClient);

const fogServers = [
    "https://98afe68b5741.ngrok-free.app",
    "https://f82b43b55a75.ngrok-free.app"
];

// Utility to ensure numeric input
const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

// Improved fog status fetcher
const getIpResult = async (url) => {
    console.log("Checking fog server:", url);
    try {
        const response = await axios.get(`${url}/status`);
        const { cpu, memory, activeJobs, status } = response.data;

        if (status !== "up") {
            throw new Error("Fog server not up");
        }

        const loadScore = safeNumber(cpu) + safeNumber(memory) + safeNumber(activeJobs) * 10;

        return {
            ip: url,
            cpu: safeNumber(cpu),
            memory: safeNumber(memory),
            activeJobs: safeNumber(activeJobs),
            status,
            loadScore
        };
    } catch (err) {
        console.error(`❌ Error getting status for ${url}: ${err.message}`);
        return {
            ip: url,
            status: "down",
            loadScore: Number.POSITIVE_INFINITY,
            error: err.message
        };
    }
};

// Chooses the best fog server
const getBestFogServer = async () => {
    console.log("Fetching best fog server...");
    const results = await Promise.all(fogServers.map(getIpResult));

    console.log("Fog server status summary:", results);

    const available = results.filter(server => server.status === "up");

    if (available.length === 0) {
        return { message: "No active fog servers found" };
    }

    const best = available.reduce((min, curr) => curr.loadScore < min.loadScore ? curr : min);
    console.log("Selected best fog server:", best.ip);

    return best.ip;
};

exports.handler = async (event) => {
    console.log("Incoming event:", JSON.stringify(event));
    const method = event.httpMethod;
    const path = event.path;

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "Connection Established Successfully." })
            };
        }

        if (method === "POST" && path.endsWith("/signin")) {
            console.log("Processing /signin");

            const { username, password } = JSON.parse(event.body);

            const data = await docclient.send(new GetCommand({ TableName: table, Key: { email: username } }));

            if (!data.Item || data.Item.password !== password) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ message: "Invalid username or password" })
                };
            }

            const backendServer = await getBestFogServer();

            if (!backendServer || typeof backendServer !== "string") {
                return {
                    statusCode: 503,
                    headers,
                    body: JSON.stringify({
                        message: backendServer.message || "Fog servers unavailable"
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    data: data.Item,
                    ip: backendServer,
                    message: "Login Successful"
                })
            };
        }

        if (method === "POST" && path.endsWith("/signup")) {
            const { username, password, email, classemail, tpoemail, accesstype } = JSON.parse(event.body);
            const id = uuidv4();

            const existingUser = await docclient.send(new GetCommand({ TableName: table, Key: { email } }));
            if (existingUser.Item) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ message: "User already exists" })
                };
            }

            const data = {
                id,
                username,
                email,
                classemail,
                tpoemail,
                accesstype,
                password,
                updatedAt: new Date().toISOString(),
            };

            await docclient.send(new PutCommand({ TableName: table, Item: data }));

            // Notify other fog nodes
            fogServers.forEach(server => {
                axios.post(`${server}/NewUser`, data)
                    .then(res => console.log(`✅ Sent to ${server}:`, res.data))
                    .catch(err => console.error(`❌ Error sending to ${server}:`, err.message));
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "User successfully registered", userId: id })
            };
        }

        if (method === "POST" && path.endsWith("/syncdata")) {
            console.log("Syncing data...");
            const response = JSON.parse(event.body);
            const synctable = response.syncTable;
            const sourcefog = response.sourcefog;

            const tableMap = {
                "1": { tableName: table1, endpoint: "/fogsynctable1" },
                "2": { tableName: table2, endpoint: "/fogsynctable2" },
                "3": { tableName: table3, endpoint: "/fogsynctable3" },
                "4": { tableName: table4, endpoint: "/fogsynctable4" },
                "5": { tableName: table5, endpoint: "/fogsynctable5" }
            };

            if (!tableMap[synctable]) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: "Invalid syncTable type" })
                };
            }

            const { tableName, endpoint } = tableMap[synctable];

            const { syncTable, sourcefog: _, ...dataToStore } = response;

            // Save to local DynamoDB
            await docclient.send(new PutCommand({ TableName: tableName, Item: dataToStore }));

            // Broadcast to other fog servers
            const broadcastPromises = fogServers
                .filter(server => server !== sourcefog)
                .map(server => {
                    return axios.post(`${server}${endpoint}`, dataToStore)
                        .then(res => console.log(`✅ Broadcasted to ${server}:`, res.data))
                        .catch(err => console.error(`❌ Failed to broadcast to ${server}:`, err.message));
                });

            await Promise.all(broadcastPromises);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "Data successfully synced and broadcasted" })
            };
        }

        // Fallback for undefined routes
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Invalid route or method." })
        };

    } catch (err) {
        console.error("❌ General error:", err);
        return {
            statusCode: 502,
            headers,
            body: JSON.stringify({ message: "Server Error 502", error: err.message })
        };
    }
};
