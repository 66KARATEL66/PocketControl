async function parseResponse(response, operation) {
    if (!response.ok) {
        throw new Error(`${operation} failed with status ${response.status}`);
    }

    const result = await response.json();
    if (result.status === "error" || result.success === false) {
        const error = new Error(result.reason || result.error || `${operation} was rejected`);
        error.code = result.reason;
        throw error;
    }

    return result;
}

export async function fetchCommands(session) {
    const response = await fetch(session.getCommandsRequest, {
        headers: {
            "X-Device-ID": session.deviceId,
        },
    });
    const result = await parseResponse(response, "Fetching commands");

    if (!Array.isArray(result.commands)) {
        throw new Error("The server returned an invalid command configuration");
    }

    return result.commands;
}

export async function executeCommand(session, command) {
    const response = await fetch(session.commandRequest, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            command: command.command,
            args: command.args || {},
            device_id: session.deviceId,
        }),
    });

    return parseResponse(response, "Command execution");
}
