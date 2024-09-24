import SimpleMap from './Components/SimpleMap';
import 'leaflet/dist/leaflet.css'
const App = () => {
  return (
    <div>
      <h1>Vehicle Navigation System Demo</h1>
      <SimpleMap random='test'/>
    </div>
  );
}

export default App
