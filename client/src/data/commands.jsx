import { DATA as urlList } from './auth'

export var COMMANDS_DATA;

async function getCommands()
{
    try{
        const response = await fetch(urlList.getCommandsRequest);

        if(!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

        COMMANDS_DATA = await response.json();
        console.log("Get commands success");
        return (true)
    }
    catch (error) {
        console.error('Failed to fetch data: ', error);
        return (false)
    }  
}