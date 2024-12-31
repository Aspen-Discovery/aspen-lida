import 'expo-asset';
import { registerRootComponent } from 'expo';

//console.log("Importing app");
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
//console.log("Registering Root Component");
registerRootComponent(App);
//console.log("Done registering root component");
