import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// NOTE: StrictMode intentionally omitted. This showcase mounts/unmounts many
// WebGL effects on scroll (LazyStage); StrictMode's dev double-invoke fights the
// GL context lifecycle. Without it we can cleanly loseContext() on real unmount.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
