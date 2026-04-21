import Hero from './components/Hero.jsx';
import Navbar from './components/Navbar.jsx';
import ValueProp from './components/ValueProp.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ValueProp />
    </div>
  );
}
