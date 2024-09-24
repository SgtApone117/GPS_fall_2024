import { MapContainer } from 'react-leaflet/MapContainer'
import { TileLayer } from 'react-leaflet/TileLayer'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import "leaflet-defaulticon-compatibility";
import 'leaflet/dist/leaflet.css'
const position = [51.505, -0.09];
const SimpleMap = ({random}) => {
    console.log(random);
    return(
        <>
            <MapContainer
                    center={position} 
                    zoom={13}
                    id='map'
                >
                <TileLayer
                    attribution="Google Maps"
                    url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
                />
            </MapContainer>
        </>
    )
}
export default SimpleMap;