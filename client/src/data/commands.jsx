import { DATA as urlList } from './auth'

export let commandsData = [];

export async function getCommands() {
    if (!urlList?.getCommandsRequest) {
        throw new Error("Authentication is required before loading commands");
    }

    try {
        // console.log("Fetching commands from:", urlList.getCommandsRequest);
        const response = await fetch(urlList.getCommandsRequest);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status !== "ok" || !Array.isArray(result.commands)) {
            throw new Error("The server returned an invalid commands response");
        }

        commandsData = result.commands;
        return commandsData;
    } catch (error) {
        console.error("Failed to fetch commands:", error);
        throw error;
    }
}