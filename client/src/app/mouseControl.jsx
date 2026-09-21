import { MouseControlPage } from "../component/mouseControlPage";
import { useLocalSearchParams } from 'expo-router';

export default function MouseControl()
{
    const { item } = useLocalSearchParams();
    const params = JSON.parse(item);

    return(
        <MouseControlPage item={params}/>
    )
}