const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ScanCommand,
    DeleteCommand,
    UpdateCommand
} = require("@aws-sdk/lib-dynamodb");

const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// AWS REGION
const region = "ap-south-1";

// DynamoDB Table Names
const table = "EvolveAuthTable";
const table1 = "FogEvolveDriveTables";
const table2 = "FogEvolveTpoEventTables";
const table3 = "FogEvolveResourceTables";
const table4 = "FogEvolveMessageTables";
const table5 = "FogEvolveAttendanceTables";
const table6 = "FogEvolveEmailTables";
const table7 = "FogServerRegistry";


// Clients
const dynamoClient = new DynamoDBClient({ region });
const docclient = DynamoDBDocumentClient.from(dynamoClient);

const s3 = new S3Client({ region });

let _uuidV4 = null;

const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const getAllFogServers = async () => {

    const result = await docclient.send(
        new ScanCommand({
            TableName: table7
        })
    );

    return result.Items || [];
};

const getIpResult = async (url) => {

    console.log("Checking fog server:", url);

    try {

        const response = await axios.get(`${url}/status`);

        const {
            cpu,
            memory,
            activeJobs,
            status
        } = response.data;

        if (status !== "up") {
            throw new Error("Fog server not up");
        }

        const loadScore =
            safeNumber(cpu) +
            safeNumber(memory) +
            safeNumber(activeJobs) * 10;

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
            error: err.message
        };
    }
};

const getBestFogServer = async () => {

    const fogServers = await getAllFogServers();

    if (fogServers.length === 0) {
        return null;
    }

    const results = await Promise.all(
        fogServers.map(server =>
            getIpResult(server.serverUrl)
        )
    );

    const available =
        results.filter(server => server.status === "up");

    if (available.length === 0) {
        return null;
    }

    return available.reduce(
        (min, curr) =>
            curr.loadScore < min.loadScore ? curr : min
    ).ip;
};

// ---------------------------------------------------------
// VALIDATION & SANITIZATION MIDDLEWARE HELPERS
// ---------------------------------------------------------

/**
 * Escapes special HTML characters to sanitize the input strings and prevent XSS.
 */
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
};

/**
 * Validates the schema and values of input parameters for registry APIs.
 */
const validatePostFogServer = async (body, headers) => {
    console.log("[VALIDATION] Checking request body payload...");

    if (!body) {
        console.warn("[VALIDATION] [FAIL] Request body is empty or missing.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid request. Body is required." })
            }
        };
    }

    let parsed;
    try {
        parsed = typeof body === "string" ? JSON.parse(body) : body;
    } catch (e) {
        console.warn("[VALIDATION] [FAIL] Request body is not valid JSON format.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid JSON request body." })
            }
        };
    }

    let { serverName, serverUrl, description } = parsed;

    // Reject null, undefined, non-strings, or empty values
    if (serverName === undefined || serverName === null || typeof serverName !== 'string') {
        console.warn("[VALIDATION] [FAIL] serverName field is null, undefined, or not a string.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid request: serverName is required and must be a string." })
            }
        };
    }

    if (serverUrl === undefined || serverUrl === null || typeof serverUrl !== 'string') {
        console.warn("[VALIDATION] [FAIL] serverUrl field is null, undefined, or not a string.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid request: serverUrl is required and must be a string." })
            }
        };
    }

    serverName = serverName.trim();
    serverUrl = serverUrl.trim();
    description = description ? String(description).trim() : "";

    if (serverName === "") {
        console.warn("[VALIDATION] [FAIL] serverName is empty after trim.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid request: serverName cannot be empty." })
            }
        };
    }

    if (serverUrl === "") {
        console.warn("[VALIDATION] [FAIL] serverUrl is empty after trim.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid request: serverUrl cannot be empty." })
            }
        };
    }

    // 1. serverName: Min 3, Max 100, letters/numbers/spaces/hyphens/underscores
    const nameRegex = /^[a-zA-Z0-9 _-]{3,100}$/;
    if (!nameRegex.test(serverName)) {
        console.warn(`[VALIDATION] [FAIL] serverName '${serverName}' fails regex ^[a-zA-Z0-9 _-]{3,100}$`);
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid server name. Must be 3-100 characters and contain only letters, numbers, spaces, hyphens, or underscores." })
            }
        };
    }

    // 2. serverUrl: Must start with https://, max 300 characters, valid URL structure
    if (serverUrl.length > 300) {
        console.warn("[VALIDATION] [FAIL] serverUrl exceeds maximum allowed length of 300 characters.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid server URL. Maximum length is 300 characters." })
            }
        };
    }

    if (!serverUrl.startsWith("https://")) {
        console.warn("[VALIDATION] [FAIL] serverUrl protocol is not HTTPS.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid server URL. Must start with https://" })
            }
        };
    }

    try {
        new URL(serverUrl);
    } catch (e) {
        console.warn("[VALIDATION] [FAIL] serverUrl cannot be parsed as a valid URL.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Invalid server URL" })
            }
        };
    }

    // 3. description: Optional, max 500 characters
    if (description && description.length > 500) {
        console.warn("[VALIDATION] [FAIL] description exceeds maximum length of 500 characters.");
        return {
            isValid: false,
            response: {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Description exceeds maximum length of 500 characters." })
            }
        };
    }

    // Sanitize values
    const sanitizedName = sanitizeInput(serverName);
    const sanitizedDescription = sanitizeInput(description);

    console.log("[VALIDATION] [SUCCESS] Parameters passed validation rules.");
    return {
        isValid: true,
        data: {
            serverName: sanitizedName,
            serverUrl,
            description: sanitizedDescription
        }
    };
};

/**
 * Checks for duplicate serverUrl registrations inside the DynamoDB registry table.
 */
const checkDuplicateUrl = async (serverUrl, excludeServerId = null) => {
    console.log(`[VALIDATION] Querying DynamoDB table7 for URL: ${serverUrl}`);
    try {
        const servers = await getAllFogServers();
        const duplicate = servers.find(s => 
            s.serverUrl.toLowerCase().trim() === serverUrl.toLowerCase().trim() && 
            s.serverId !== excludeServerId
        );
        return !!duplicate;
    } catch (err) {
        console.error("[DATABASE] Error performing ScanCommand for duplicate checks:", err);
        throw err;
    }
};

/*
 * FUTURE ENHANCEMENTS FOR FOG SERVER REGISTRY:
 * 1. JWT Authentication: Secure the endpoints by verifying a JWT token in the Authorization header.
 * 2. Role-Based Access Control (RBAC): Ensure only users with "Admin" access type can mutate fog servers.
 * 3. Audit Logs: Record all mutations (POST, PUT, DELETE) in a dedicated AuditLog DynamoDB table.
 * 4. Rate Limiting: Implement request throttling on these routes using API Gateway usage plans.
 */

exports.handler = async (event) => {

    console.log(
        "Incoming event:",
        JSON.stringify(event)
    );

    const method = event.httpMethod;
    const path = event.path;

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
            "POST,GET,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type",
        "Content-Type": "application/json"
    };

    try {

        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message:
                        "Connection Established Successfully."
                })
            };
        }
        // ---------------------------------------------------------
        // FOG SERVER MANAGEMENT
        // ---------------------------------------------------------

        // ADD FOG SERVER
        if (method === "POST" && path.endsWith("/fogserver")) {
            console.log("[API] Incoming request: POST /fogserver");

            const validation = await validatePostFogServer(event.body, headers);
            if (!validation.isValid) {
                return validation.response;
            }

            const { serverName, serverUrl, description } = validation.data;

            // Duplicate URL validation
            let isDuplicate;
            try {
                isDuplicate = await checkDuplicateUrl(serverUrl);
            } catch (err) {
                console.error("[DATABASE] [FAIL] Duplicate check failed due to DynamoDB error:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }

            if (isDuplicate) {
                console.warn(`[VALIDATION] [FAIL] serverUrl '${serverUrl}' is already registered.`);
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        message: "Fog server already registered"
                    })
                };
            }

            if (!_uuidV4) {
                _uuidV4 = (await import("uuid")).v4;
            }

            const serverId = _uuidV4();

            let status = "down";
            let cpu = 0;
            let memory = 0;
            let activeJobs = 0;

            // Reachability Validation
            console.log(`[STATUS CHECK] Performing reachability validation for: ${serverUrl}`);
            try {
                const response = await axios.get(`${serverUrl}/status`, { timeout: 3000 });
                status = "up";
                cpu = safeNumber(response.data.cpu);
                memory = safeNumber(response.data.memory);
                activeJobs = safeNumber(response.data.activeJobs);
                console.log(`[STATUS CHECK] [SUCCESS] Health status UP for ${serverUrl}`);
            } catch (err) {
                status = "down";
                console.warn(`[STATUS CHECK] [FAIL] Health check failed for ${serverUrl}. Error: ${err.message}`);
            }

            const item = {
                serverId,
                serverName,
                serverUrl,
                description,
                status,
                cpu,
                memory,
                activeJobs,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                await docclient.send(
                    new PutCommand({
                        TableName: table7,
                        Item: item
                    })
                );
                console.log(`[DATABASE] [SUCCESS] Successfully inserted new server: ${serverId}`);
            } catch (err) {
                console.error("[DATABASE] [FAIL] PutCommand failed on table7:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: "Fog Server Added",
                    data: item
                })
            };
        }

        // GET ALL FOG SERVERS
        if (method === "GET" && path.endsWith("/fogserver")) {
            console.log("[API] Incoming request: GET /fogserver");

            try {
                const servers = await getAllFogServers();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(servers)
                };
            } catch (err) {
                console.error("[DATABASE] [FAIL] ScanCommand failed on table7:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }
        }

        // UPDATE FOG SERVER
        if (method === "PUT" && path.includes("/fogserver/")) {
            console.log("[API] Incoming request: PUT /fogserver/:id");
            const serverId = path.split("/").pop();

            if (!serverId || serverId.trim() === "") {
                console.warn("[VALIDATION] [FAIL] serverId is missing in request path.");
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: "Invalid request. serverId is required." })
                };
            }

            // Check if server exists in DynamoDB
            let existingServer;
            try {
                const getResult = await docclient.send(
                    new GetCommand({
                        TableName: table7,
                        Key: { serverId }
                    })
                );
                existingServer = getResult.Item;
            } catch (err) {
                console.error("[DATABASE] [FAIL] GetCommand failed on table7:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }

            if (!existingServer) {
                console.warn(`[VALIDATION] [FAIL] Fog server not found for ID: ${serverId}`);
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ message: "Fog server not found" })
                };
            }

            // Validate PUT body
            const validation = await validatePostFogServer(event.body, headers);
            if (!validation.isValid) {
                return validation.response;
            }

            const { serverName, serverUrl, description } = validation.data;

            // Check duplicate URL (excluding the current server ID)
            let isDuplicate;
            try {
                isDuplicate = await checkDuplicateUrl(serverUrl, serverId);
            } catch (err) {
                console.error("[DATABASE] [FAIL] Duplicate check failed on update:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }

            if (isDuplicate) {
                console.warn(`[VALIDATION] [FAIL] serverUrl '${serverUrl}' is already used by another server.`);
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        message: "Fog server already registered"
                    })
                };
            }

            // Perform reachability check for the updated serverUrl
            let status = "down";
            let cpu = 0;
            let memory = 0;
            let activeJobs = 0;

            console.log(`[STATUS CHECK] Performing reachability validation for: ${serverUrl}`);
            try {
                const response = await axios.get(`${serverUrl}/status`, { timeout: 3000 });
                status = "up";
                cpu = safeNumber(response.data.cpu);
                memory = safeNumber(response.data.memory);
                activeJobs = safeNumber(response.data.activeJobs);
                console.log(`[STATUS CHECK] [SUCCESS] Health status UP for ${serverUrl}`);
            } catch (err) {
                status = "down";
                console.warn(`[STATUS CHECK] [FAIL] Health check failed for ${serverUrl}. Error: ${err.message}`);
            }

            try {
                await docclient.send(
                    new UpdateCommand({
                        TableName: table7,
                        Key: { serverId },
                        UpdateExpression:
                            "SET serverName=:n, serverUrl=:u, description=:d, #st=:s, cpu=:c, memory=:m, activeJobs=:j, updatedAt=:t",
                        ExpressionAttributeNames: {
                            "#st": "status"
                        },
                        ExpressionAttributeValues: {
                            ":n": serverName,
                            ":u": serverUrl,
                            ":d": description,
                            ":s": status,
                            ":c": cpu,
                            ":m": memory,
                            ":j": activeJobs,
                            ":t": new Date().toISOString()
                        }
                    })
                );
                console.log(`[DATABASE] [SUCCESS] Successfully updated server: ${serverId}`);
            } catch (err) {
                console.error("[DATABASE] [FAIL] UpdateCommand failed on table7:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: "Server Updated"
                })
            };
        }

        // DELETE FOG SERVER
        if (
            method === "DELETE" &&
            path.includes("/fogserver/")
        ) {
            console.log("[API] Incoming request: DELETE /fogserver/:id");
            const serverId = path.split("/").pop();

            if (!serverId || serverId.trim() === "") {
                console.warn("[VALIDATION] [FAIL] serverId is missing in DELETE path.");
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: "Invalid request. serverId is required." })
                };
            }

            try {
                await docclient.send(
                    new DeleteCommand({
                        TableName: table7,
                        Key: { serverId }
                    })
                );
                console.log(`[DATABASE] [SUCCESS] Successfully deleted server: ${serverId}`);
            } catch (err) {
                console.error("[DATABASE] [FAIL] DeleteCommand failed on table7:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ message: "Unexpected server error." })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: "Server Deleted"
                })
            };
        }

        // ---------------------------------------------------------
        // LOGIN
        // ---------------------------------------------------------
        if (method === "POST" &&
            path.endsWith("/signin")) {

            const {
                username,
                password
            } = JSON.parse(event.body);

            const data =
                await docclient.send(
                    new GetCommand({
                        TableName: table,
                        Key: {
                            email: username
                        }
                    })
                );

            if (
                !data.Item ||
                data.Item.password !== password
            ) {

                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        message:
                            "Invalid username or password"
                    })
                };
            }

            const backendServer =
                await getBestFogServer();

            if (!backendServer) {

                return {
                    statusCode: 503,
                    headers,
                    body: JSON.stringify({
                        message:
                            "Fog servers unavailable"
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

        // ---------------------------------------------------------
        // SIGNUP
        // ---------------------------------------------------------
        if (
            method === "POST" &&
            path.endsWith("/signup")
        ) {

            const {
                username,
                password,
                email,
                classemail,
                tpoemail,
                accesstype
            } = JSON.parse(event.body);

            if (!_uuidV4) {
                _uuidV4 =
                    (await import("uuid")).v4;
            }

            const id = _uuidV4();

            const existingUser =
                await docclient.send(
                    new GetCommand({
                        TableName: table,
                        Key: { email }
                    })
                );

            if (existingUser.Item) {

                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        message:
                            "User already exists"
                    })
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
                updatedAt:
                    new Date().toISOString()
            };

            await docclient.send(
                new PutCommand({
                    TableName: table,
                    Item: data
                })
            );

            const fogServers =
                await getAllFogServers();

            fogServers.forEach(server => {

                axios.post(
                    `${server.serverUrl}/NewUser`,
                    data
                ).catch(() => {});
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message:
                        "User successfully registered",
                    userId: id
                })
            };
        }
                // ---------------------------------------------------------
        // SYNC DATA
        // ---------------------------------------------------------
        if (
            method === "POST" &&
            path.endsWith("/syncdata")
        ) {

            const response =
                JSON.parse(event.body);

            const tableMap = {
                "1": {
                    tableName: table1,
                    endpoint: "/fogsynctable1"
                },
                "2": {
                    tableName: table2,
                    endpoint: "/fogsynctable2"
                },
                "3": {
                    tableName: table3,
                    endpoint: "/fogsynctable3"
                },
                "4": {
                    tableName: table4,
                    endpoint: "/fogsynctable4"
                },
                "5": {
                    tableName: table5,
                    endpoint: "/fogsynctable5"
                },
                "6": {
                    tableName: table6,
                    endpoint: "/fogsynctable6"
                }
            };

            if (!tableMap[response.syncTable]) {

                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        message:
                            "Invalid syncTable type"
                    })
                };
            }

            const {
                tableName,
                endpoint
            } = tableMap[response.syncTable];

            const {
                syncTable,
                sourcefog,
                ...dataToStore
            } = response;

            await docclient.send(
                new PutCommand({
                    TableName: tableName,
                    Item: dataToStore
                })
            );

            const fogServers =
                await getAllFogServers();

            const broadcast = fogServers
                .filter(
                    server =>
                        server.serverUrl !== sourcefog
                )
                .map(server =>
                    axios.post(
                        `${server.serverUrl}${endpoint}`,
                        dataToStore
                    )
                );

            await Promise.allSettled(broadcast);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message:
                        "Data successfully synced and broadcasted"
                })
            };
        }

        // ---------------------------------------------------------
        // UPLOAD RESUME TO S3
        // ---------------------------------------------------------
        if (
            method === "POST" &&
            path.endsWith("/uploadResume")
        ) {

            const {
                userId,
                filename,
                fileContent
            } = JSON.parse(event.body);

            if (
                !userId ||
                !filename ||
                !fileContent
            ) {

                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        message: "Missing fields"
                    })
                };
            }

            const buffer =
                Buffer.from(
                    fileContent,
                    "base64"
                );

            const key =
                `resumes/${userId}/${filename}`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: "bugsymphony-bucket",
                    Key: key,
                    Body: buffer,
                    ContentType: "application/pdf"
                })
            );

            const fileUrl =
                `https://bugsymphony-bucket.s3.ap-south-1.amazonaws.com/${key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message:
                        "Resume uploaded successfully",
                    resumeUrl: fileUrl
                })
            };
        }

        // ---------------------------------------------------------
        // ADMIN FOG URLS MANAGEMENT
        // ---------------------------------------------------------

        // GET FOG URLS
        if (method === "GET" && path.endsWith("/admin/fog-urls")) {
            console.log("[ADMIN API] GET /admin/fog-urls");
            try {
                const result = await docclient.send(
                    new ScanCommand({ TableName: table7 })
                );
                const mapped = (result.Items || []).map(item => ({
                    id: item.serverId,
                    url: item.serverUrl
                }));
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: mapped
                    })
                };
            } catch (err) {
                console.error("[ADMIN API] Error fetching fog URLs:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: "Error fetching fog URLs from registry", error: err.message })
                };
            }
        }

        // ADD FOG URL (POST)
        if (method === "POST" && path.endsWith("/admin/fog-urls")) {
            console.log("[ADMIN API] POST /admin/fog-urls");
            try {
                const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
                const { url } = body || {};
                
                if (!url || typeof url !== "string" || !url.trim()) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: "url is required" })
                    };
                }
                const trimmedUrl = url.trim();

                // Reachability validation
                console.log(`[STATUS CHECK] Performing reachability validation for: ${trimmedUrl}`);
                let cpu = 0;
                let memory = 0;
                let activeJobs = 0;
                try {
                    const response = await axios.get(`${trimmedUrl}/status`, { timeout: 3000 });
                    cpu = safeNumber(response.data.cpu);
                    memory = safeNumber(response.data.memory);
                    activeJobs = safeNumber(response.data.activeJobs);
                    console.log(`[STATUS CHECK] [SUCCESS] Health status UP for ${trimmedUrl}`);
                } catch (err) {
                    console.warn(`[STATUS CHECK] [FAIL] Health check failed for ${trimmedUrl}. Error: ${err.message}`);
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: `Fog server is offline or unreachable at ${trimmedUrl}. Status check failed: ${err.message}`
                        })
                    };
                }

                if (!_uuidV4) {
                    _uuidV4 = (await import("uuid")).v4;
                }
                const serverId = _uuidV4();
                let serverName = trimmedUrl;
                try {
                    serverName = new URL(trimmedUrl).hostname || trimmedUrl;
                } catch (e) {}

                const item = {
                    serverId,
                    serverName,
                    serverUrl: trimmedUrl,
                    description: "Registered via Admin Dashboard",
                    status: "up",
                    cpu,
                    memory,
                    activeJobs,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                await docclient.send(
                    new PutCommand({
                        TableName: table7,
                        Item: item
                    })
                );
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: "Fog URL added successfully",
                        data: {
                            id: serverId,
                            url: trimmedUrl
                        }
                    })
                };
            } catch (err) {
                console.error("[ADMIN API] Error adding fog URL:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: "Failed to add fog URL", error: err.message })
                };
            }
        }

        // UPDATE FOG URL (PUT)
        if (method === "PUT" && path.includes("/admin/fog-urls/")) {
            console.log("[ADMIN API] PUT /admin/fog-urls/:id");
            try {
                const serverId = path.split("/").pop();
                const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
                const { url } = body || {};

                if (!serverId || !url || typeof url !== "string" || !url.trim()) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: "id and url are required" })
                    };
                }
                const trimmedUrl = url.trim();

                // Reachability validation
                console.log(`[STATUS CHECK] Performing reachability validation for: ${trimmedUrl}`);
                let cpu = 0;
                let memory = 0;
                let activeJobs = 0;
                try {
                    const response = await axios.get(`${trimmedUrl}/status`, { timeout: 3000 });
                    cpu = safeNumber(response.data.cpu);
                    memory = safeNumber(response.data.memory);
                    activeJobs = safeNumber(response.data.activeJobs);
                } catch (err) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: `Fog server is offline or unreachable at ${trimmedUrl}. Status check failed: ${err.message}`
                        })
                    };
                }

                let serverName = trimmedUrl;
                try {
                    serverName = new URL(trimmedUrl).hostname || trimmedUrl;
                } catch (e) {}

                await docclient.send(
                    new UpdateCommand({
                        TableName: table7,
                        Key: { serverId },
                        UpdateExpression: "SET serverName=:n, serverUrl=:u, #st=:s, cpu=:c, memory=:m, activeJobs=:j, updatedAt=:t",
                        ExpressionAttributeNames: { "#st": "status" },
                        ExpressionAttributeValues: {
                            ":n": serverName,
                            ":u": trimmedUrl,
                            ":s": "up",
                            ":c": cpu,
                            ":m": memory,
                            ":j": activeJobs,
                            ":t": new Date().toISOString()
                        }
                    })
                );

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: "Fog URL updated successfully"
                    })
                };
            } catch (err) {
                console.error("[ADMIN API] Error updating fog URL:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: "Failed to update fog URL", error: err.message })
                };
            }
        }

        // DELETE FOG URL (DELETE)
        if (method === "DELETE" && path.includes("/admin/fog-urls/")) {
            console.log("[ADMIN API] DELETE /admin/fog-urls/:id");
            try {
                const serverId = path.split("/").pop();
                if (!serverId) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: "serverId is required" })
                    };
                }

                await docclient.send(
                    new DeleteCommand({
                        TableName: table7,
                        Key: { serverId }
                    })
                );

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: "Fog URL deleted successfully"
                    })
                };
            } catch (err) {
                console.error("[ADMIN API] Error deleting fog URL:", err);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: "Failed to delete fog URL", error: err.message })
                };
            }
        }

        // ---------------------------------------------------------
        // FALLBACK
        // ---------------------------------------------------------
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                message:
                    "Invalid route or method."
            })
        };

    } catch (err) {

        console.error(
            "❌ General error:",
            err
        );

        return {
            statusCode: 502,
            headers,
            body: JSON.stringify({
                message: "Server Error 502",
                error: err.message
            })
        };
    }
};
