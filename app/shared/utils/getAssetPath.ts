export default function getAssetPath(path: string){
	return import.meta.env["BASE_URL"] + '../assets/' + path 
}
