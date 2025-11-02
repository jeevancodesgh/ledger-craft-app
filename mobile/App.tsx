import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation';
import './global.css';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  );
}
